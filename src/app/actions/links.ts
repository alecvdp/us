"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getLinks() {
  return await prisma.link.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function addLink(formData: FormData) {
  const url = formData.get("url")?.toString();
  const title = formData.get("title")?.toString();
  const isStatic = formData.get("isStatic") === "true";

  if (!url || !title) return;

  await prisma.link.create({
    data: {
      url,
      title,
      isStatic,
    },
  });

  revalidatePath("/");
}

export async function deleteLink(id: string) {
  await prisma.link.delete({
    where: { id },
  });

  revalidatePath("/");
}
