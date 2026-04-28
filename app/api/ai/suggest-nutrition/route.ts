import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import type { Ingredient } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { dishName, ingredients } = await req.json() as {
    dishName: string;
    ingredients: Ingredient[];
  };

  const ingredientList = ingredients
    .map((i) => `- ${i.name} ${i.amount}${i.unit}`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `料理「${dishName}」の概算栄養素を推定してください。

材料:
${ingredientList || "（材料未登録）"}

以下のJSON形式のみで返答してください（説明不要）：
{"calories": 数値, "protein": 数値, "fat": 数値, "carbs": 数値}

単位: calories=kcal, protein/fat/carbs=g（1人前）`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "{}";

  try {
    const match = text.match(/\{[^}]+\}/);
    const nutrition = match ? JSON.parse(match[0]) : {};
    return NextResponse.json(nutrition);
  } catch {
    return NextResponse.json({ error: "parse error" }, { status: 500 });
  }
}
