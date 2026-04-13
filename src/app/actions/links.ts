"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const EXPIRY_DAYS = 7;

export async function getLinks() {
  // Auto-cleanup: delete unpinned links older than EXPIRY_DAYS
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - EXPIRY_DAYS);

  await prisma.link.deleteMany({
    where: {
      isPinned: false,
      createdAt: { lt: cutoff },
    },
  });

  return await prisma.link.findMany({
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });
}

export async function addLink(formData: FormData) {
  const url = formData.get("url")?.toString();
  const title = formData.get("title")?.toString();
  const isPinned = formData.get("isPinned") === "true";

  if (!url || !title) return;

  try {
    await prisma.link.create({
      data: { url, title, isPinned },
    });
  } catch (err) {
    console.error("Failed to add link", err);
    throw new Error("Failed to add link");
  }

  revalidatePath("/");
}

export async function togglePin(id: string) {
  try {
    const link = await prisma.link.findUnique({ where: { id } });
    if (!link) return;
    await prisma.link.update({
      where: { id },
      data: { isPinned: !link.isPinned },
    });
  } catch (err) {
    console.error("Failed to toggle pin", err);
    throw new Error("Failed to toggle pin");
  }

  revalidatePath("/");
}

export async function deleteLink(id: string) {
  try {
    await prisma.link.delete({ where: { id } });
  } catch (err) {
    console.error("Failed to delete link", err);
    throw new Error("Failed to delete link");
  }

  revalidatePath("/");
}
