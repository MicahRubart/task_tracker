import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const RENAMES = [
  { from: "Mataya",    to: "Mataya Arnold"    },
  { from: "Molly",     to: "Molly Joseph"     },
  { from: "Scott",     to: "Scott Archer"     },
  { from: "Stephanie", to: "Stephanie Morales" },
  { from: "Ward",      to: "Ward Larson"      },
];

async function main() {
  for (const r of RENAMES) {
    await db.employee.update({ where: { name: r.from }, data: { name: r.to } });
    console.log(`  renamed: ${r.from} -> ${r.to}`);
  }
  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
