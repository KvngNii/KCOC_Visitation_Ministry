import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";


import { prisma } from "@/lib/prisma";
import { computeAttendanceColor } from "@/lib/attendance-color";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const zoneId = searchParams.get("zoneId");
  const color = searchParams.get("color");

  const members = await prisma.member.findMany({
    where: zoneId ? { zoneId } : undefined,
    include: {
      zone: true,
      community: true,
      ministry: true,
      attendances: {
        include: { serviceSession: true },
        orderBy: { serviceSession: { date: "desc" } },
      },
    },
    orderBy: { churchNumber: "asc" },
  });

  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const membersWithColor = members.map((member) => {
    const lastAttendance = member.attendances[0];
    const lastDate = lastAttendance?.serviceSession?.date ?? null;

    // Check consistent attendance for 3 months
    const threeMonthAttendances = member.attendances.filter(
      (a) => new Date(a.serviceSession.date) >= threeMonthsAgo
    );
    const isConsistent = threeMonthAttendances.length >= 8;

    const attendanceColor = computeAttendanceColor(
      lastDate ? new Date(lastDate) : null,
      isConsistent
    );

    return {
      ...member,
      attendanceColor,
      lastAttendanceDate: lastDate,
      attendances: undefined,
    };
  });

  const filtered = color
    ? membersWithColor.filter((m) => m.attendanceColor === color)
    : membersWithColor;

  const summary = {
    total: membersWithColor.length,
    green: membersWithColor.filter((m) => m.attendanceColor === "GREEN").length,
    yellow: membersWithColor.filter((m) => m.attendanceColor === "YELLOW").length,
    orange: membersWithColor.filter((m) => m.attendanceColor === "ORANGE").length,
    red: membersWithColor.filter((m) => m.attendanceColor === "RED").length,
    grey: membersWithColor.filter((m) => m.attendanceColor === "GREY").length,
  };

  return NextResponse.json({ members: filtered, summary });
}
