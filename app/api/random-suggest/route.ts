import { NextRequest, NextResponse } from "next/server";
import { pickRandomDishes, getCurrentSeason } from "@/lib/dish-database";

export async function POST(req: NextRequest) {
  const { ingredients } = (await req.json()) as { ingredients?: string[] };
  const dishes = pickRandomDishes(3, ingredients ?? []);
  return NextResponse.json({
    suggestions: dishes,
    season: getCurrentSeason(),
  });
}
