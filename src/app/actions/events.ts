"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getEvents() {
  return await prisma.event.findMany({
    orderBy: { date: 'asc' },
    where: {
      date: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)) // only today or future
      }
    }
  });
}

export async function addEvent(formData: FormData) {
  const title = formData.get("title")?.toString();
  const dateStr = formData.get("date")?.toString();
  const timeStr = formData.get("time")?.toString();

  if (!title || !dateStr) return;

  const date = timeStr
    ? new Date(`${dateStr}T${timeStr}`)
    : new Date(`${dateStr}T00:00:00`);
  if (isNaN(date.getTime())) return;

  try {
    await prisma.event.create({
      data: {
        title,
        date,
      },
    });
  } catch (err) {
    console.error("Failed to add event", err);
    throw new Error("Failed to add event");
  }

  revalidatePath("/");
}

export async function deleteEvent(id: string) {
  try {
    await prisma.event.delete({
      where: { id },
    });
  } catch (err) {
    console.error("Failed to delete event", err);
    throw new Error("Failed to delete event");
  }

  revalidatePath("/");
}
