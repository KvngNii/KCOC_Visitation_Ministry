import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const ministries = await prisma.ministry.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(ministries);
}
