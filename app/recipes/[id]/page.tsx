"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Ingredient } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { uploadPhoto } from "@/lib/upload";

const UNITS = ["g", "ml", "個", "枚", "本", "カップ", "大さじ", "小さじ", "適量"];

function emptyIngredient(): Ingredient {
  return { name: "", amount: "", unit: "g", cost: 0 };
}

export default function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: dishId } = use(params);
  const router = useRouter();

  const [dishName, setDishName] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([emptyIngredient()]);
  const [steps, setSteps] = useState("");
  const [calories, setCalories] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [fat, setFat] = useState<string>("");
  const [carbs, setCarbs] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [analyzingIngredients, setAnalyzingIngredients] = useState(false);
  const [ingredientPhoto, setIngredientPhoto] = useState<string | null>(null);
  const [analysisNote, setAnalysisNote] = useState<string | null>(null);

  async function handleIngredientPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzingIngredients(true);
    setAnalysisNote(null);
    try {
      // Upload first
      const photoUrl = await uploadPhoto(file);
      setIngredientPhoto(photoUrl);

      // Analyze
      const aRes = await fetch("/api/ai/analyze-ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: photoUrl }),
      });
      const aData = await aRes.json();
      const detected: Ingredient[] = aData.ingredients ?? [];

      if (detected.length > 0) {
        // Merge: if first row is empty, replace, otherwise append
        const isEmpty =
          ingredients.length === 1 &&
          !ingredients[0].name &&
          !ingredients[0].amount;
        setIngredients(isEmpty ? detected : [...ingredients, ...detected]);
        setAnalysisNote(
          aData.isMock
            ? `${detected.length}品の材料を検出（※APIキー未設定のためサンプルデータ）`
            : `${detected.length}品の材料を検出しました ✨`
        );
      } else {
        setAnalysisNote("材料を検出できませんでした");
      }
    } catch {
      setAnalysisNote("解析に失敗しました");
    } finally {
      setAnalyzingIngredients(false);
      // Reset file input so the same file can be selected again
      e.target.value = "";
    }
  }

  useEffect(() => {
    fetch(`/api/dishes/${dishId}`)
      .then((r) => r.json())
      .then((d) => {
        setDishName(d.name);
        if (d.recipe) {
          const ings = JSON.parse(d.recipe.ingredients ?? "[]");
          setIngredients(ings.length ? ings : [emptyIngredient()]);
          setSteps(d.recipe.steps ?? "");
          setCalories(d.recipe.calories?.toString() ?? "");
          setProtein(d.recipe.protein?.toString() ?? "");
          setFat(d.recipe.fat?.toString() ?? "");
          setCarbs(d.recipe.carbs?.toString() ?? "");
        }
        setLoaded(true);
      });
  }, [dishId]);

  const totalCost = ingredients.reduce((s, i) => s + (Number(i.cost) || 0), 0);

  function updateIngredient(idx: number, field: keyof Ingredient, value: string | number) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === idx ? { ...ing, [field]: value } : ing))
    );
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, emptyIngredient()]);
  }

  function removeIngredient(idx: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  }

  async function suggestSteps() {
    setAiLoading(true);
    const res = await fetch("/api/ai/suggest-steps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dishName, ingredients }),
    });
    const data = await res.json();
    if (data.steps) setSteps(data.steps);
    setAiLoading(false);
  }

  async function estimateNutrition() {
    setNutritionLoading(true);
    const res = await fetch("/api/ai/suggest-nutrition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dishName, ingredients }),
    });
    const data = await res.json();
    if (data.calories) setCalories(String(Math.round(data.calories)));
    if (data.protein) setProtein(String(Math.round(data.protein)));
    if (data.fat) setFat(String(Math.round(data.fat)));
    if (data.carbs) setCarbs(String(Math.round(data.carbs)));
    setNutritionLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/recipes/${dishId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredients,
        steps,
        estimatedCost: totalCost,
        calories: calories ? Number(calories) : null,
        protein: protein ? Number(protein) : null,
        fat: fat ? Number(fat) : null,
        carbs: carbs ? Number(carbs) : null,
      }),
    });
    router.push(`/dishes/${dishId}`);
    router.refresh();
  }

  if (!loaded) {
    return <div className="p-4 pt-10 text-center text-gray-400">読み込み中...</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 pt-6 pb-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">←</button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">レシピ</h1>
          <p className="text-sm text-gray-400">{dishName}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Ingredients */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-700">🥕 材料</h2>
            <label className="text-sm bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
              {analyzingIngredients ? "リョボットが解析中..." : "📷 材料を撮影してリョボットに任せる"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleIngredientPhoto}
                disabled={analyzingIngredients}
                className="hidden"
              />
            </label>
          </div>

          {ingredientPhoto && (
            <div className="mb-3 relative">
              <img
                src={ingredientPhoto}
                alt="ingredients"
                className="w-full max-h-72 object-contain rounded-xl bg-gray-50"
              />
              <button
                type="button"
                onClick={() => setIngredientPhoto(null)}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {analysisNote && (
            <div className="mb-3 bg-purple-50 text-purple-700 text-xs rounded-lg p-2.5">
              {analysisNote}
            </div>
          )}

          {analyzingIngredients && (
            <div className="text-center py-3 text-gray-400">
              <div className="text-2xl animate-bounce">🔍</div>
              <p className="text-xs mt-1">材料を解析しています...</p>
            </div>
          )}
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="材料名"
                  value={ing.name}
                  onChange={(e) => updateIngredient(i, "name", e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-orange-400"
                />
                <input
                  type="text"
                  placeholder="量"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(i, "amount", e.target.value)}
                  className="w-14 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-orange-400"
                />
                <select
                  value={ing.unit}
                  onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                  className="w-20 border border-gray-200 rounded-lg px-1 py-1.5 text-sm focus:outline-none focus:border-orange-400"
                >
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">¥</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={ing.cost || ""}
                    onChange={(e) => updateIngredient(i, "cost", Number(e.target.value))}
                    className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-orange-400"
                  />
                </div>
                {ingredients.length > 1 && (
                  <button
                    onClick={() => removeIngredient(i)}
                    className="text-gray-300 hover:text-red-400 text-lg leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addIngredient}
            className="mt-3 text-sm text-orange-500 hover:text-orange-600"
          >
            ＋ 材料を追加
          </button>
          <div className="mt-3 text-right text-sm font-semibold text-gray-700">
            合計コスト: {formatCurrency(totalCost)}
          </div>
        </div>

        {/* Steps */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-700">📝 手順</h2>
            <button
              onClick={suggestSteps}
              disabled={aiLoading}
              className="text-sm bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
            >
              {aiLoading ? "リョボットが考え中..." : "🤖 リョボットに補完してもらう"}
            </button>
          </div>
          <textarea
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder="## 手順&#10;&#10;1. ...&#10;2. ...&#10;&#10;（マークダウン形式で記入）"
            rows={10}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none font-mono"
          />
        </div>

        {/* Nutrition */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-700">💪 栄養素（1人前）</h2>
            <button
              onClick={estimateNutrition}
              disabled={nutritionLoading}
              className="text-sm bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              {nutritionLoading ? "リョボットが計算中..." : "🤖 リョボットに推定してもらう"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "カロリー (kcal)", value: calories, set: setCalories },
              { label: "タンパク質 (g)", value: protein, set: setProtein },
              { label: "脂質 (g)", value: fat, set: setFat },
              { label: "炭水化物 (g)", value: carbs, set: setCarbs },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="text-xs text-gray-500 block mb-1">{label}</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {saving ? "保存中..." : "レシピを保存"}
        </button>
      </div>
    </div>
  );
}
