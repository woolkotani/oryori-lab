"use client";

import { useState } from "react";

interface Suggestion {
  name: string;
  emoji: string;
  imageQuery: string;
  season: string;
  reason: string;
  keyIngredients: string[];
}

const SEASON_EMOJI: Record<string, string> = {
  春: "🌸",
  夏: "🌻",
  秋: "🍁",
  冬: "❄️",
};

const GRADIENTS = [
  "from-orange-300 to-pink-400",
  "from-yellow-300 to-orange-400",
  "from-green-300 to-teal-400",
  "from-purple-300 to-pink-400",
  "from-blue-300 to-indigo-400",
];

export default function SeasonalSuggester() {
  const [input, setInput] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [season, setSeason] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});

  function addIngredient() {
    const trimmed = input.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients((prev) => [...prev, trimmed]);
    }
    setInput("");
  }

  function removeIngredient(item: string) {
    setIngredients((prev) => prev.filter((i) => i !== item));
  }

  async function fetchSuggestions() {
    setLoading(true);
    setSuggestions([]);
    setImgFailed({});
    try {
      const res = await fetch("/api/random-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
      setSeason(data.season ?? "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 mb-4">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-gray-700">🤖 リョボットのおすすめ</h2>
          {season && (
            <span className="text-xs text-gray-400">
              {SEASON_EMOJI[season] ?? ""} 今は{season}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-3">
          季節と使いたい材料からランダムに提案
        </p>

        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addIngredient())
            }
            placeholder="使いたい材料（例：豚肉）"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
          />
          <button
            onClick={addIngredient}
            className="bg-orange-100 text-orange-600 px-3 py-2 rounded-lg text-sm hover:bg-orange-200"
          >
            追加
          </button>
        </div>

        {ingredients.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {ingredients.map((item) => (
              <span
                key={item}
                className="bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full text-xs flex items-center gap-1"
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
          </div>
        )}

        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-orange-500 hover:to-orange-600 transition-all disabled:opacity-50"
        >
          {loading
            ? "リョボットが選んでいます..."
            : suggestions.length > 0
              ? "🔄 もう一度提案してもらう"
              : "🍳 リョボットに提案してもらう"}
        </button>

        {suggestions.length > 0 && (
          <div className="mt-4 space-y-3">
            {suggestions.map((s, i) => (
              <div
                key={`${s.name}-${i}`}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="relative h-40 w-full overflow-hidden">
                  {!imgFailed[s.name] ? (
                    <img
                      src={`https://loremflickr.com/400/240/${encodeURIComponent(s.imageQuery)}?lock=${s.name.length + i}`}
                      alt={s.name}
                      className="w-full h-full object-cover"
                      onError={() =>
                        setImgFailed((prev) => ({ ...prev, [s.name]: true }))
                      }
                    />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center`}
                    >
                      <span className="text-7xl">{s.emoji}</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-white/90 text-orange-500 text-xs font-bold px-2 py-1 rounded-full">
                    {s.season === "通年" ? "定番" : `${s.season}の旬`}
                  </div>
                  <div className="absolute top-2 right-2 bg-white/90 rounded-full w-8 h-8 flex items-center justify-center text-lg">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                  </div>
                </div>

                <div className="p-3">
                  <p className="font-bold text-gray-800 text-base">{s.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{s.reason}</p>
                  <div className="flex gap-1 flex-wrap mt-2">
                    {s.keyIngredients.map((ing) => (
                      <span
                        key={ing}
                        className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
