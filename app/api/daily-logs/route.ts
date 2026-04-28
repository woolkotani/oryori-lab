import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM

  let where = {};
  if (month) {
    const [year, m] = month.split("-").map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 1);
    where = { date: { gte: start, lt: end } };
  }

  const logs = await prisma.dailyLog.findMany({
    where,
    orderBy: { date: "desc" },
    include: { dish: { include: { recipe: true } } },
  });
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, dishId, mealType, note } = body;

  if (!date || !dishId) {
    return NextResponse.json(
      { error: "date and dishId are required" },
      { status: 400 }
    );
  }

  const log = await prisma.dailyLog.create({
    data: {
      date: new Date(date),
      dishId,
      mealType: mealType ?? "dinner",
      note: note ?? null,
    },
    include: { dish: true },
  });
  return NextResponse.json(log, { status: 201 });
}
