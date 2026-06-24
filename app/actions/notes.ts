"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { slugFromValue } from "@/lib/departments";

export async function addNote(taskId: string, body: string, authorId: string) {
  try {
    const task = await db.task.findUniqueOrThrow({ where: { id: taskId } });
    const note = await db.taskNote.create({
      data: { taskId, body, authorId },
      include: { author: true },
    });
    revalidatePath(`/dept/${slugFromValue(task.department)}`);
    return note;
  } catch (err) {
    console.error("[addNote]", err);
    throw err;
  }
}
