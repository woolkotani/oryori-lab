import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Ingredient } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ dishId: string }> }
) {
  const { dishId } = await params;
  const recipe = await prisma.recipe.findUnique({ where: { dishId } });
  if (!recipe) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(recipe);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ dishId: string }> }
) {
  const { dishId } = await params;
  const body = await req.json();
  const { ingredients, steps, estimatedCost, calories, protein, fat, carbs } =
    body;

  const totalCost =
    estimatedCost ??
    (ingredients as Ingredient[]).reduce((s: number, i: Ingredient) => s + (i.cost || 0), 0);

  const recipe = await prisma.recipe.upsert({
    where: { dishId },
    update: {
      ingredients: JSON.stringify(ingredients ?? []),
      steps: steps ?? "",
      estimatedCost: totalCost,
      calories: calories ?? null,
      protein: protein ?? null,
      fat: fat ?? null,
      carbs: carbs ?? null,
    },
    create: {
      dishId,
      ingredients: JSON.stringify(ingredients ?? []),
      steps: steps ?? "",
      estimatedCost: totalCost,
      calories: calories ?? null,
      protein: protein ?? null,
      fat: fat ?? null,
      carbs: carbs ?? null,
    },
  });

  return NextResponse.json(recipe);
}
