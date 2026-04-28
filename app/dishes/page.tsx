import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseJsonField, formatCurrency, formatDate } from "@/lib/utils";

const ALL_TAGS = ["和食", "洋食", "中華", "イタリアン", "デザート", "その他"];

export default async function DishesPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string }>;
}) {
  const { tag, q } = await searchParams;

  let dishes = await prisma.dish.findMany({
    orderBy: { createdAt: "desc" },
    include: { recipe: true },
  });

  if (tag) {
    dishes = dishes.filter((d) => {
      const tags = parseJsonField<string[]>(d.tags, []);
      return tags.includes(tag);
    });
  }
  if (q) {
    const lower = q.toLowerCase();
    dishes = dishes.filter((d) => d.name.toLowerCase().includes(lower));
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between pt-6 pb-4">
        <h1 className="text-xl font-bold text-gray-800">料理記録</h1>
        <Link
          href="/dishes/new"
          className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
        >
          ＋ 新しく記録
        </Link>
      </div>

      {/* Tag filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
        <Link
          href="/dishes"
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !tag
              ? "bg-orange-500 text-white"
              : "bg-white text-gray-500 hover:bg-orange-50"
          }`}
        >
          すべて
        </Link>
        {ALL_TAGS.map((t) => (
          <Link
            key={t}
            href={`/dishes?tag=${encodeURIComponent(t)}`}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tag === t
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-500 hover:bg-orange-50"
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      {dishes.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-5xl mb-3">🥄</p>
          <p className="text-lg">料理が見つかりません</p>
          <Link
            href="/dishes/new"
            className="mt-4 inline-block text-orange-500"
          >
            最初の料理を記録する
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {dishes.map((dish) => {
            const tags = parseJsonField<string[]>(dish.tags, []);
            return (
              <Link
                key={dish.id}
                href={`/dishes/${dish.id}`}
                className="card overflow-hidden hover:shadow-md transition-shadow"
              >
                {dish.photo ? (
                  <div className="w-full aspect-square bg-gray-50 flex items-center justify-center">
                    <img
                      src={dish.photo}
                      alt={dish.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-orange-50 flex items-center justify-center text-4xl">
                    🍽️
                  </div>
                )}
                <div className="p-3">
                  <p className="font-semibold text-gray-800 truncate">
                    {dish.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(dish.createdAt)}
                  </p>
                  <div className="flex gap-1 flex-wrap mt-1.5">
                    {tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="text-xs bg-orange-50 text-orange-500 px-1.5 py-0.5 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  {dish.recipe && (
                    <p className="text-xs text-gray-500 mt-1.5">
                      {formatCurrency(dish.recipe.estimatedCost)}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
