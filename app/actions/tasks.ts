"use server";

import { db } from "@/lib/db";
import { Department, TaskStatus } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";

export async function getTasksForDept(department: Department) {
  return db.task.findMany({
    where: { department },
    include: {
      employee: true,
      partners: { include: { employee: true } },
      notes: { include: { author: true }, orderBy: { createdAt: "asc" } },
      dueDateHistory: { include: { changedBy: true }, orderBy: { changedAt: "asc" } },
      linksFrom: { include: { targetTask: { include: { employee: true } } } },
      linksTo: { include: { sourceTask: { include: { employee: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function searchTasks(query: string) {
  return db.task.findMany({
    where: { title: { contains: query, mode: "insensitive" } },
    include: { employee: true },
    take: 10,
  });
}

export async function createTask(data: {
  title: string;
  department: Department;
  employeeId: string;
  dueDate?: string;
  partnerIds?: string[];
}) {
  const task = await db.task.create({
    data: {
      title: data.title,
      department: data.department,
      employeeId: data.employeeId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      partners: data.partnerIds?.length
        ? { create: data.partnerIds.map((id) => ({ employeeId: id })) }
        : undefined,
    },
    include: {
      employee: true,
      partners: { include: { employee: true } },
      notes: { include: { author: true } },
      dueDateHistory: { include: { changedBy: true } },
      linksFrom: { include: { targetTask: { include: { employee: true } } } },
      linksTo: { include: { sourceTask: { include: { employee: true } } } },
    },
  });
  revalidatePath("/");
  return task;
}

export async function updateTask(
  taskId: string,
  changedById: string,
  data: {
    title?: string;
    dueDate?: string | null;
    status?: TaskStatus;
    partnerIds?: string[];
  }
) {
  const existing = await db.task.findUniqueOrThrow({ where: { id: taskId } });

  const newDueDate = data.dueDate === undefined
    ? undefined
    : data.dueDate === null
    ? null
    : new Date(data.dueDate);

  const dueDateChanged =
    newDueDate !== undefined &&
    (existing.dueDate?.toISOString() ?? null) !== (newDueDate?.toISOString() ?? null);

  const task = await db.task.update({
    where: { id: taskId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(newDueDate !== undefined && { dueDate: newDueDate }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.partnerIds !== undefined && {
        partners: {
          deleteMany: {},
          create: data.partnerIds.map((id) => ({ employeeId: id })),
        },
      }),
      ...(dueDateChanged && {
        dueDateHistory: {
          create: {
            oldDate: existing.dueDate,
            newDate: newDueDate,
            changedById,
          },
        },
      }),
    },
    include: {
      employee: true,
      partners: { include: { employee: true } },
      notes: { include: { author: true }, orderBy: { createdAt: "asc" } },
      dueDateHistory: { include: { changedBy: true }, orderBy: { changedAt: "asc" } },
      linksFrom: { include: { targetTask: { include: { employee: true } } } },
      linksTo: { include: { sourceTask: { include: { employee: true } } } },
    },
  });
  revalidatePath("/");
  return task;
}

export async function deleteTask(taskId: string) {
  await db.task.delete({ where: { id: taskId } });
  revalidatePath("/");
}

