import { prisma } from "@/lib/prisma";
import { toDateString } from "@/lib/utils";
import NutritionWeekChart from "./NutritionWeekChart";
import type { NutritionDay } from "@/lib/types";

async function getNutritionData() {
  const now = new Date();

  // Last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return toDateString(d);
  });

  const start = new Date(days[0]);
  const end = new Date(now);
  end.setDate(end.getDate() + 1);

  const logs = await prisma.dailyLog.findMany({
    where: { date: { gte: start, lt: end } },
    include: { dish: { include: { recipe: true } } },
  });

  const weekData: NutritionDay[] = days.map((date) => {
    const dayLogs = logs.filter((l) => toDateString(new Date(l.date)) === date);
    const totals = dayLogs.reduce(
      (acc, l) => ({
        calories: acc.calories + (l.dish.recipe?.calories ?? 0),
        protein: acc.protein + (l.dish.recipe?.protein ?? 0),
        fat: acc.fat + (l.dish.recipe?.fat ?? 0),
        carbs: acc.carbs + (l.dish.recipe?.carbs ?? 0),
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );
    return { date, ...totals };
  });

  // Monthly averages
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthLogs = await prisma.dailyLog.findMany({
    where: { date: { gte: monthStart, lt: end } },
    include: { dish: { include: { recipe: true } } },
  });

  const daysWithData = new Set(monthLogs.map((l) => toDateString(new Date(l.date)))).size || 1;
  const monthTotals = monthLogs.reduce(
    (acc, l) => ({
      calories: acc.calories + (l.dish.recipe?.calories ?? 0),
      protein: acc.protein + (l.dish.recipe?.protein ?? 0),
      fat: acc.fat + (l.dish.recipe?.fat ?? 0),
      carbs: acc.carbs + (l.dish.recipe?.carbs ?? 0),
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  const monthAvg = {
    calories: Math.round(monthTotals.calories / daysWithData),
    protein: Math.round(monthTotals.protein / daysWithData),
    fat: Math.round(monthTotals.fat / daysWithData),
    carbs: Math.round(monthTotals.carbs / daysWithData),
  };

  return { weekData, monthAvg };
}

export default async function NutritionPage() {
  const { weekData, monthAvg } = await getNutritionData();

  const today = weekData[weekData.length - 1];

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 pt-6 pb-4">💪 栄養素</h1>

      {/* Today */}
      <div className="card p-4 mb-6">
        <h2 className="font-bold text-gray-700 mb-3">今日の栄養</h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: "カロリー", value: today.calories, unit: "kcal", color: "orange" },
            { label: "タンパク質", value: today.protein, unit: "g", color: "blue" },
            { label: "脂質", value: today.fat, unit: "g", color: "yellow" },
            { label: "炭水化物", value: today.carbs, unit: "g", color: "green" },
          ].map((n) => (
            <NutrientCard key={n.label} {...n} />
          ))}
        </div>
        {today.calories === 0 && (
          <p className="text-center text-sm text-gray-400 mt-3">
            今日の記録がありません
          </p>
        )}
      </div>

      {/* Weekly chart */}
      <div className="card p-4 mb-6">
        <h2 className="font-bold text-gray-700 mb-4">週次カロリー推移</h2>
        <NutritionWeekChart data={weekData} />
      </div>

      {/* Macro breakdown this week */}
      <div className="card p-4 mb-6">
        <h2 className="font-bold text-gray-700 mb-4">週間 マクロ栄養素</h2>
        <NutritionWeekChart data={weekData} type="macro" />
      </div>

      {/* Monthly average */}
      <div className="card p-4">
        <h2 className="font-bold text-gray-700 mb-3">今月の平均（1日あたり）</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "平均カロリー", value: monthAvg.calories, unit: "kcal" },
            { label: "平均タンパク質", value: monthAvg.protein, unit: "g" },
            { label: "平均脂質", value: monthAvg.fat, unit: "g" },
            { label: "平均炭水化物", value: monthAvg.carbs, unit: "g" },
          ].map((n) => (
            <div key={n.label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">{n.label}</p>
              <p className="text-xl font-bold text-gray-700 mt-1">
                {n.value}
                <span className="text-sm font-normal text-gray-400 ml-1">
                  {n.unit}
                </span>
              </p>
            </div>
          ))}
        </div>

        {/* Nutrition balance indicator */}
        {monthAvg.calories > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">PFC バランス</p>
            <PFCBar
              protein={monthAvg.protein}
              fat={monthAvg.fat}
              carbs={monthAvg.carbs}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function NutrientCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    orange: "bg-orange-50 text-orange-600",
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    green: "bg-green-50 text-green-600",
  };
  return (
    <div className={`rounded-xl p-2 ${colors[color]}`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="text-base font-bold mt-0.5">
        {Math.round(value)}
        <span className="text-xs font-normal ml-0.5">{unit}</span>
      </p>
    </div>
  );
}

function PFCBar({
  protein,
  fat,
  carbs,
}: {
  protein: number;
  fat: number;
  carbs: number;
}) {
  const pCal = protein * 4;
  const fCal = fat * 9;
  const cCal = carbs * 4;
  const total = pCal + fCal + cCal || 1;

  const pPct = Math.round((pCal / total) * 100);
  const fPct = Math.round((fCal / total) * 100);
  const cPct = 100 - pPct - fPct;

  return (
    <div>
      <div className="flex rounded-full overflow-hidden h-4">
        <div
          className="bg-blue-400 transition-all"
          style={{ width: `${pPct}%` }}
        />
        <div
          className="bg-yellow-400 transition-all"
          style={{ width: `${fPct}%` }}
        />
        <div
          className="bg-green-400 transition-all"
          style={{ width: `${cPct}%` }}
        />
      </div>
      <div className="flex gap-4 mt-1 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />P {pPct}%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />F {fPct}%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />C {cPct}%
        </span>
      </div>
    </div>
  );
}
