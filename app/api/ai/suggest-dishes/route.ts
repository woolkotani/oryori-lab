import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { parseJsonField } from "@/lib/utils";
import { pickRandomDishes } from "@/lib/dish-database";
import type { Ingredient } from "@/lib/types";

function mockSuggestions(fridgeIngredients?: string[]) {
  const dishes = pickRandomDishes(3, fridgeIngredients ?? []);
  return dishes.map((d) => ({
    name: d.name,
    reason: d.reason,
    estimatedTime: ["15分", "30分", "45分"][Math.floor(Math.random() * 3)],
    matchedIngredients:
      fridgeIngredients && fridgeIngredients.length > 0
        ? d.keyIngredients.filter((ing) =>
            fridgeIngredients.some(
              (input) => ing.includes(input) || input.includes(ing)
            )
          )
        : [],
  }));
}

export async function POST(req: NextRequest) {
  const { fridgeIngredients } = (await req.json()) as {
    fridgeIngredients?: string[];
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      suggestions: mockSuggestions(fridgeIngredients),
      isMock: true,
    });
  }

  try {
    const dishes = await prisma.dish.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { recipe: true },
    });

    const dishSummary = dishes
      .map((d) => {
        const ingredients = parseJsonField<Ingredient[]>(
          d.recipe?.ingredients ?? "[]",
          []
        );
        const tags = parseJsonField<string[]>(d.tags, []);
        return `- ${d.name} [${tags.join(", ")}] (材料: ${ingredients.map((i) => i.name).join(", ") || "未登録"})`;
      })
      .join("\n");

    const fridgeSection = fridgeIngredients?.length
      ? `\n冷蔵庫の食材: ${fridgeIngredients.join(", ")}`
      : "";

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `あなたは料理の提案をするアシスタントです。

過去に作った料理の記録:
${dishSummary || "（まだ記録なし）"}
${fridgeSection}

上記の記録と${fridgeIngredients?.length ? "冷蔵庫の食材" : "過去の傾向"}をもとに、今日作るべき料理を3つ提案してください。

以下のJSON形式のみで返答してください：
[
  {
    "name": "料理名",
    "reason": "提案理由（1文）",
    "estimatedTime": "調理時間の目安",
    "matchedIngredients": ["使える食材1", "使える食材2"]
  }
]`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "[]";
    const match = text.match(/\[[\s\S]+\]/);
    const suggestions = match ? JSON.parse(match[0]) : [];
    return NextResponse.json({ suggestions, isMock: false });
  } catch {
    return NextResponse.json({
      suggestions: mockSuggestions(fridgeIngredients),
      isMock: true,
    });
  }
}
