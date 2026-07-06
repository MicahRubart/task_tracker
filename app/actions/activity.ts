"use server";

import { db } from "@/lib/db";

export type NotificationType = "OVERDUE" | "MENTION";

export interface AppNotification {
  id: string;
  type: NotificationType;
  taskId: string;
  taskTitle: string;
  taskDept: string;
  message: string;
  timestamp: Date;
}

export async function getActivityForEmployee(employeeId: string): Promise<AppNotification[]> {
  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    select: { name: true },
  });
  if (!employee) return [];

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const today = new Date(now); today.setHours(0, 0, 0, 0);

  const myTasks = await db.task.findMany({
    where: {
      status: { not: "COMPLETE" },
      OR: [
        { employeeId },
        { partners: { some: { employeeId } } },
      ],
    },
    select: {
      id: true,
      title: true,
      department: true,
      dueDate: true,
      notes: {
        where: { createdAt: { gte: sevenDaysAgo } },
        include: { author: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const notifications: AppNotification[] = [];
  const seen = new Set<string>();

  function push(n: AppNotification) {
    if (!seen.has(n.id)) { seen.add(n.id); notifications.push(n); }
  }

  for (const task of myTasks) {
    if (task.dueDate) {
      const due = new Date(task.dueDate); due.setHours(0, 0, 0, 0);
      if (due < today) {
        push({ id: `overdue-${task.id}`, type: "OVERDUE", taskId: task.id, taskTitle: task.title, taskDept: task.department, message: "This task is overdue", timestamp: task.dueDate });
      }
    }

    for (const note of task.notes) {
      if (note.authorId === employeeId) continue;
      if (note.body.includes(`@${employee.name}`)) {
        push({ id: `mention-${note.id}`, type: "MENTION", taskId: task.id, taskTitle: task.title, taskDept: task.department, message: `${note.author.name} mentioned you`, timestamp: note.createdAt });
      }
    }
  }

  // @mentions in tasks where we're not owner/partner
  const myTaskIds = [...new Set(myTasks.map((t) => t.id))];
  const mentionNotes = await db.taskNote.findMany({
    where: {
      body: { contains: `@${employee.name}` },
      createdAt: { gte: sevenDaysAgo },
      authorId: { not: employeeId },
      taskId: myTaskIds.length > 0 ? { notIn: myTaskIds } : undefined,
    },
    include: { task: true, author: true },
  });

  for (const note of mentionNotes) {
    push({ id: `mention-${note.id}`, type: "MENTION", taskId: note.taskId, taskTitle: note.task.title, taskDept: note.task.department, message: `${note.author.name} mentioned you`, timestamp: note.createdAt });
  }

  notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return notifications;
}
