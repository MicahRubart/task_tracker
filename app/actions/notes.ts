"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addNote(taskId: string, body: string, authorId: string) {
  const note = await db.taskNote.create({
    data: { taskId, body, authorId },
    include: { author: true },
  });
  revalidatePath("/");
  return note;
}
