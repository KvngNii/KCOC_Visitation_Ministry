import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";


import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");

  const logs = await prisma.visitationLog.findMany({
    where: memberId ? { memberId } : undefined,
    include: {
      member: { include: { zone: true, community: true } },
      visitedBy: true,
    },
    orderBy: { visitDate: "desc" },
  });

  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id?: string };
  const body = await req.json();
  const { memberId, visitType, visitDate, notes, outcome } = body;

  if (!memberId || !visitType || !visitDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const log = await prisma.visitationLog.create({
    data: {
      memberId,
      visitedById: user.id,
      visitType,
      visitDate: new Date(visitDate),
      notes,
      outcome,
    },
    include: { member: true, visitedBy: true },
  });

  return NextResponse.json(log, { status: 201 });
}
