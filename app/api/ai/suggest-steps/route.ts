import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import type { Ingredient } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { dishName, ingredients } = await req.json() as {
    dishName: string;
    ingredients: Ingredient[];
  };

  if (!dishName) {
    return NextResponse.json({ error: "dishName required" }, { status: 400 });
  }

  const ingredientList = ingredients
    .map((i) => `- ${i.name} ${i.amount}${i.unit}`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `料理「${dishName}」のレシピ手順をマークダウン形式で提案してください。

材料リスト:
${ingredientList || "（材料未登録）"}

以下の形式で手順のみを返してください（余分な説明不要）：

## 手順

1. ...
2. ...
3. ...

※ 簡潔で実践的な手順をお願いします。`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  return NextResponse.json({ steps: text });
}
