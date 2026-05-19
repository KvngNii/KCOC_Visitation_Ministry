/**
 * One-time setup script: creates the database tables and seeds initial data.
 * Run after cloning: npm run db:setup
 */
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { ZONES_WITH_COMMUNITIES, SERVICE_TYPES, MINISTRIES } from "../src/lib/seed-data";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const migrationPath = path.join(process.cwd(), "prisma", "migrations", "20260519151415_init", "migration.sql");

// Apply migration SQL directly (works without CLI env setup)
const db = new Database(dbPath);
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
if (tables.length === 0) {
  console.log("Creating database tables...");
  const sql = fs.readFileSync(migrationPath, "utf-8");
  db.exec(sql);
  console.log("Tables created.");
} else {
  console.log("Tables already exist, skipping migration.");
}
db.close();

// Seed data
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

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

  for (const st of SERVICE_TYPES) {
    await prisma.serviceType.upsert({
      where: { name: st.name },
      update: {},
      create: st,
    });
  }

  for (const ministryName of MINISTRIES) {
    await prisma.ministry.upsert({
      where: { name: ministryName },
      update: {},
      create: { name: ministryName },
    });
  }

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

  console.log("Setup complete!");
  console.log("Login: admin@kcoc.org / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
