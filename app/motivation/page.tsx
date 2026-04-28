export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import {
  toDateString,
  getStreakFromDates,
  formatCurrency,
} from "@/lib/utils";
import ShareCard from "./ShareCard";
import BadgeAwarder from "./BadgeAwarder";

const BADGE_META: Record<string, { icon: string; label: string; desc: string }> = {
  streak_7: { icon: "🔥", label: "7日連続", desc: "7日間連続で料理を記録" },
  streak_30: { icon: "🏆", label: "30日連続", desc: "30日間連続で料理を記録" },
  streak_100: { icon: "💎", label: "100日連続", desc: "100日間連続で料理を記録" },
  first_recipe: { icon: "📖", label: "初レシピ", desc: "初めてレシピを登録" },
  nutrition_balance: { icon: "💪", label: "栄養バランス", desc: "バランスの良い食事を継続" },
};

async function getMotivationData() {
  const [dailyLogs, badges, dishes] = await Promise.all([
    prisma.dailyLog.findMany({
      orderBy: { date: "desc" },
      include: { dish: { include: { recipe: true } } },
    }),
    prisma.badge.findMany({ orderBy: { awardedAt: "desc" } }),
    prisma.dish.count(),
  ]);

  const logDates = dailyLogs.map((l) => toDateString(new Date(l.date)));
  const { current: streak, longest } = getStreakFromDates(logDates);

  // Monthly stats
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthLogs = dailyLogs.filter((l) => new Date(l.date) >= monthStart);
  const eatingOutCost = monthLogs.length * 1000;
  const homeCost = monthLogs.reduce(
    (s, l) => s + (l.dish.recipe?.estimatedCost ?? 0),
    0
  );
  const saved = Math.max(0, eatingOutCost - homeCost);

  // Calendar data (last 35 days)
  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (34 - i));
    return toDateString(d);
  });

  const logDateSet = new Set(logDates);

  return {
    streak,
    longest,
    saved,
    totalDishes: dishes,
    totalLogs: dailyLogs.length,
    monthLogs: monthLogs.length,
    badges,
    calendarDays,
    logDateSet,
  };
}

export default async function MotivationPage() {
  const {
    streak,
    longest,
    saved,
    totalDishes,
    totalLogs,
    monthLogs,
    badges,
    calendarDays,
    logDateSet,
  } = await getMotivationData();

  const now = new Date();
  const month = now.getMonth() + 1;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 pt-6 pb-4">🏆 モチベーション</h1>

      {/* Streak hero */}
      <div className="card p-6 mb-4 bg-gradient-to-br from-orange-400 to-orange-500 text-white text-center">
        <p className="text-6xl font-black">{streak}</p>
        <p className="text-lg font-semibold mt-1">日連続記録中！</p>
        <p className="text-orange-100 text-sm mt-1">最長記録: {longest}日</p>
        {streak === 0 && (
          <p className="text-orange-100 text-sm mt-2">
            今日料理を記録してストリークを始めよう 🍳
          </p>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card p-4 text-center">
          <p className="text-3xl font-black text-orange-500">{totalDishes}</p>
          <p className="text-sm text-gray-500 mt-1">登録した料理</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-black text-blue-500">{totalLogs}</p>
          <p className="text-sm text-gray-500 mt-1">総記録回数</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-black text-green-500">
            {formatCurrency(saved)}
          </p>
          <p className="text-sm text-gray-500 mt-1">{month}月の節約</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-black text-purple-500">{monthLogs}</p>
          <p className="text-sm text-gray-500 mt-1">{month}月の記録日数</p>
        </div>
      </div>

      {/* Activity calendar */}
      <div className="card p-4 mb-6">
        <h2 className="font-bold text-gray-700 mb-3">過去35日の活動</h2>
        <div className="grid grid-cols-7 gap-1.5">
          {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
            <div key={d} className="text-center text-xs text-gray-300">
              {d}
            </div>
          ))}
          {calendarDays.map((date) => (
            <div
              key={date}
              title={date}
              className={`aspect-square rounded-md ${
                logDateSet.has(date)
                  ? "bg-orange-400"
                  : "bg-gray-100"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400 justify-end">
          <span className="w-3 h-3 rounded-sm bg-gray-100 inline-block" />
          なし
          <span className="w-3 h-3 rounded-sm bg-orange-400 inline-block ml-2" />
          記録あり
        </div>
      </div>

      {/* Badges */}
      <div className="card p-4 mb-6">
        <h2 className="font-bold text-gray-700 mb-3">獲得バッジ</h2>
        {badges.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            料理を続けるとバッジが獲得できます！
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {badges.map((b) => {
              const meta = getBadgeMeta(b.type);
              return (
                <div
                  key={b.id}
                  className="bg-orange-50 rounded-xl p-3 text-center"
                >
                  <p className="text-3xl">{meta.icon}</p>
                  <p className="text-xs font-semibold text-gray-700 mt-1">
                    {meta.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{meta.desc}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Badge awarder (client component) */}
      <BadgeAwarder />

      {/* Share card */}
      <div className="card p-4">
        <h2 className="font-bold text-gray-700 mb-3">月間まとめカード</h2>
        <ShareCard
          streak={streak}
          saved={saved}
          totalLogs={totalLogs}
          monthLogs={monthLogs}
          month={month}
        />
      </div>
    </div>
  );
}

function getBadgeMeta(type: string): { icon: string; label: string; desc: string } {
  if (BADGE_META[type]) return BADGE_META[type];
  if (type.startsWith("cost_saver_")) {
    return { icon: "💰", label: "節約達成", desc: "今月¥5,000以上節約" };
  }
  return { icon: "🎖️", label: type, desc: "" };
}