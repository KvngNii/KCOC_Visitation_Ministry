import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";


import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");

  const logs = await prisma.brothersKeeperLog.findMany({
    where: memberId ? { memberId } : undefined,
    include: {
      member: { include: { zone: true, community: true } },
      checkedBy: true,
    },
    orderBy: { checkDate: "desc" },
  });

  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id?: string };
  const body = await req.json();
  const { memberId, checkDate, notes, outcome } = body;

  if (!memberId || !checkDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const log = await prisma.brothersKeeperLog.create({
    data: {
      memberId,
      checkedById: user.id,
      checkDate: new Date(checkDate),
      notes,
      outcome,
    },
    include: { member: true, checkedBy: true },
  });

  return NextResponse.json(log, { status: 201 });
}
