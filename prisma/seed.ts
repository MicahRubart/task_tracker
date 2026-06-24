import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const webServicesTeam = ["Molly", "Scott", "Mataya", "Stephanie", "Ward"];

  for (const name of webServicesTeam) {
    await db.employee.upsert({
      where: { name },
      update: { departments: ["WEB_SERVICES"] },
      create: { name, departments: ["WEB_SERVICES"] },
    });
    console.log(`✓ ${name}`);
  }

  console.log("\nWeb Services team seeded successfully.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
