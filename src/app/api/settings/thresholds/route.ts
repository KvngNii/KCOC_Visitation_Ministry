import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";


import { prisma } from "@/lib/prisma";

export async function GET() {
  const thresholds = await prisma.absenceThreshold.findMany({
    orderBy: { months: "asc" },
  });
  return NextResponse.json(thresholds);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: { id: string; level: string; months: number }[] = await req.json();

  await Promise.all(
    body.map((t) =>
      prisma.absenceThreshold.update({
        where: { id: t.id },
        data: { months: t.months },
      })
    )
  );

  return NextResponse.json({ success: true });
}
