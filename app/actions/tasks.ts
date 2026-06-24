"use server";

import { db } from "@/lib/db";
import { Department, TaskStatus } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { slugFromValue } from "@/lib/departments";
import { formatDate } from "@/lib/utils";

function revalidateDept(department: Department) {
  revalidatePath(`/dept/${slugFromValue(department)}`);
}

const FULL_INCLUDE = {
  employee: true,
  goal: true,
  partners: { include: { employee: true } },
  notes: { include: { author: true }, orderBy: { createdAt: "asc" as const } },
  dueDateHistory: { include: { changedBy: true }, orderBy: { changedAt: "asc" as const } },
  linksFrom: { include: { targetTask: { include: { employee: true } } } },
  linksTo: { include: { sourceTask: { include: { employee: true } } } },
};

export async function getTasksForDept(department: Department) {
  try {
    return await db.task.findMany({
      where: { department },
      include: FULL_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("[getTasksForDept]", err);
    throw err;
  }
}

export async function searchTasks(query: string) {
  try {
    return await db.task.findMany({
      where: { title: { contains: query, mode: "insensitive" } },
      include: { employee: true },
      take: 10,
    });
  } catch (err) {
    console.error("[searchTasks]", err);
    throw err;
  }
}

export async function createTask(data: {
  title: string;
  department: Department;
  employeeId: string;
  goalId?: string;
  dueDate?: string;
  partnerIds?: string[];
}) {
  try {
    const task = await db.task.create({
      data: {
        title: data.title,
        department: data.department,
        employeeId: data.employeeId,
        goalId: data.goalId || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        partners: data.partnerIds?.length
          ? { create: data.partnerIds.map((id) => ({ employeeId: id })) }
          : undefined,
      },
      include: FULL_INCLUDE,
    });
    revalidateDept(data.department);
    return task;
  } catch (err) {
    console.error("[createTask]", err);
    throw err;
  }
}

export async function updateTask(
  taskId: string,
  changedById: string,
  data: {
    title?: string;
    goalId?: string | null;
    status?: TaskStatus;
    partnerIds?: string[];
  }
) {
  try {
    const existing = await db.task.findUniqueOrThrow({ where: { id: taskId } });
    const task = await db.task.update({
      where: { id: taskId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.goalId !== undefined && { goalId: data.goalId || null }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.partnerIds !== undefined && {
          partners: {
            deleteMany: {},
            create: data.partnerIds.map((id) => ({ employeeId: id })),
          },
        }),
      },
      include: FULL_INCLUDE,
    });
    revalidateDept(existing.department);
    return task;
  } catch (err) {
    console.error("[updateTask]", err);
    throw err;
  }
}

/** Separate action for due date changes — requires a reason and enforces the lock */
export async function changeDueDate(
  taskId: string,
  changedById: string,
  newDateStr: string,
  reason: string
) {
  try {
    const existing = await db.task.findUniqueOrThrow({
      where: { id: taskId },
      include: { dueDateHistory: true, employee: true },
    });

    // Enforce the lock — due date can only be changed once
    if (existing.dueDateHistory.length >= 1) {
      throw new Error("Due date is locked. It has already been changed once and cannot be changed again.");
    }

    if (!reason.trim()) throw new Error("A reason is required when changing the due date.");

    const newDate = new Date(newDateStr);
    const changedBy = await db.employee.findUniqueOrThrow({ where: { id: changedById } });

    const oldFormatted = existing.dueDate
      ? formatDate(existing.dueDate)
      : "none";
    const newFormatted = formatDate(newDate);

    // Update task + create history + create a DATE_CHANGE note in one transaction
    await db.$transaction([
      db.task.update({
        where: { id: taskId },
        data: { dueDate: newDate },
      }),
      db.dueDateHistory.create({
        data: {
          taskId,
          oldDate: existing.dueDate,
          newDate,
          reason: reason.trim(),
          changedById,
        },
      }),
      db.taskNote.create({
        data: {
          taskId,
          authorId: changedById,
          noteType: "DATE_CHANGE",
          body: `Due date changed from ${oldFormatted} → ${newFormatted}.\n\nReason: ${reason.trim()}`,
        },
      }),
    ]);

    revalidateDept(existing.department);
  } catch (err) {
    console.error("[changeDueDate]", err);
    throw err;
  }
}

/** Change task status — requires a reason; STUCK also requires a deadline */
export async function changeStatus(
  taskId: string,
  changedById: string,
  newStatus: TaskStatus,
  reason: string,
  stuckDeadline?: string | null
) {
  try {
    const existing = await db.task.findUniqueOrThrow({ where: { id: taskId } });
    const changedBy = await db.employee.findUniqueOrThrow({ where: { id: changedById } });

    const oldLabel = existing.status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
    const newLabel = newStatus.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

    let noteBody = `Status changed: ${oldLabel} → ${newLabel}\n\nReason: ${reason.trim()}`;
    if (newStatus === "STUCK" && stuckDeadline) {
      const deadline = new Date(stuckDeadline);
      noteBody += `\n\nMust resolve by: ${formatDate(deadline)}`;
    }

    await db.$transaction([
      db.task.update({
        where: { id: taskId },
        data: {
          status: newStatus,
          stuckDeadline: newStatus === "STUCK" && stuckDeadline
            ? new Date(stuckDeadline)
            : newStatus !== "STUCK"
            ? null          // clear the deadline when leaving STUCK
            : undefined,
        },
      }),
      db.taskNote.create({
        data: {
          taskId,
          authorId: changedById,
          noteType: "STATUS_CHANGE",
          body: noteBody,
        },
      }),
    ]);

    revalidateDept(existing.department);
  } catch (err) {
    console.error("[changeStatus]", err);
    throw err;
  }
}

export async function getCompletedTasksForEmployee(employeeId: string) {
  try {
    return await db.task.findMany({
      where: {
        status: "COMPLETE",
        OR: [
          { employeeId },
          { partners: { some: { employeeId } } },
        ],
      },
      include: FULL_INCLUDE,
      orderBy: { updatedAt: "desc" },
    });
  } catch (err) {
    console.error("[getCompletedTasksForEmployee]", err);
    throw err;
  }
}

export async function deleteTask(taskId: string) {
  try {
    const existing = await db.task.findUniqueOrThrow({ where: { id: taskId } });
    await db.task.delete({ where: { id: taskId } });
    revalidateDept(existing.department);
  } catch (err) {
    console.error("[deleteTask]", err);
    throw err;
  }
}
