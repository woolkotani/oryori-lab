"use client";

import { useState } from "react";

interface AnalysisResult {
  nutrition: { calories: number; protein: number; fat: number; carbs: number };
  healthScore: number;
  healthComment: string;
  suggestedNutrients: { nutrient: string; reason: string; foods: string[] }[];
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

function scoreColor(score: number): string {
  if (score >= 85) return "#22c55e"; // green-500
  if (score >= 70) return "#f97316"; // orange-500
  if (score >= 50) return "#eab308"; // yellow-500
  return "#f87171"; // red-400
}

function scoreGradient(score: number): string {
  if (score >= 85) return "linear-gradient(135deg, #4ade80, #22c55e)";
  if (score >= 70) return "linear-gradient(135deg, #fb923c, #f97316)";
  if (score >= 50) return "linear-gradient(135deg, #facc15, #eab308)";
  return "linear-gradient(135deg, #fca5a5, #f87171)";
}

export default function DishAnalysis({ dishId }: { dishId: string }) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analyze-dish/${dishId}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("分析に失敗しました");
      const data = (await res.json()) as AnalysisResult;
      setAnalysis(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  if (!analysis) {
    return (
      <div className="card p-4">
        <h2 className="font-bold text-gray-700 mb-2">🤖 リョボットの料理評価</h2>
        <p className="text-xs text-gray-400 mb-3">
          リョボットが料理名と写真から栄養素・健康度・100点満点で評価するよ
        </p>
        <button
          onClick={analyze}
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-400 to-pink-400 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-orange-500 hover:to-pink-500 transition-all disabled:opacity-50"
        >
          {loading ? "リョボットが採点中..." : "🤖 リョボットに評価してもらう"}
        </button>
        {loading && (
          <div className="text-center py-4 text-gray-400">
            <div className="text-2xl animate-bounce">🤖</div>
            <p className="text-xs mt-1">リョボットが分析しています...</p>
          </div>
        )}
        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg p-3">
            ⚠ {error}
          </div>
        )}
      </div>
    );
  }

  const a = analysis;

  return (
    <div className="space-y-4">
      {/* Overall score hero */}
      <div
        className="card p-5 text-white"
        style={{ background: scoreGradient(a.overallScore) }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-xs">料理度スコア</p>
            <p className="text-5xl font-black mt-1">
              {a.overallScore}
              <span className="text-2xl font-normal">/100</span>
            </p>
          </div>
          <div className="text-6xl">
            {a.overallScore >= 90
              ? "🏆"
              : a.overallScore >= 75
                ? "🌟"
                : a.overallScore >= 60
                  ? "👍"
                  : "💪"}
          </div>
        </div>
        <p className="text-sm text-white/90 mt-3">{a.comment}</p>
        {a.isMock && (
          <p className="text-xs text-white/70 mt-2">
            ※ APIキー未設定のため簡易判定（実際はAIで詳細分析されます）
          </p>
        )}
      </div>

      {/* Score breakdown */}
      <div className="card p-4">
        <h3 className="font-bold text-gray-700 mb-3">スコア内訳</h3>
        <div className="space-y-3">
          {[
            { label: "栄養バランス", value: a.scoreBreakdown.nutrition, icon: "🥗" },
            { label: "工夫・独創性", value: a.scoreBreakdown.creativity, icon: "💡" },
            { label: "旬の食材", value: a.scoreBreakdown.seasonality, icon: "🌿" },
            { label: "コスパ", value: a.scoreBreakdown.cost, icon: "💰" },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">
                  {item.icon} {item.label}
                </span>
                <span
                  className="font-bold"
                  style={{ color: scoreColor(item.value) }}
                >
                  {item.value}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${item.value}%`,
                    background: scoreGradient(item.value),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nutrition values */}
      <div className="card p-4">
        <h3 className="font-bold text-gray-700 mb-3">推定栄養素（1人前）</h3>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: "カロリー", value: a.nutrition.calories, unit: "kcal", color: "bg-orange-50 text-orange-600" },
            { label: "タンパク質", value: a.nutrition.protein, unit: "g", color: "bg-blue-50 text-blue-600" },
            { label: "脂質", value: a.nutrition.fat, unit: "g", color: "bg-yellow-50 text-yellow-600" },
            { label: "炭水化物", value: a.nutrition.carbs, unit: "g", color: "bg-green-50 text-green-600" },
          ].map((n) => (
            <div key={n.label} className={`rounded-xl p-2 ${n.color}`}>
              <p className="text-xs opacity-70">{n.label}</p>
              <p className="text-base font-bold mt-0.5">
                {n.value}
                <span className="text-xs font-normal ml-0.5">{n.unit}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Health score */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-700">💪 健康度</h3>
          <span
            className="text-2xl font-bold"
            style={{ color: scoreColor(a.healthScore) }}
          >
            {a.healthScore}
            <span className="text-xs text-gray-400 ml-1">/100</span>
          </span>
        </div>
        <p className="text-sm text-gray-600">{a.healthComment}</p>
      </div>

      {/* Suggested nutrients */}
      <div className="card p-4">
        <h3 className="font-bold text-gray-700 mb-1">🥦 今日追加で摂りたい栄養</h3>
        <p className="text-xs text-gray-400 mb-3">
          1日の栄養バランスを整えるために
        </p>
        <div className="space-y-3">
          {a.suggestedNutrients.map((n, i) => (
            <div key={i} className="bg-green-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-green-700">{n.nutrient}</p>
              </div>
              <p className="text-xs text-gray-600 mb-2">{n.reason}</p>
              <div className="flex gap-1 flex-wrap">
                {n.foods.map((f) => (
                  <span
                    key={f}
                    className="bg-white text-green-600 text-xs px-2 py-0.5 rounded-full"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Re-analyze */}
      <button
        onClick={analyze}
        disabled={loading}
        className="w-full text-sm text-gray-400 hover:text-orange-500 py-2"
      >
        {loading ? "再分析中..." : "🔄 もう一度分析する"}
      </button>
    </div>
  );
}
