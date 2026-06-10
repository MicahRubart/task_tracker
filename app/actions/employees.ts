"use server";

import { db } from "@/lib/db";
import { Department } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";

export async function getEmployees() {
  return db.employee.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}

export async function addEmployee(name: string, department: Department) {
  const employee = await db.employee.create({ data: { name, department } });
  revalidatePath("/", "layout");
  return employee;
}

export async function deactivateEmployee(id: string) {
  await db.employee.update({ where: { id }, data: { active: false } });
  revalidatePath("/", "layout");
}

