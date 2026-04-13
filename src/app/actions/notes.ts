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
  try {
    await prisma.note.update({
      where: { id },
      data: { content },
    });
  } catch (err) {
    console.error("Failed to update note", err);
    throw new Error("Failed to update note");
  }
  revalidatePath("/");
}
