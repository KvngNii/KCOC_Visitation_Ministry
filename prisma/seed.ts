import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import { ZONES_WITH_COMMUNITIES, SERVICE_TYPES, MINISTRIES } from "../src/lib/seed-data";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Seed zones and communities
  for (const zoneData of ZONES_WITH_COMMUNITIES) {
    const zone = await prisma.zone.upsert({
      where: { name: zoneData.name },
      update: {},
      create: { name: zoneData.name },
    });

    for (const communityName of zoneData.communities) {
      await prisma.community.upsert({
        where: { name_zoneId: { name: communityName, zoneId: zone.id } },
        update: {},
        create: { name: communityName, zoneId: zone.id },
      });
    }
  }

  // Seed service types
  for (const st of SERVICE_TYPES) {
    await prisma.serviceType.upsert({
      where: { name: st.name },
      update: {},
      create: st,
    });
  }

  // Seed ministries
  for (const ministryName of MINISTRIES) {
    await prisma.ministry.upsert({
      where: { name: ministryName },
      update: {},
      create: { name: ministryName },
    });
  }

  // Seed absence thresholds
  const thresholds = [
    { level: "YELLOW", months: 1 },
    { level: "ORANGE", months: 2 },
    { level: "RED", months: 3 },
  ];
  for (const t of thresholds) {
    await prisma.absenceThreshold.upsert({
      where: { level: t.level },
      update: {},
      create: t,
    });
  }

  // Seed admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@kcoc.org" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@kcoc.org",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Seeding complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
