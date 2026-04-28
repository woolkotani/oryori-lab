export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  parseJsonField,
  formatCurrency,
  formatDate,
} from "@/lib/utils";
import type { Ingredient } from "@/lib/types";
import DeleteDishButton from "./DeleteDishButton";
import DishAnalysis from "./DishAnalysis";
import DailyLogManager from "./DailyLogManager";

export default async function DishDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dish = await prisma.dish.findUnique({
    where: { id },
    include: { recipe: true, dailyLogs: { orderBy: { date: "desc" } } },
  });

  if (!dish) notFound();

  const tags = parseJsonField<string[]>(dish.tags, []);
  const ingredients = dish.recipe
    ? parseJsonField<Ingredient[]>(dish.recipe.ingredients, [])
    : [];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero image */}
      {dish.photo ? (
        <div className="bg-gray-900">
          <img
            src={dish.photo}
            alt={dish.name}
            className="w-full max-h-[70vh] object-contain mx-auto"
          />
          <div className="px-6 py-4 bg-gradient-to-b from-gray-900 to-gray-800">
            <h1 className="text-2xl font-bold text-white">{dish.name}</h1>
            <p className="text-white/70 text-sm mt-1">
              {formatDate(dish.createdAt)}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-orange-50 h-32 flex items-center px-6 pt-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{dish.name}</h1>
            <p className="text-gray-400 text-sm mt-1">{formatDate(dish.createdAt)}</p>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Tags */}
        <div className="flex gap-2 flex-wrap">
          {tags.map((t) => (
            <span
              key={t}
              className="bg-orange-50 text-orange-500 px-3 py-1 rounded-full text-sm"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Memo */}
        {dish.memo && (
          <div className="card p-4">
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{dish.memo}</p>
          </div>
        )}

        {/* Recipe section */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-700">📖 レシピ</h2>
            <Link
              href={`/recipes/${id}`}
              className="text-sm text-orange-500 hover:text-orange-600"
            >
              {dish.recipe ? "編集する →" : "作成する →"}
            </Link>
          </div>

          {dish.recipe ? (
            <div className="space-y-3">
              {/* Nutrition row */}
              {dish.recipe.calories && (
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "カロリー", value: `${dish.recipe.calories}kcal` },
                    { label: "タンパク質", value: `${dish.recipe.protein ?? "-"}g` },
                    { label: "脂質", value: `${dish.recipe.fat ?? "-"}g` },
                    { label: "炭水化物", value: `${dish.recipe.carbs ?? "-"}g` },
                  ].map((n) => (
                    <div key={n.label} className="bg-orange-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">{n.label}</p>
                      <p className="text-sm font-bold text-orange-600">{n.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Ingredients */}
              {ingredients.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">材料</p>
                  <div className="space-y-1">
                    {ingredients.map((ing, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-sm py-1 border-b border-gray-50 last:border-0"
                      >
                        <span className="text-gray-700">{ing.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400">
                            {ing.amount} {ing.unit}
                          </span>
                          {ing.cost > 0 && (
                            <span className="text-green-600 text-xs">
                              {formatCurrency(ing.cost)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-right text-sm font-semibold text-gray-700 mt-2">
                    合計: {formatCurrency(dish.recipe.estimatedCost)}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">レシピがまだ登録されていません</p>
          )}
        </div>

        {/* Daily logs */}
        <DailyLogManager
          dishId={id}
          initialLogs={dish.dailyLogs.map((l) => ({
            id: l.id,
            date: l.date.toISOString(),
            mealType: (l.mealType ?? "dinner") as "breakfast" | "lunch" | "dinner",
            note: l.note,
          }))}
        />

        {/* AI Analysis */}
        <DishAnalysis dishId={id} />

        {/* Action buttons */}
        <div className="flex gap-3">
          <Link
            href={`/dishes/${id}/edit`}
            className="flex-1 text-center border border-orange-300 text-orange-500 py-3 rounded-xl text-sm font-semibold hover:bg-orange-50 transition-colors"
          >
            編集
          </Link>
          <DeleteDishButton dishId={id} />
        </div>
      </div>
    </div>
  );
}