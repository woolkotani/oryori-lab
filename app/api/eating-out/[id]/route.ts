import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { date, mealType, place, cost, photo, note } = body;

  const log = await prisma.eatingOutLog.update({
    where: { id },
    data: {
      ...(date !== undefined && { date: new Date(date) }),
      ...(mealType !== undefined && { mealType }),
      ...(place !== undefined && { place }),
      ...(cost !== undefined && { cost: Number(cost) || 0 }),
      ...(photo !== undefined && { photo }),
      ...(note !== undefined && { note }),
    },
  });
  return NextResponse.json(log);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.eatingOutLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
