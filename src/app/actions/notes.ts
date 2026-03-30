"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getNote() {
  const note = await prisma.note.findFirst({
    orderBy: { updatedAt: 'desc' }
  });
  
  if (!note) {
    return await prisma.note.create({
      data: { content: "" }
    });
  }
  return note;
}

export async function updateNote(id: string, content: string) {
  await prisma.note.update({
    where: { id },
    data: { content },
  });
  revalidatePath("/");
}
