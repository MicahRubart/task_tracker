"use server";

import { db } from "@/lib/db";
import { Department } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";

/** All active employees — used for the global "signed in as" selector */
export async function getEmployees() {
  return db.employee.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}

/** Employees who belong to a specific department — used for task assignment within a dept page */
export async function getEmployeesForDept(department: Department) {
  return db.employee.findMany({
    where: {
      active: true,
      departments: { has: department },
    },
    orderBy: { name: "asc" },
  });
}

export async function addEmployee(name: string, departments: Department[]) {
  const employee = await db.employee.create({ data: { name, departments } });
  revalidatePath("/", "layout");
  return employee;
}

export async function updateEmployeeDepartments(id: string, departments: Department[]) {
  await db.employee.update({ where: { id }, data: { departments } });
  revalidatePath("/", "layout");
}

export async function deactivateEmployee(id: string) {
  await db.employee.update({ where: { id }, data: { active: false } });
  revalidatePath("/", "layout");
}
