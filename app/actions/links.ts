"use server";

import { db } from "@/lib/db";
import { LinkType } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";

export async function linkTasks(sourceTaskId: string, targetTaskId: string, linkType: LinkType) {
  const link = await db.taskLink.create({
    data: { sourceTaskId, targetTaskId, linkType },
  });
  revalidatePath("/");
  return link;
}

export async function unlinkTasks(linkId: string) {
  await db.taskLink.delete({ where: { id: linkId } });
  revalidatePath("/");
}

