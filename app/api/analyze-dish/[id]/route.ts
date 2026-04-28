import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { anthropic, MODEL } from "@/lib/anthropic";
import { parseJsonField } from "@/lib/utils";

interface AnalysisResult {
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  healthScore: number;
  healthComment: string;
  suggestedNutrients: {
    nutrient: string;
    reason: string;
    foods: string[];
  }[];
  overallScore: number;
  scoreBreakdown: {
    nutrition: number;
    creativity: number;
    seasonality: number;
    cost: number;
  };
  comment: string;
  isMock?: boolean;
}

function generateMockAnalysis(dishName: string): AnalysisResult {
  const seed = dishName.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const r = (offset: number, min: number, max: number) =>
    Math.floor(((seed * (offset + 7)) % 100) / 100 * (max - min) + min);

  const calories = r(1, 300, 750);
  const protein = r(2, 12, 35);
  const fat = r(3, 8, 30);
  const carbs = r(4, 30, 90);

  const isHeavy = calories > 600;
  const isHighProtein = protein > 25;

  const healthScore = r(5, 55, 90);
  const overallScore = r(6, 65, 92);

  return {
    nutrition: { calories, protein, fat, carbs },
    healthScore,
    healthComment: isHeavy
      ? "やや高カロリーですが満足感のある一品です"
      : isHighProtein
        ? "良質なタンパク質が摂れるバランスの良い料理です"
        : "軽めの食事として最適です",
    suggestedNutrients: [
      {
        nutrient: "ビタミンC",
        reason: "野菜の摂取が少なめなので追加で",
        foods: ["みかん", "ブロッコリー", "パプリカ"],
      },
      {
        nutrient: "食物繊維",
        reason: "腸内環境のために",
        foods: ["きのこ類", "海藻", "豆類"],
      },
      {
        nutrient: "カルシウム",
        reason: "1日の推奨量を満たすため",
        foods: ["牛乳", "ヨーグルト", "小松菜"],
      },
    ],
    overallScore,
    scoreBreakdown: {
      nutrition: r(7, 60, 90),
      creativity: r(8, 65, 95),
      seasonality: r(9, 60, 95),
      cost: r(10, 65, 90),
    },
    comment:
      "家庭料理としてバランスの良い一品。次回は野菜を一品追加するとさらに健康的になります。",
    isMock: true,
  };
}

async function analyzeWithAI(
  dishName: string,
  memo: string | null,
  tags: string[],
  imagePath: string | null
): Promise<AnalysisResult> {
  type ImgMediaType = "image/png" | "image/webp" | "image/jpeg" | "image/gif";
  type ContentBlock =
    | { type: "text"; text: string }
    | {
        type: "image";
        source: { type: "base64"; media_type: ImgMediaType; data: string };
      };
  const content: ContentBlock[] = [];

  if (imagePath) {
    try {
      const fullPath = path.join(process.cwd(), "public", imagePath);
      const buf = await readFile(fullPath);
      const ext = imagePath.split(".").pop()?.toLowerCase() ?? "jpeg";
      const mediaType: ImgMediaType =
        ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: buf.toString("base64"),
        },
      });
    } catch {
      // Image read failed, continue without image
    }
  }

  content.push({
    type: "text",
    text: `料理名: ${dishName}
タグ: ${tags.join(", ") || "なし"}
メモ: ${memo || "なし"}

この料理を栄養士・料理評論家として分析してください。${imagePath ? "添付画像も参考に。" : ""}

以下のJSON形式のみで返答（説明文は不要）：
{
  "nutrition": {
    "calories": 1人前のkcal,
    "protein": タンパク質g,
    "fat": 脂質g,
    "carbs": 炭水化物g
  },
  "healthScore": 健康度0-100,
  "healthComment": "健康度の理由を1文で",
  "suggestedNutrients": [
    {
      "nutrient": "不足しがちな栄養素名",
      "reason": "なぜ補うべきか1文",
      "foods": ["補える食品1", "食品2", "食品3"]
    }
  ],
  "overallScore": 料理の総合評価0-100,
  "scoreBreakdown": {
    "nutrition": 栄養スコア0-100,
    "creativity": 工夫・独創性0-100,
    "seasonality": 旬の食材活用0-100,
    "cost": コスパ0-100
  },
  "comment": "料理全体への評価コメント1-2文"
}

suggestedNutrientsは2-3個。`,
  });

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: "user", content }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "{}";
  const match = text.match(/\{[\s\S]+\}/);
  if (!match) throw new Error("AI response parse failed");
  return JSON.parse(match[0]) as AnalysisResult;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dish = await prisma.dish.findUnique({ where: { id } });
  if (!dish) {
    return NextResponse.json({ error: "dish not found" }, { status: 404 });
  }

  const tags = parseJsonField<string[]>(dish.tags, []);
  const hasKey = !!process.env.ANTHROPIC_API_KEY;

  let analysis: AnalysisResult;
  if (hasKey) {
    try {
      analysis = await analyzeWithAI(dish.name, dish.memo, tags, dish.photo);
    } catch (e) {
      analysis = generateMockAnalysis(dish.name);
      analysis.comment = "（AI 分析に失敗したため簡易判定）" + analysis.comment;
    }
  } else {
    analysis = generateMockAnalysis(dish.name);
  }

  return NextResponse.json(analysis);
}
