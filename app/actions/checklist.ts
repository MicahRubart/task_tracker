"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { slugFromValue } from "@/lib/departments";
import { Department } from "@/app/generated/prisma/client";

async function revalidateTask(taskId: string) {
  const task = await db.task.findUnique({ where: { id: taskId }, select: { department: true } });
  if (task) revalidatePath(`/dept/${slugFromValue(task.department as Department)}`);
}

export async function addChecklistItem(data: {
  taskId: string;
  title: string;
  dueDate?: string;
}) {
  const count = await db.checklistItem.count({ where: { taskId: data.taskId } });
  await db.checklistItem.create({
    data: {
      taskId: data.taskId,
      title: data.title,
      dueDate: data.dueDate ? new Date(data.dueDate + "T00:00:00Z") : null,
      sortOrder: count,
    },
  });
  await revalidateTask(data.taskId);
}

export async function toggleChecklistItem(itemId: string, completed: boolean) {
  const item = await db.checklistItem.update({
    where: { id: itemId },
    data: { completedAt: completed ? new Date() : null },
    select: { taskId: true },
  });
  await revalidateTask(item.taskId);
}

export async function deleteChecklistItem(itemId: string) {
  const item = await db.checklistItem.delete({
    where: { id: itemId },
    select: { taskId: true },
  });
  await revalidateTask(item.taskId);
}

export async function updateChecklistItem(itemId: string, data: {
  title?: string;
  dueDate?: string | null;
}) {
  const item = await db.checklistItem.update({
    where: { id: itemId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.dueDate !== undefined
        ? { dueDate: data.dueDate ? new Date(data.dueDate + "T00:00:00Z") : null }
        : {}),
    },
    select: { taskId: true },
  });
  await revalidateTask(item.taskId);
}
