import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const EMPLOYEES: { name: string; departments: string[] }[] = [
  // Web Services
  { name: "Molly",      departments: ["WEB_SERVICES"] },
  { name: "Scott",      departments: ["WEB_SERVICES"] },
  { name: "Mataya",     departments: ["WEB_SERVICES"] },
  { name: "Stephanie",  departments: ["WEB_SERVICES"] },
  { name: "Ward",       departments: ["WEB_SERVICES"] },

  // Conversions
  { name: "Grace Wilkes",      departments: ["CONVERSION"] },
  { name: "Joshua Sorsby",     departments: ["CONVERSION"] },
  { name: "Forster McLane",    departments: ["CONVERSION"] },
  { name: "Adrianne Mallari",  departments: ["CONVERSION"] },
  { name: "Stephaney Fobbs",   departments: ["CONVERSION"] },
  { name: "Hailey Woods",      departments: ["CONVERSION"] },
  { name: "Brian Tinker",      departments: ["CONVERSION"] },
  { name: "Terrence Smith",    departments: ["CONVERSION"] },
  { name: "Nicolas Adkins",    departments: ["CONVERSION"] },
  { name: "Cory North",        departments: ["CONVERSION"] },

  // Operations
  { name: "Denise Arechavaleta", departments: ["OPERATIONS"] },
  { name: "Cassandra Cosgrove",  departments: ["OPERATIONS"] },
  { name: "Carla Clark",         departments: ["OPERATIONS"] },

  // Implementation
  { name: "Steve Pickering",   departments: ["IMPLEMENTATION"] },
  { name: "Krista Goergen",    departments: ["IMPLEMENTATION"] },
  { name: "Kael Zaczkiewicz",  departments: ["IMPLEMENTATION"] },
  { name: "Vikki Browne",      departments: ["IMPLEMENTATION"] },
  { name: "Erin Taulbee",      departments: ["IMPLEMENTATION"] },
  { name: "Donny Hedinger",    departments: ["IMPLEMENTATION"] },
  { name: "Mackenzie Owensby", departments: ["IMPLEMENTATION"] },
  { name: "Melissa Miller",    departments: ["IMPLEMENTATION"] },
  { name: "Joel Engelsen",     departments: ["IMPLEMENTATION"] },
  { name: "Doug Brandt",       departments: ["IMPLEMENTATION"] },
  { name: "Kristen Melander",  departments: ["IMPLEMENTATION"] },
  { name: "Alyssa Handberry",  departments: ["IMPLEMENTATION"] },
  { name: "Justine Pullin",    departments: ["IMPLEMENTATION"] },
  { name: "Tasha Princler",    departments: ["IMPLEMENTATION"] },
  { name: "Nichelle Winston",  departments: ["IMPLEMENTATION"] },
  { name: "Ramy Aziz",         departments: ["IMPLEMENTATION"] },
  { name: "Tracy McRae",       departments: ["IMPLEMENTATION"] },
  { name: "Mary Higgins",      departments: ["IMPLEMENTATION"] },
  { name: "Chris McElvy",      departments: ["IMPLEMENTATION"] },
  { name: "Tory Argenzia",     departments: ["IMPLEMENTATION"] },
  { name: "Jalisha Lewis",     departments: ["IMPLEMENTATION"] },
  { name: "Mark Davis",        departments: ["IMPLEMENTATION"] },

  // Training
  { name: "Lenore Jaquin",     departments: ["TRAINING"] },
  { name: "Jon Wenzel",        departments: ["TRAINING"] },
  { name: "Wanda Lewis",       departments: ["TRAINING"] },
  { name: "Heather Leszczynski", departments: ["TRAINING"] },
  { name: "Susan Kim",         departments: ["TRAINING"] },
  { name: "Tanya Kaufmann",    departments: ["TRAINING"] },
  { name: "Rama Brown",        departments: ["TRAINING"] },
  { name: "Juan Colombi",      departments: ["TRAINING"] },
  { name: "Hanh Nguyen",       departments: ["TRAINING"] },
  { name: "Germayne Shaw",     departments: ["TRAINING"] },
  { name: "Collin Higgins",    departments: ["TRAINING"] },
  { name: "Keith Coiscou",     departments: ["TRAINING"] },
  { name: "Marcia Polanco",    departments: ["TRAINING"] },
  { name: "Joseph Russell",    departments: ["TRAINING"] },
  { name: "London Beveridge",  departments: ["TRAINING"] },
  { name: "Diana Hernandez",   departments: ["TRAINING"] },
  { name: "Felicity Arkins",   departments: ["TRAINING"] },

  // Strategic Solutions
  { name: "Ryan Perry",        departments: ["STRATEGIC_SOLUTIONS"] },
  { name: "Reed Reimers",      departments: ["STRATEGIC_SOLUTIONS"] },
  { name: "Euliza Connolly",   departments: ["STRATEGIC_SOLUTIONS"] },
  { name: "Tyler Weaver",      departments: ["STRATEGIC_SOLUTIONS"] },
  { name: "Phyllis Fernandez", departments: ["STRATEGIC_SOLUTIONS"] },
  { name: "Ros Rossi",         departments: ["STRATEGIC_SOLUTIONS"] },
  { name: "Bree Elliott",      departments: ["STRATEGIC_SOLUTIONS"] },
  { name: "Derrek Shank",      departments: ["STRATEGIC_SOLUTIONS"] },
  { name: "Kayla Schrenk",     departments: ["STRATEGIC_SOLUTIONS"] },
  { name: "Emma Stickney",     departments: ["STRATEGIC_SOLUTIONS"] },
];

async function main() {
  console.log(`Seeding ${EMPLOYEES.length} employees...\n`);

  for (const emp of EMPLOYEES) {
    await db.employee.upsert({
      where: { name: emp.name },
      update: { departments: emp.departments as any },
      create: { name: emp.name, departments: emp.departments as any },
    });
    console.log(`  ✓ ${emp.name} (${emp.departments.join(", ")})`);
  }

  console.log(`\nDone. ${EMPLOYEES.length} employees upserted.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
