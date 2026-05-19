import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";


import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const memberId = searchParams.get("memberId");

  if (sessionId) {
    const attendances = await prisma.attendance.findMany({
      where: { serviceSessionId: sessionId },
      include: {
        member: { include: { zone: true, community: true } },
        serviceType: true,
      },
    });
    return NextResponse.json(attendances);
  }

  if (memberId) {
    const attendances = await prisma.attendance.findMany({
      where: { memberId },
      include: { serviceSession: true, serviceType: true },
      orderBy: { serviceSession: { date: "desc" } },
    });
    return NextResponse.json(attendances);
  }

  return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id?: string };
  const body = await req.json();
  const { memberIds, serviceTypeId, date, notes } = body;

  if (!memberIds || !serviceTypeId || !date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const sessionDate = new Date(date);

  // Find or create the service session
  let serviceSession = await prisma.serviceSession.findUnique({
    where: { serviceTypeId_date: { serviceTypeId, date: sessionDate } },
  });

  if (!serviceSession) {
    serviceSession = await prisma.serviceSession.create({
      data: { serviceTypeId, date: sessionDate, notes },
    });
  }

  // Upsert attendance records
  const results = await Promise.allSettled(
    memberIds.map((memberId: string) =>
      prisma.attendance.upsert({
        where: {
          memberId_serviceSessionId: {
            memberId,
            serviceSessionId: serviceSession.id,
          },
        },
        update: { recordedById: user.id },
        create: {
          memberId,
          serviceSessionId: serviceSession.id,
          serviceTypeId,
          recordedById: user.id,
        },
      })
    )
  );

  const created = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ created, sessionId: serviceSession.id });
}
