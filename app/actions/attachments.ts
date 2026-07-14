"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { slugFromValue } from "@/lib/departments";
import { Department } from "@/app/generated/prisma/client";

async function revalidateTask(taskId: string) {
  const task = await db.task.findUnique({ where: { id: taskId }, select: { department: true } });
  if (task) revalidatePath(`/dept/${slugFromValue(task.department as Department)}`);
}

export async function addAttachment(data: {
  taskId: string;
  title: string;
  url: string;
  addedById: string;
}) {
  let url = data.url.trim();
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;

  await db.taskAttachment.create({
    data: {
      taskId: data.taskId,
      title: data.title.trim(),
      url,
      addedById: data.addedById,
    },
  });
  await revalidateTask(data.taskId);
}

export async function deleteAttachment(attachmentId: string) {
  const att = await db.taskAttachment.delete({
    where: { id: attachmentId },
    select: { taskId: true },
  });
  await revalidateTask(att.taskId);
}
