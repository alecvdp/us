"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getNotes() {
  const notes = await prisma.note.findMany({
    orderBy: { updatedAt: "desc" },
  });

  if (notes.length === 0) {
    const defaultNote = await prisma.note.create({
      data: { title: "Whiteboard", content: "" },
    });
    return [defaultNote];
  }

  return notes;
}

export async function createNote(title: string) {
  try {
    await prisma.note.create({
      data: { title, content: "" },
    });
  } catch (err) {
    console.error("Failed to create note", err);
    throw new Error("Failed to create note");
  }
  revalidatePath("/");
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

export async function renameNote(id: string, title: string) {
  try {
    await prisma.note.update({
      where: { id },
      data: { title },
    });
  } catch (err) {
    console.error("Failed to rename note", err);
    throw new Error("Failed to rename note");
  }
  revalidatePath("/");
}

export async function deleteNote(id: string) {
  try {
    await prisma.note.delete({
      where: { id },
    });
  } catch (err) {
    console.error("Failed to delete note", err);
    throw new Error("Failed to delete note");
  }
  revalidatePath("/");
}
