import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { parseJsonField } from "@/lib/utils";
import type { Ingredient } from "@/lib/types";

function getSeason(): { season: string; month: number; hint: string } {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5)
    return {
      season: "春",
      month,
      hint: "春キャベツ、新玉ねぎ、たけのこ、菜の花、いちご、あさり",
    };
  if (month >= 6 && month <= 8)
    return {
      season: "夏",
      month,
      hint: "トマト、なす、ピーマン、きゅうり、とうもろこし、枝豆、すいか",
    };
  if (month >= 9 && month <= 11)
    return {
      season: "秋",
      month,
      hint: "さつまいも、かぼちゃ、きのこ、栗、さんま、柿、りんご",
    };
  return {
    season: "冬",
    month,
    hint: "白菜、大根、ねぎ、ほうれん草、ぶり、牡蠣、みかん",
  };
}

export async function POST(req: NextRequest) {
  const { ingredients } = (await req.json()) as { ingredients?: string[] };

  const dishes = await prisma.dish.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { recipe: true },
  });

  const tagCount: Record<string, number> = {};
  const dishNames = dishes.map((d) => {
    const tags = parseJsonField<string[]>(d.tags, []);
    tags.forEach((t) => (tagCount[t] = (tagCount[t] ?? 0) + 1));
    return d.name;
  });

  const topTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  const { season, month, hint } = getSeason();

  const ingredientLine = ingredients?.length
    ? `\nこれから使いたい材料: ${ingredients.join(", ")}`
    : "";

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `あなたは料理提案のプロです。以下の情報をもとに、今日作るのにおすすめの料理を3つ提案してください。

【現在】${month}月（${season}）
【旬の食材例】${hint}
【ユーザーがよく作るジャンル】${topTags.length ? topTags.join(", ") : "（記録なし）"}
【最近作った料理】${dishNames.slice(0, 8).join(", ") || "（記録なし）"}${ingredientLine}

提案条件:
- 季節感を大切にする
- ユーザーの好み（よく作るジャンル）を尊重しつつ、最近作っていないものを優先
- 入力された材料があれば必ず活用する
- 実用的で家庭で作れるもの

以下のJSON形式のみで返答してください：
[
  {
    "name": "料理名",
    "season": "季節キーワード（例：春の香り）",
    "reason": "提案理由（旬・好み・材料活用などに触れて1〜2文）",
    "keyIngredients": ["主な材料1", "主な材料2", "主な材料3"]
  }
]`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "[]";

  try {
    const match = text.match(/\[[\s\S]+\]/);
    const suggestions = match ? JSON.parse(match[0]) : [];
    return NextResponse.json({ suggestions, season, month });
  } catch {
    return NextResponse.json({ suggestions: [], season, month });
  }
}
