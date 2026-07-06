import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });
db.task.findMany({
  where: { department: "LEADERSHIP" },
  include: { employee: true },
  orderBy: { createdAt: "asc" },
}).then((tasks) => {
  tasks.forEach((t) => console.log(`${t.id} | ${t.employee.name} | ${t.title}`));
  console.log(`\nTotal: ${tasks.length}`);
}).finally(() => db.$disconnect());
