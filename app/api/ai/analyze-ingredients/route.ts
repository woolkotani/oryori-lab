import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import type { Ingredient } from "@/lib/types";

const MOCK_INGREDIENTS: Ingredient[] = [
  { name: "鶏もも肉", amount: "200", unit: "g", cost: 380 },
  { name: "玉ねぎ", amount: "1", unit: "個", cost: 50 },
  { name: "にんじん", amount: "1/2", unit: "本", cost: 40 },
  { name: "じゃがいも", amount: "2", unit: "個", cost: 80 },
  { name: "醤油", amount: "大さじ2", unit: "適量", cost: 10 },
];

export async function POST(req: NextRequest) {
  const { imageUrl } = (await req.json()) as { imageUrl: string };

  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  if (!hasKey) {
    return NextResponse.json({
      ingredients: MOCK_INGREDIENTS,
      isMock: true,
    });
  }

  try {
    // Fetch the image - imageUrl is like /uploads/xxx.jpg, need to read from disk
    const { readFile } = await import("fs/promises");
    const path = await import("path");
    const fullPath = path.join(process.cwd(), "public", imageUrl);
    const buf = await readFile(fullPath);
    const ext = imageUrl.split(".").pop()?.toLowerCase() ?? "jpeg";
    const mediaType =
      ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: buf.toString("base64"),
              },
            },
            {
              type: "text",
              text: `この写真に写っている料理の材料を全てリストアップしてください。

各材料について以下を推定：
- 名前（例：鶏もも肉、玉ねぎ）
- 量（数値、例：200, 1, 1/2）
- 単位（g, ml, 個, 枚, 本, カップ, 大さじ, 小さじ, 適量 のいずれか）
- 概算金額（日本のスーパーでの目安価格）

以下のJSON形式のみで返答（説明文不要）：
{
  "ingredients": [
    { "name": "材料名", "amount": "量", "unit": "単位", "cost": 円 }
  ]
}`,
            },
          ],
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "{}";
    const match = text.match(/\{[\s\S]+\}/);
    if (!match) throw new Error("parse failed");
    const parsed = JSON.parse(match[0]);
    return NextResponse.json({
      ingredients: parsed.ingredients ?? [],
      isMock: false,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ingredients: MOCK_INGREDIENTS,
        isMock: true,
        error: e instanceof Error ? e.message : "解析エラー",
      },
      { status: 200 }
    );
  }
}
