import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toDateString, getStreakFromDates } from "@/lib/utils";

export async function POST(_req: NextRequest) {
  // Check and award badges based on current state
  const [dailyLogs, existingBadges, recipesCount] = await Promise.all([
    prisma.dailyLog.findMany({ orderBy: { date: "desc" } }),
    prisma.badge.findMany(),
    prisma.recipe.count(),
  ]);

  const awarded: string[] = [];
  const existingTypes = new Set(existingBadges.map((b) => b.type));

  const logDates = dailyLogs.map((l) => toDateString(new Date(l.date)));
  const { current: streak, longest } = getStreakFromDates(logDates);

  // Streak badges
  if (streak >= 7 && !existingTypes.has("streak_7")) {
    await prisma.badge.create({ data: { type: "streak_7" } });
    awarded.push("streak_7");
  }
  if (streak >= 30 && !existingTypes.has("streak_30")) {
    await prisma.badge.create({ data: { type: "streak_30" } });
    awarded.push("streak_30");
  }
  if (longest >= 100 && !existingTypes.has("streak_100")) {
    await prisma.badge.create({ data: { type: "streak_100" } });
    awarded.push("streak_100");
  }

  // First recipe badge
  if (recipesCount >= 1 && !existingTypes.has("first_recipe")) {
    await prisma.badge.create({ data: { type: "first_recipe" } });
    awarded.push("first_recipe");
  }

  // Cost saver: saved ¥5000+ this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthLogs = dailyLogs.filter((l) => new Date(l.date) >= monthStart);
  const dishIds = monthLogs.map((l) => l.dishId);
  const monthRecipes = await prisma.recipe.findMany({ where: { dishId: { in: dishIds } } });
  const homeCost = monthRecipes.reduce((s, r) => s + r.estimatedCost, 0);
  const eatingOutCost = monthLogs.length * 1000;
  const saved = eatingOutCost - homeCost;

  const monthKey = `cost_saver_${now.getFullYear()}_${now.getMonth() + 1}`;
  if (saved >= 5000 && !existingTypes.has(monthKey)) {
    await prisma.badge.create({
      data: { type: monthKey, metadata: JSON.stringify({ saved }) },
    });
    awarded.push("cost_saver");
  }

  return NextResponse.json({ awarded });
}

export async function GET() {
  const badges = await prisma.badge.findMany({ orderBy: { awardedAt: "desc" } });
  return NextResponse.json(badges);
}
