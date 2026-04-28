import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM

  let where = {};
  if (month) {
    const [year, m] = month.split("-").map(Number);
    where = {
      date: {
        gte: new Date(year, m - 1, 1),
        lt: new Date(year, m, 1),
      },
    };
  }

  const logs = await prisma.eatingOutLog.findMany({
    where,
    orderBy: { date: "desc" },
  });
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, mealType, place, cost, photo, note } = body;

  if (!date || !place) {
    return NextResponse.json(
      { error: "date and place are required" },
      { status: 400 }
    );
  }

  const log = await prisma.eatingOutLog.create({
    data: {
      date: new Date(date),
      mealType: mealType ?? "dinner",
      place,
      cost: Number(cost) || 0,
      photo: photo ?? null,
      note: note ?? null,
    },
  });
  return NextResponse.json(log, { status: 201 });
}
