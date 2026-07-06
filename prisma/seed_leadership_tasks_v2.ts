import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  // Look up all employees we need by name
  const names = [
    "Theresa Klosterman",
    "Ryan Perry",
    "Nicole Farris",
    "Denise Arechavaleta",
    "Ian Solcz",
    "Jon Wenzel",
    "Cassandra Cosgrove",
    "Heather Leszczynski",
    "Ros Rossi",
    "Roz Rossi",
    "Bobby",
  ];

  const found = await db.employee.findMany({
    where: { name: { in: names } },
    select: { id: true, name: true },
  });

  const emp: Record<string, string> = {};
  found.forEach((e) => { emp[e.name] = e.id; });

  // Also search for partial matches for Ros/Roz
  const rozSearch = await db.employee.findMany({
    where: { name: { contains: "Ros" } },
    select: { id: true, name: true },
  });
  console.log("Roz/Ros search results:", rozSearch);

  const cassSearch = await db.employee.findMany({
    where: { name: { contains: "Cass" } },
    select: { id: true, name: true },
  });
  console.log("Cass search results:", cassSearch);

  const heatherSearch = await db.employee.findMany({
    where: { name: { contains: "Heather" } },
    select: { id: true, name: true },
  });
  console.log("Heather search results:", heatherSearch);

  console.log("\nFound employees:", emp);

  function resolve(name: string): string | null {
    if (emp[name]) return emp[name];
    // try partial
    const key = Object.keys(emp).find((k) => k.toLowerCase().includes(name.toLowerCase()));
    return key ? emp[key] : null;
  }

  const theresa = resolve("Theresa Klosterman");
  const ryan = resolve("Ryan Perry");
  const nicole = resolve("Nicole Farris");
  const denise = resolve("Denise Arechavaleta");
  const ian = resolve("Ian Solcz");
  const jon = resolve("Jon Wenzel");

  // For Ros Rossi — check rozSearch results
  const rozEmployee = rozSearch[0] ?? null;
  const roz = rozEmployee?.id ?? null;

  // For Cassandra Cosgrove
  const cassEmployee = cassSearch[0] ?? null;
  const cass = cassEmployee?.id ?? null;

  // For Heather Leszczynski
  const heatherEmployee = heatherSearch[0] ?? null;
  const heather = heatherEmployee?.id ?? null;

  console.log("\nResolved IDs:");
  console.log("Theresa:", theresa);
  console.log("Ryan:", ryan);
  console.log("Nicole:", nicole);
  console.log("Denise:", denise);
  console.log("Ian:", ian);
  console.log("Jon:", jon);
  console.log("Roz:", roz, rozEmployee?.name);
  console.log("Cass:", cass, cassEmployee?.name);
  console.log("Heather:", heather, heatherEmployee?.name);

  function d(dateStr: string): Date {
    return new Date(dateStr + "T00:00:00Z");
  }

  type TaskInput = {
    title: string;
    ownerId: string | null;
    partnerIds: (string | null)[];
    dueDate?: Date;
    note?: string;
  };

  const tasks: TaskInput[] = [
    {
      title: "Alternative Go-live Date Consistency",
      ownerId: theresa,
      partnerIds: [ryan, nicole],
      dueDate: d("2026-07-02"),
      note: "Ryan, Nicole, Theresa get together and make plan moving forward for new and existing customers - plan to be set in stone by 7/2 and then executed",
    },
    {
      title: "DM role vs IC role - role definition & execution",
      ownerId: roz,
      partnerIds: [denise, theresa],
      note: "Communicate DM role on PS All Hands - RACI, DM. Need to define the roles and responsibilities for Delivery Managers and Implementation Coordinators.",
    },
    {
      title: "DataShare",
      ownerId: theresa,
      partnerIds: [],
      dueDate: d("2026-06-30"),
      note: "Meeting scheduled for 6/30 - plan to create SOP + post after for clarity. Land with kevin on comms pathway. Then communicate ICs. Awaiting Kevin direction here post Sanjay's sudden departure.",
    },
    {
      title: "Conversion flex dates",
      ownerId: nicole,
      partnerIds: [],
      dueDate: d("2026-07-07"),
      note: "Get on the IC meeting in July - continue to reinforce amongst the team. Make sure they understand. Scheduled for July 7.",
    },
    {
      title: "SKU review",
      ownerId: denise,
      partnerIds: [],
      dueDate: d("2026-07-17"),
      note: "Denise - ask Makayla what security is needed. then get it - July 17 target. Kill SKUs, Update SKUs, update list price - eliminate SKUs for not named Smile Doctors.",
    },
    {
      title: "Utilization forecasting",
      ownerId: denise,
      partnerIds: [theresa],
      dueDate: d("2026-07-14"),
      note: "Plan to kick-off with all early July - July 14 is absolute target for all.",
    },
    {
      title: "Feedback structure with Lattice",
      ownerId: ian,
      partnerIds: [],
      dueDate: d("2026-07-03"),
      note: "Start small - let's do us: Ian - reach out to lattice admins about report structure. Each leader to document 1 piece of feedback for a peer this month - do before 7/3. Ian review, calibrate - share general sentiment. Start with other Supervisors in July. For August - rollout to the rest of the team. Make sure to hammer the use it has with people's growth - long term mgmt - helps with continuity.",
    },
    {
      title: "AI Weekly Summaries -> All + Exec Summaries",
      ownerId: roz,
      partnerIds: [denise, ian, ryan],
      dueDate: d("2026-06-23"),
      note: "Meeting on 6/23 to Re-engineer Weekly Status Deck 2.0. Monthly Progress Reports will serve as exec report. Piloting with Coast, Smile Doctors, Salt, and Jefferson.",
    },
    {
      title: "Conversion Utilities that we're not using (Possibly in the Auto-Elig)",
      ownerId: cass,
      partnerIds: [denise],
      note: "Have Cass meet with all customers with Auto-Elig to confirm we're doing this. Go through process soup to nuts so Cass can enable folks.",
    },
    {
      title: "Monday.com",
      ownerId: ian,
      partnerIds: [],
      note: "Write Use Cases. Ian - sign on dotted line! Need to work through pricing.",
    },
    {
      title: "Weekly Flash structure and impact",
      ownerId: ian,
      partnerIds: [],
      dueDate: d("2026-07-10"),
      note: "Plan: Ian to do deep dive over the next 2 weeks for structure, data pulls, and how we display the info. Plan to have it ready by 7/10. PS Big initiatives, path to 200 updates, summary/lessons learned from recent completed onboardings, good stories (like customers hitting milestone credits), product initiatives (did things get released on time), what leaders can do to help us be more helpful, track pending contracts for additional offices.",
    },
    {
      title: "Claims Management & Reporting (post live remote Denticon session)",
      ownerId: jon,
      partnerIds: [heather],
      dueDate: d("2026-07-02"),
      note: "Jon to work with Heather to land on date - 7/2. Target EO August for completion. Create LMS Content. Need an LMS course to align with Claims Management & Reporting content - likely Heather L. can help here.",
    },
    {
      title: "CBS (Cloud 9 Data Share)",
      ownerId: theresa,
      partnerIds: [denise],
      dueDate: d("2026-07-02"),
      note: "Add to Data share conversion with Kevin + DataShare - 7/2. Target EO July for getting this one ironed out. Sort out next steps and jam through this for ICs or Cebu. Need an SOP and training ICs on how to set this up.",
    },
    {
      title: "LMS training revamp/improvement",
      ownerId: jon,
      partnerIds: [cass],
      dueDate: d("2026-07-10"),
      note: "Jon - sync with Cassandra + Jenn - start planning this out - 7/10. From there, we start planning. Assess content - what's missing, what needs revamp & create plan for content updates. Also, LearnUpon kind of sucks! We should switch :) work with Product and People team.",
    },
    {
      title: "Master Cert (finish this) - goal, sign-up, etc.",
      ownerId: jon,
      partnerIds: [],
      dueDate: d("2026-07-10"),
      note: "Jon round back with name(s) to own this one - 7/10. Decide what training packages are and appropriate pricing for each.",
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const t of tasks) {
    if (!t.ownerId) {
      console.log(`SKIP (no owner found): ${t.title}`);
      skipped++;
      continue;
    }

    const validPartners = t.partnerIds.filter((id): id is string => id !== null);

    const task = await db.task.create({
      data: {
        title: t.title,
        department: "LEADERSHIP",
        employeeId: t.ownerId,
        dueDate: t.dueDate ?? null,
        partners: validPartners.length > 0
          ? { create: validPartners.map((pid) => ({ employeeId: pid })) }
          : undefined,
      },
    });

    if (t.note) {
      await db.taskNote.create({
        data: {
          taskId: task.id,
          body: t.note,
          authorId: t.ownerId,
          noteType: "REGULAR",
        },
      });
    }

    console.log(`Created: ${t.title}`);
    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
}

main().finally(() => db.$disconnect());
