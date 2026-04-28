import { prisma } from "@/lib/prisma";
import { parseJsonField, formatCurrency } from "@/lib/utils";
import type { Ingredient } from "@/lib/types";
import MonthlyCostChart from "./MonthlyCostChart";

async function getCostData() {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }).reverse();

  const monthlyData = await Promise.all(
    months.map(async ({ year, month }) => {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);

      const logs = await prisma.dailyLog.findMany({
        where: { date: { gte: start, lt: end } },
        include: { dish: { include: { recipe: true } } },
      });

      const homeCost = logs.reduce(
        (s, l) => s + (l.dish.recipe?.estimatedCost ?? 0),
        0
      );
      const eatOutCost = logs.length * 1000;
      const saved = Math.max(0, eatOutCost - homeCost);

      return {
        label: `${month}月`,
        homeCost: Math.round(homeCost),
        eatOutCost,
        saved,
        days: logs.length,
      };
    })
  );

  // Current month detail
  const currentMonth = months[months.length - 1];
  const start = new Date(currentMonth.year, currentMonth.month - 1, 1);
  const end = new Date(currentMonth.year, currentMonth.month, 1);

  const currentLogs = await prisma.dailyLog.findMany({
    where: { date: { gte: start, lt: end } },
    include: { dish: { include: { recipe: true } } },
    orderBy: { date: "desc" },
  });

  // Top costly dishes this month
  const topDishes = currentLogs
    .filter((l) => l.dish.recipe)
    .sort((a, b) => (b.dish.recipe?.estimatedCost ?? 0) - (a.dish.recipe?.estimatedCost ?? 0))
    .slice(0, 5);

  return { monthlyData, currentLogs, topDishes };
}

export default async function CostPage() {
  const { monthlyData, currentLogs, topDishes } = await getCostData();
  const current = monthlyData[monthlyData.length - 1];

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 pt-6 pb-4">💰 コスト管理</h1>

      {/* This month summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">今月の料理費</p>
          <p className="text-lg font-bold text-orange-600">
            {formatCurrency(current?.homeCost ?? 0)}
          </p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">外食換算</p>
          <p className="text-lg font-bold text-gray-600">
            {formatCurrency(current?.eatOutCost ?? 0)}
          </p>
        </div>
        <div className="card p-3 text-center bg-green-50">
          <p className="text-xs text-green-600 mb-1">今月の節約</p>
          <p className="text-lg font-bold text-green-600">
            {formatCurrency(current?.saved ?? 0)}
          </p>
        </div>
      </div>

      {/* Monthly chart */}
      <div className="card p-4 mb-6">
        <h2 className="font-bold text-gray-700 mb-4">月別コスト推移</h2>
        <MonthlyCostChart data={monthlyData} />
      </div>

      {/* Top costly dishes */}
      {topDishes.length > 0 && (
        <div className="card p-4 mb-6">
          <h2 className="font-bold text-gray-700 mb-3">今月のコスト上位</h2>
          <div className="space-y-2">
            {topDishes.map((log, i) => (
              <div key={log.id} className="flex items-center gap-3">
                <span className="text-lg text-gray-300 w-6 text-center">
                  {i + 1}
                </span>
                {log.dish.photo ? (
                  <img
                    src={log.dish.photo}
                    alt={log.dish.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-lg">
                    🍽️
                  </div>
                )}
                <span className="flex-1 text-sm text-gray-700">
                  {log.dish.name}
                </span>
                <span className="text-sm font-semibold text-gray-600">
                  {formatCurrency(log.dish.recipe?.estimatedCost ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log list */}
      {currentLogs.length > 0 && (
        <div className="card p-4">
          <h2 className="font-bold text-gray-700 mb-3">今月の記録</h2>
          <div className="space-y-2">
            {currentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm text-gray-700">{log.dish.name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(log.date).toLocaleDateString("ja-JP")}
                  </p>
                </div>
                <span className="text-sm text-gray-500">
                  {log.dish.recipe
                    ? formatCurrency(log.dish.recipe.estimatedCost)
                    : "−"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentLogs.length === 0 && (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-5xl mb-3">💸</p>
          <p>今月の記録がありません</p>
        </div>
      )}
    </div>
  );
}
