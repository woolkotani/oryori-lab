import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dish = await prisma.dish.findUnique({
    where: { id },
    include: { recipe: true, dailyLogs: { orderBy: { date: "desc" } } },
  });
  if (!dish) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(dish);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, photo, memo, tags } = body;

  const dish = await prisma.dish.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(photo !== undefined && { photo }),
      ...(memo !== undefined && { memo }),
      ...(tags !== undefined && { tags: JSON.stringify(tags) }),
    },
  });
  return NextResponse.json(dish);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.dish.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
