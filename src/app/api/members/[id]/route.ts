import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";


import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      zone: true,
      community: true,
      ministry: true,
      attendances: {
        include: { serviceSession: true, serviceType: true },
        orderBy: { createdAt: "desc" },
      },
      visitationLogs: {
        include: { visitedBy: true },
        orderBy: { visitDate: "desc" },
      },
      brothersKeeperLogs: {
        include: { checkedBy: true },
        orderBy: { checkDate: "desc" },
      },
    },
  });

  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  return NextResponse.json(member);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const member = await prisma.member.update({
    where: { id },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      address: body.address,
      gender: body.gender,
      employmentStatus: body.employmentStatus,
      zoneId: body.zoneId,
      communityId: body.communityId || null,
      ministryId: body.ministryId || null,
      photoUrl: body.photoUrl || null,
      status: body.status,
    },
    include: { zone: true, community: true, ministry: true },
  });

  return NextResponse.json(member);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.member.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
