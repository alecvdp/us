"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTasks() {
  return await prisma.task.findMany({
    orderBy: [
      { completed: 'asc' },
      { createdAt: 'desc' }
    ]
  });
}

export async function addTask(formData: FormData) {
  const title = formData.get("title")?.toString();
  const isGrocery = formData.get("isGrocery") === "true";

  if (!title) return;

  await prisma.task.create({
    data: {
      title,
      isGrocery,
    },
  });

  revalidatePath("/");
}

export async function toggleTask(id: string, completed: boolean) {
  await prisma.task.update({
    where: { id },
    data: { completed },
  });

  revalidatePath("/");
}

export async function deleteTask(id: string) {
  await prisma.task.delete({
    where: { id },
  });

  revalidatePath("/");
}
