import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";


import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const zoneId = searchParams.get("zoneId");
  const communityId = searchParams.get("communityId");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (zoneId) where.zoneId = zoneId;
  if (communityId) where.communityId = communityId;
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { churchNumber: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  const members = await prisma.member.findMany({
    where,
    include: {
      zone: true,
      community: true,
      ministry: true,
      attendances: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { serviceSession: true },
      },
    },
    orderBy: { churchNumber: "asc" },
  });

  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { churchNumber, firstName, lastName, phone, address, gender, employmentStatus, zoneId, communityId, ministryId, photoUrl } = body;

  if (!churchNumber || !firstName || !lastName || !gender || !zoneId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const member = await prisma.member.create({
    data: {
      churchNumber,
      firstName,
      lastName,
      phone,
      address,
      gender,
      employmentStatus,
      zoneId,
      communityId: communityId || null,
      ministryId: ministryId || null,
      photoUrl: photoUrl || null,
    },
    include: { zone: true, community: true, ministry: true },
  });

  return NextResponse.json(member, { status: 201 });
}
