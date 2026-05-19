import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const serviceSession = await prisma.serviceSession.findUnique({
    where: { id },
    include: {
      serviceType: true,
      attendances: {
        include: { member: { include: { zone: true } } },
        orderBy: { member: { churchNumber: "asc" } },
      },
    },
  });
  if (!serviceSession) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(serviceSession);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { date, notes } = await req.json();

  const updated = await prisma.serviceSession.update({
    where: { id },
    data: {
      ...(date ? { date: new Date(date) } : {}),
      notes: notes ?? null,
    },
    include: { serviceType: true, _count: { select: { attendances: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.attendance.deleteMany({ where: { serviceSessionId: id } });
  await prisma.serviceSession.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
