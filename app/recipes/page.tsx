export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseJsonField, formatCurrency } from "@/lib/utils";
import type { Ingredient } from "@/lib/types";

export default async function RecipesPage() {
  const dishes = await prisma.dish.findMany({
    where: { recipe: { isNot: null } },
    include: { recipe: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 pt-6 pb-4">レシピ一覧</h1>

      {dishes.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-5xl mb-3">📖</p>
          <p>レシピがまだありません</p>
          <p className="text-sm mt-2">料理を記録してレシピを追加しましょう</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dishes.map((dish) => {
            const ingredients = parseJsonField<Ingredient[]>(
              dish.recipe!.ingredients,
              []
            );
            const tags = parseJsonField<string[]>(dish.tags, []);
            return (
              <Link
                key={dish.id}
                href={`/recipes/${dish.id}`}
                className="card p-4 flex gap-4 hover:shadow-md transition-shadow"
              >
                {dish.photo ? (
                  <img
                    src={dish.photo}
                    alt={dish.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-orange-50 flex items-center justify-center text-2xl shrink-0">
                    🍽️
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{dish.name}</p>
                  <div className="flex gap-1 mt-1">
                    {tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="text-xs bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>{ingredients.length}種の材料</span>
                    <span>{formatCurrency(dish.recipe!.estimatedCost)}</span>
                    {dish.recipe!.calories && (
                      <span>{dish.recipe!.calories}kcal</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}