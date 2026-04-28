import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseJsonField } from "@/lib/utils";
import type { Ingredient } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");
  const q = searchParams.get("q");

  const dishes = await prisma.dish.findMany({
    orderBy: { createdAt: "desc" },
    include: { recipe: true },
  });

  let filtered = dishes;
  if (tag) {
    filtered = filtered.filter((d) => {
      const tags = parseJsonField<string[]>(d.tags, []);
      return tags.includes(tag);
    });
  }
  if (q) {
    const lower = q.toLowerCase();
    filtered = filtered.filter((d) => d.name.toLowerCase().includes(lower));
  }

  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, photo, memo, tags } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const dish = await prisma.dish.create({
    data: {
      name,
      photo: photo ?? null,
      memo: memo ?? null,
      tags: JSON.stringify(tags ?? []),
    },
  });

  return NextResponse.json(dish, { status: 201 });
}
