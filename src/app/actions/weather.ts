"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const DEFAULT_LOCATIONS = [
  {
    name: "Temecula, CA",
    badge: "Home",
    latitude: 33.4936,
    longitude: -117.1484,
    sortOrder: 0,
  },
  {
    name: "San Diego, CA",
    badge: "Work",
    latitude: 32.7157,
    longitude: -117.1611,
    sortOrder: 1,
  },
];

export async function getWeatherLocations() {
  const locations = await prisma.weatherLocation.findMany({
    orderBy: { sortOrder: "asc" },
  });

  // Seed defaults on first load if table is empty
  if (locations.length === 0) {
    await prisma.$transaction(
      DEFAULT_LOCATIONS.map((loc) =>
        prisma.weatherLocation.create({ data: loc })
      )
    );
    return prisma.weatherLocation.findMany({
      orderBy: { sortOrder: "asc" },
    });
  }

  return locations;
}

export async function addWeatherLocation(formData: FormData) {
  const name = formData.get("name")?.toString()?.trim();
  const badge = formData.get("badge")?.toString()?.trim();
  const latitude = parseFloat(formData.get("latitude")?.toString() ?? "");
  const longitude = parseFloat(formData.get("longitude")?.toString() ?? "");

  if (!name || !badge || isNaN(latitude) || isNaN(longitude)) return;

  try {
    const maxSort = await prisma.weatherLocation.aggregate({
      _max: { sortOrder: true },
    });

    await prisma.weatherLocation.create({
      data: {
        name,
        badge,
        latitude,
        longitude,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });
  } catch (err) {
    console.error("Failed to add weather location", err);
    throw new Error("Failed to add weather location");
  }

  revalidatePath("/");
}

export async function deleteWeatherLocation(id: string) {
  try {
    await prisma.weatherLocation.delete({ where: { id } });
  } catch (err) {
    console.error("Failed to delete weather location", err);
    throw new Error("Failed to delete weather location");
  }

  revalidatePath("/");
}
