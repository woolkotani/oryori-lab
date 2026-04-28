import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { parseJsonField } from "@/lib/utils";
import { pickRandomDishes } from "@/lib/dish-database";
import type { Ingredient } from "@/lib/types";

interface MatchResult {
  id: string;
  name: string;
  reason: string;
  cookingTime: string;
  tags: string[];
  matchScore?: number;
  availableIngredients?: string[];
  missingIngredients?: string[];
  isFromDb?: boolean;
}

async function localMatch(
  fridgeIngredients: string[]
): Promise<MatchResult[]> {
  // 1. Try Recipe-based match first (most accurate)
  const recipes = await prisma.recipe.findMany({ include: { dish: true } });
  const recipeMatches: MatchResult[] = recipes
    .map((r) => {
      const ings = parseJsonField<Ingredient[]>(r.ingredients, []).map(
        (i) => i.name
      );
      const available: string[] = [];
      const missing: string[] = [];
      ings.forEach((ing) => {
        const has = fridgeIngredients.some(
          (input) => ing.includes(input) || input.includes(ing)
        );
        if (has) available.push(ing);
        else missing.push(ing);
      });
      const score =
        ings.length === 0 ? 0 : Math.round((available.length / ings.length) * 100);
      const tags = parseJsonField<string[]>(r.dish.tags, []);
      return {
        id: r.dishId,
        name: r.dish.name,
        reason: `材料 ${available.length}/${ings.length} が揃っています`,
        cookingTime: "30分前後",
        tags,
        matchScore: score,
        availableIngredients: available,
        missingIngredients: missing,
        isFromDb: true,
      };
    })
    .filter((m) => (m.matchScore ?? 0) > 0);

  // 2. Also search Dish records (name/memo/tags) for keyword matches
  const allDishes = await prisma.dish.findMany();
  const seen = new Set(recipeMatches.map((m) => m.id));
  const dishMatches: MatchResult[] = allDishes
    .filter((d) => !seen.has(d.id))
    .map((d) => {
      const tags = parseJsonField<string[]>(d.tags, []);
      const haystack = `${d.name} ${d.memo ?? ""} ${tags.join(" ")}`.toLowerCase();
      const matched = fridgeIngredients.filter((ing) =>
        haystack.includes(ing.toLowerCase())
      );
      return {
        dish: d,
        tags,
        matched,
        score: matched.length === 0 ? 0 : Math.min(100, matched.length * 40),
      };
    })
    .filter((m) => m.score > 0)
    .map((m) => ({
      id: m.dish.id,
      name: m.dish.name,
      reason: `「${m.matched.join("、")}」に関連する過去の料理です`,
      cookingTime: "記録あり",
      tags: m.tags,
      matchScore: m.score,
      availableIngredients: m.matched,
      missingIngredients: [],
      isFromDb: true,
    }));

  const combined = [...recipeMatches, ...dishMatches]
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
    .slice(0, 3);

  // 3. If still no matches, fall back to seasonal samples (no DB id)
  if (combined.length === 0) {
    const samples = pickRandomDishes(3, fridgeIngredients);
    return samples.map((s) => ({
      id: `sample-${s.name}`,
      name: s.name,
      reason: s.reason + "（サンプル提案）",
      cookingTime: "20〜30分",
      tags: [s.season === "通年" ? "定番" : `${s.season}の旬`],
      matchScore: 0,
      availableIngredients: s.keyIngredients.filter((ing) =>
        fridgeIngredients.some(
          (input) => ing.includes(input) || input.includes(ing)
        )
      ),
      missingIngredients: [],
      isFromDb: false,
    }));
  }

  return combined;
}

export async function POST(req: NextRequest) {
  const { fridgeIngredients } = (await req.json()) as {
    fridgeIngredients: string[];
  };

  if (!fridgeIngredients?.length) {
    return NextResponse.json({ matches: [], isMock: true });
  }

  const localMatches = await localMatch(fridgeIngredients);

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ matches: localMatches, isMock: true });
  }

  try {
    const recipes = await prisma.recipe.findMany({ include: { dish: true } });
    if (recipes.length === 0) {
      return NextResponse.json({ matches: localMatches, isMock: true });
    }

    const recipeList = recipes
      .map((r) => {
        const ingredients = parseJsonField<Ingredient[]>(r.ingredients, []);
        return `ID:${r.dishId} 「${r.dish.name}」 材料:${ingredients.map((i) => i.name).join(", ")}`;
      })
      .join("\n");

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `冷蔵庫の食材: ${fridgeIngredients.join(", ")}

アーカイブされたレシピ一覧:
${recipeList}

冷蔵庫の食材で作れる、または大部分の材料が揃っているレシピを最大3つ選んでください。

以下のJSON形式のみで返答してください：
[
  {
    "id": "レシピのID",
    "name": "料理名",
    "reason": "なぜマッチしたか1文",
    "cookingTime": "調理時間の目安",
    "tags": ["タグ1"],
    "matchScore": 0〜100の一致度,
    "availableIngredients": ["手元にある材料"],
    "missingIngredients": ["不足している材料"]
  }
]`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "[]";
    const match = text.match(/\[[\s\S]+\]/);
    const matches = match ? JSON.parse(match[0]) : localMatches;
    return NextResponse.json({ matches, isMock: false });
  } catch {
    return NextResponse.json({ matches: localMatches, isMock: true });
  }
}
