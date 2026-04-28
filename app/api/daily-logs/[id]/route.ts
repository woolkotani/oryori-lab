import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { date, mealType, note } = body;

  const log = await prisma.dailyLog.update({
    where: { id },
    data: {
      ...(date !== undefined && { date: new Date(date) }),
      ...(mealType !== undefined && { mealType }),
      ...(note !== undefined && { note }),
    },
    include: { dish: true },
  });
  return NextResponse.json(log);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.dailyLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
