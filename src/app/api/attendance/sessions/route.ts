import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";


import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.serviceSession.findMany({
    include: {
      serviceType: true,
      _count: { select: { attendances: true } },
    },
    orderBy: { date: "desc" },
    take: 50,
  });

  return NextResponse.json(sessions);
}
