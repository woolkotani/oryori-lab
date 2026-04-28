export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SeasonalSuggester from "./components/SeasonalSuggester";
import CookingCalendar from "./components/CookingCalendar";
import EatingOutSection from "./components/EatingOutSection";
import {
  parseJsonField,
  formatCurrency,
  toDateString,
  getStreakFromDates,
} from "@/lib/utils";

async function getDashboardData() {
  const [dailyLogs, badges, eatingOutLogs] = await Promise.all([
    prisma.dailyLog.findMany({
      orderBy: { date: "desc" },
      include: { dish: { include: { recipe: true } } },
    }),
    prisma.badge.findMany({ orderBy: { awardedAt: "desc" } }),
    prisma.eatingOutLog.findMany({ orderBy: { date: "desc" } }),
  ]);

  const logDates = dailyLogs.map((l) => toDateString(new Date(l.date)));
  const { current: streak } = getStreakFromDates(logDates);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthLogs = dailyLogs.filter((l) => new Date(l.date) >= monthStart);
  const eatingOutEquivalent = monthLogs.length * 1000;

  const homeCost = monthLogs.reduce(
    (s, l) => s + (l.dish.recipe?.estimatedCost ?? 0),
    0
  );
  const saved = Math.max(0, eatingOutEquivalent - homeCost);

  // Last 30 days for calendar
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const calendarLogs = dailyLogs
    .filter((l) => new Date(l.date) >= thirtyDaysAgo)
    .map((l) => ({
      date: toDateString(new Date(l.date)),
      dishId: l.dishId,
      dishName: l.dish.name,
      photo: l.dish.photo,
      mealType: (l.mealType ?? "dinner") as "breakfast" | "lunch" | "dinner",
      tags: parseJsonField<string[]>(l.dish.tags, []),
    }));

  const eatingOutCalendarLogs = eatingOutLogs
    .filter((l) => new Date(l.date) >= thirtyDaysAgo)
    .map((l) => ({
      id: l.id,
      date: toDateString(new Date(l.date)),
      place: l.place,
      photo: l.photo,
      cost: l.cost,
      mealType: (l.mealType ?? "dinner") as "breakfast" | "lunch" | "dinner",
    }));

  return {
    streak,
    saved,
    badges,
    totalLogs: dailyLogs.length,
    calendarLogs,
    eatingOutCalendarLogs,
  };
}

export default async function HomePage() {
  const {
    streak,
    saved,
    badges,
    totalLogs,
    calendarLogs,
    eatingOutCalendarLogs,
  } = await getDashboardData();

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <header className="pt-6 pb-4">
        <h1 className="text-2xl font-bold text-orange-500">🍳 オリョウリラボ</h1>
        <p className="text-gray-500 text-sm mt-1">
          料理の記録でモチベーションアップ！
        </p>
      </header>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard
          icon="🔥"
          label="連続記録"
          value={`${streak}日`}
          color="orange"
        />
        <StatCard
          icon="💰"
          label="今月の節約"
          value={formatCurrency(saved)}
          color="green"
        />
        <StatCard
          icon="🍽️"
          label="合計記録"
          value={`${totalLogs}回`}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link
          href="/dishes/new"
          className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
        >
          <span className="text-2xl">📸</span>
          <div>
            <p className="font-semibold text-gray-800">料理を記録</p>
            <p className="text-xs text-gray-400">写真・メモを追加</p>
          </div>
        </Link>
        <Link
          href="/suggestions"
          className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
        >
          <span className="text-2xl">🤖</span>
          <div>
            <p className="font-semibold text-gray-800">リョボットに聞く</p>
            <p className="text-xs text-gray-400">今日何作る？</p>
          </div>
        </Link>
      </div>

      {calendarLogs.length === 0 && eatingOutCalendarLogs.length === 0 ? (
        <div className="card p-8 text-center text-gray-400 mb-6">
          <p className="text-4xl mb-2">🥄</p>
          <p>まだ記録がありません</p>
          <Link
            href="/dishes/new"
            className="mt-3 inline-block text-orange-500 text-sm"
          >
            最初の料理を記録する
          </Link>
        </div>
      ) : (
        <CookingCalendar
          logs={calendarLogs}
          eatingOutLogs={eatingOutCalendarLogs}
        />
      )}

      <div className="text-right mb-6 -mt-3">
        <Link href="/dishes" className="text-sm text-orange-500">
          料理一覧を見る →
        </Link>
      </div>

      {badges.length > 0 && (
        <section>
          <h2 className="font-bold text-gray-700 mb-3">獲得バッジ</h2>
          <div className="flex gap-2 flex-wrap">
            {badges.map((b) => (
              <BadgeChip key={b.id} type={b.type} />
            ))}
          </div>
        </section>
      )}

      <SeasonalSuggester />

      <EatingOutSection />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    orange: "bg-orange-50 text-orange-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <div
      className={`card p-3 text-center ${colors[color] ?? "bg-gray-50 text-gray-600"}`}
    >
      <p className="text-2xl">{icon}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
      <p className="text-xs mt-0.5 opacity-70">{label}</p>
    </div>
  );
}

const BADGE_META: Record<string, { icon: string; label: string }> = {
  streak_7: { icon: "🔥", label: "7日連続" },
  streak_30: { icon: "🏆", label: "30日連続" },
  nutrition_balance: { icon: "💪", label: "栄養バランス" },
  cost_saver: { icon: "💰", label: "節約上手" },
  first_recipe: { icon: "📖", label: "初レシピ" },
};

function BadgeChip({ type }: { type: string }) {
  const meta = BADGE_META[type] ?? { icon: "🎖️", label: type };
  return (
    <div className="card px-3 py-2 flex items-center gap-1.5 text-sm">
      <span>{meta.icon}</span>
      <span className="text-gray-700">{meta.label}</span>
    </div>
  );
}