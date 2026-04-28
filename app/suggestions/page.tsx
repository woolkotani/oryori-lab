"use client";

import { useState } from "react";
import Link from "next/link";

interface DishSuggestion {
  name: string;
  reason: string;
  estimatedTime: string;
  matchedIngredients: string[];
}

interface RecipeMatch {
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

export default function SuggestionsPage() {
  const [fridgeInput, setFridgeInput] = useState("");
  const [fridgeIngredients, setFridgeIngredients] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<DishSuggestion[]>([]);
  const [matches, setMatches] = useState<RecipeMatch[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [hasSearchedMatch, setHasSearchedMatch] = useState(false);
  const [isMockSuggest, setIsMockSuggest] = useState(false);
  const [isMockMatch, setIsMockMatch] = useState(false);

  function addIngredient() {
    const trimmed = fridgeInput.trim();
    if (trimmed && !fridgeIngredients.includes(trimmed)) {
      setFridgeIngredients((prev) => [...prev, trimmed]);
    }
    setFridgeInput("");
  }

  function removeIngredient(item: string) {
    setFridgeIngredients((prev) => prev.filter((i) => i !== item));
  }

  async function getSuggestions() {
    setLoadingSuggest(true);
    setSuggestions([]);
    try {
      const res = await fetch("/api/ai/suggest-dishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fridgeIngredients }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
      setIsMockSuggest(!!data.isMock);
    } finally {
      setLoadingSuggest(false);
    }
  }

  async function matchRecipes() {
    if (!fridgeIngredients.length) return;
    setLoadingMatch(true);
    setMatches([]);
    setHasSearchedMatch(true);
    try {
      const res = await fetch("/api/ai/match-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fridgeIngredients }),
      });
      const data = await res.json();
      setMatches(data.matches ?? []);
      setIsMockMatch(!!data.isMock);
    } finally {
      setLoadingMatch(false);
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 pt-6 pb-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-300 to-pink-300 flex items-center justify-center text-3xl shadow-sm">
          🤖
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">リョボット</h1>
          <p className="text-xs text-gray-400">お料理ラボの管理人</p>
        </div>
      </div>
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 mb-4 text-sm text-gray-700 relative">
        <span className="absolute -top-1.5 left-6 w-3 h-3 bg-orange-50 border-l border-t border-orange-100 rotate-45" />
        こんにちは！リョボットだよ〜🍳
        <br />
        過去の記録や冷蔵庫の食材から、今日のおすすめを考えるよ！
      </div>

      {/* Fridge input */}
      <div className="card p-4 mb-4">
        <h2 className="font-bold text-gray-700 mb-2">
          🧊 冷蔵庫の食材（任意）
        </h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={fridgeInput}
            onChange={(e) => setFridgeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addIngredient();
              }
            }}
            placeholder="例：鶏肉、にんじん、玉ねぎ（Enterで追加）"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
          />
          <button
            onClick={addIngredient}
            className="bg-orange-100 text-orange-600 px-3 py-2 rounded-lg text-sm hover:bg-orange-200"
          >
            追加
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {fridgeIngredients.map((item) => (
            <span
              key={item}
              className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-sm flex items-center gap-1"
            >
              {item}
              <button
                onClick={() => removeIngredient(item)}
                className="text-orange-300 hover:text-orange-500"
              >
                ×
              </button>
            </span>
          ))}
          {fridgeIngredients.length === 0 && (
            <span className="text-xs text-gray-300">
              食材を追加すると精度が上がります
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={getSuggestions}
          disabled={loadingSuggest}
          className="bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {loadingSuggest ? "提案中..." : "🍳 今日何作る？"}
        </button>
        <button
          onClick={matchRecipes}
          disabled={loadingMatch || fridgeIngredients.length === 0}
          className="bg-purple-500 text-white py-3 rounded-xl font-semibold hover:bg-purple-600 transition-colors disabled:opacity-50"
        >
          {loadingMatch ? "検索中..." : "🔍 レシピを探す"}
        </button>
      </div>

      {/* Loading: dish suggestions */}
      {loadingSuggest && (
        <div className="text-center py-8 text-gray-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-orange-200 border-t-orange-500" />
          <p className="mt-2 text-sm">リョボットが考えています...</p>
        </div>
      )}

      {/* Dish suggestions */}
      {!loadingSuggest && suggestions.length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold text-gray-700 mb-1">今日のおすすめ料理</h2>
          {isMockSuggest && (
            <p className="text-xs text-gray-400 mb-2">
              ※ APIキー未設定のためサンプル提案中
            </p>
          )}
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{s.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{s.reason}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>⏱ {s.estimatedTime}</span>
                      {s.matchedIngredients.length > 0 && (
                        <span>✓ {s.matchedIngredients.join(", ")}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Loading: recipe matches */}
      {loadingMatch && (
        <div className="text-center py-8 text-gray-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-purple-200 border-t-purple-500" />
          <p className="mt-2 text-sm">レシピを検索中...</p>
        </div>
      )}

      {/* Recipe matches */}
      {!loadingMatch && matches.length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold text-gray-700 mb-1">
            マッチするアーカイブレシピ
          </h2>
          {isMockMatch && (
            <p className="text-xs text-gray-400 mb-2">
              ※ ローカル一致度で簡易マッチ中
            </p>
          )}
          <div className="space-y-3">
            {matches.map((m, i) => {
              const inner = (
                <>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-gray-800">{m.name}</p>
                        {typeof m.matchScore === "number" &&
                          m.matchScore > 0 && (
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                m.matchScore >= 80
                                  ? "bg-green-50 text-green-600"
                                  : m.matchScore >= 50
                                    ? "bg-yellow-50 text-yellow-600"
                                    : "bg-gray-50 text-gray-500"
                              }`}
                            >
                              {m.matchScore}%
                            </span>
                          )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{m.reason}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                        <span>⏱ {m.cookingTime}</span>
                        {m.availableIngredients &&
                          m.availableIngredients.length > 0 && (
                            <span className="text-green-600">
                              ✓ {m.availableIngredients.join(", ")}
                            </span>
                          )}
                        {m.missingIngredients &&
                          m.missingIngredients.length > 0 && (
                            <span className="text-red-400">
                              × {m.missingIngredients.join(", ")}
                            </span>
                          )}
                      </div>
                      {m.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          {m.tags.map((t) => (
                            <span
                              key={t}
                              className="text-xs bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );

              return m.isFromDb ? (
                <Link
                  key={i}
                  href={`/dishes/${m.id}`}
                  className="card p-4 block hover:shadow-md transition-shadow"
                >
                  {inner}
                </Link>
              ) : (
                <div key={i} className="card p-4">
                  {inner}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty state for recipe match */}
      {!loadingMatch && hasSearchedMatch && matches.length === 0 && (
        <section className="mb-6">
          <div className="card p-6 text-center text-gray-500">
            <div className="text-4xl mb-2">🤔</div>
            <p className="text-sm">
              入力した食材に近い料理が見つかりませんでした。
              <br />
              「今日何作る？」も試してみてね！
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
