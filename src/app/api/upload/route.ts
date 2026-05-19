import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const memberId = formData.get("memberId") as string | null;

  if (!file || !memberId) {
    return NextResponse.json({ error: "Missing file or memberId" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  if (!["jpg", "jpeg", "png", "webp"].includes(ext)) {
    return NextResponse.json({ error: "Only JPG, PNG or WebP allowed" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const filename = `${memberId}.${ext}`;
  fs.writeFileSync(path.join(uploadDir, filename), buffer);

  const photoUrl = `/uploads/${filename}`;
  await prisma.member.update({ where: { id: memberId }, data: { photoUrl } });

  return NextResponse.json({ url: photoUrl });
}
