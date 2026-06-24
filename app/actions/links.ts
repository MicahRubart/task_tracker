"use server";

import { db } from "@/lib/db";
import { LinkType } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { slugFromValue } from "@/lib/departments";

export async function linkTasks(sourceTaskId: string, targetTaskId: string, linkType: LinkType) {
  try {
    const source = await db.task.findUniqueOrThrow({ where: { id: sourceTaskId } });
    const link = await db.taskLink.create({
      data: { sourceTaskId, targetTaskId, linkType },
    });
    revalidatePath(`/dept/${slugFromValue(source.department)}`);
    return link;
  } catch (err) {
    console.error("[linkTasks]", err);
    throw err;
  }
}

export async function unlinkTasks(linkId: string) {
  try {
    const link = await db.taskLink.findUniqueOrThrow({
      where: { id: linkId },
      include: { sourceTask: true },
    });
    await db.taskLink.delete({ where: { id: linkId } });
    revalidatePath(`/dept/${slugFromValue(link.sourceTask.department)}`);
  } catch (err) {
    console.error("[unlinkTasks]", err);
    throw err;
  }
}
