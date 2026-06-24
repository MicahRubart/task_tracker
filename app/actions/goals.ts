"use server";

import { db } from "@/lib/db";
import { Department } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { slugFromValue } from "@/lib/departments";

export async function getGoalsForDept(department: Department) {
  return db.goal.findMany({
    where: { department, active: true },
    orderBy: { title: "asc" },
  });
}

export async function createGoal(department: Department, title: string, description?: string) {
  const goal = await db.goal.create({ data: { department, title, description } });
  revalidatePath(`/dept/${slugFromValue(department)}`);
  return goal;
}

export async function archiveGoal(id: string) {
  const goal = await db.goal.update({ where: { id }, data: { active: false } });
  revalidatePath(`/dept/${slugFromValue(goal.department)}`);
}
