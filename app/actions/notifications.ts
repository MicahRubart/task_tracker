"use server";

import { db } from "@/lib/db";
import { Department, TriggerType } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";

export async function getDepartmentSettings(department: Department) {
  return db.departmentSettings.findUnique({ where: { department } });
}

export async function saveDepartmentSettings(department: Department, teamsWebhookUrl: string) {
  await db.departmentSettings.upsert({
    where: { department },
    update: { teamsWebhookUrl: teamsWebhookUrl || null },
    create: { department, teamsWebhookUrl: teamsWebhookUrl || null },
  });
  revalidatePath("/", "layout");
}

export async function getRulesForDept(department: Department) {
  return db.notificationRule.findMany({
    where: { department },
    orderBy: { createdAt: "asc" },
  });
}

export async function createRule(data: {
  department: Department;
  name: string;
  triggerType: TriggerType;
  triggerDays: number;
  messageTemplate: string;
}) {
  const rule = await db.notificationRule.create({ data });
  revalidatePath("/", "layout");
  return rule;
}

export async function updateRule(
  id: string,
  data: Partial<{
    name: string;
    triggerType: TriggerType;
    triggerDays: number;
    messageTemplate: string;
    active: boolean;
  }>
) {
  await db.notificationRule.update({ where: { id }, data });
  revalidatePath("/", "layout");
}

export async function deleteRule(id: string) {
  await db.notificationRule.delete({ where: { id } });
  revalidatePath("/", "layout");
}
