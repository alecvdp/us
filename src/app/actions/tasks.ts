"use server";

import type { Task as PrismaTask } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  normalizeTaskAssignee,
  normalizeTaskBucket,
  normalizeTaskPriority,
  normalizeTaskRecurrence,
  type TaskAssignee,
  type TaskBucket,
  type TaskPriority,
  type TaskRecurrence,
  type TaskSection,
} from "@/lib/tasks";

function parseTitle(value: string) {
  return value.trim().slice(0, 120);
}

function parseAssignee(value: string): TaskAssignee {
  return normalizeTaskAssignee(value);
}

function parsePriority(value: string): TaskPriority {
  return normalizeTaskPriority(value);
}

function parseBucket(value: string): TaskBucket {
  return normalizeTaskBucket(value);
}

function parseRecurrence(value: string): TaskRecurrence {
  return normalizeTaskRecurrence(value);
}

function parseDueDate(value: string | null | undefined) {
  if (!value) return null;

  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getSectionUpdate(section: TaskSection) {
  if (section === "GROCERIES") {
    return { isGrocery: true, bucket: "THIS_WEEK" as TaskBucket };
  }

  return { isGrocery: false, bucket: section as TaskBucket };
}

function addInterval(date: Date, recurrence: TaskRecurrence) {
  const next = new Date(date);

  if (recurrence === "DAILY") {
    next.setDate(next.getDate() + 1);
  } else if (recurrence === "WEEKLY") {
    next.setDate(next.getDate() + 7);
  } else if (recurrence === "MONTHLY") {
    next.setMonth(next.getMonth() + 1);
  }

  return next;
}

function subtractInterval(date: Date, recurrence: TaskRecurrence) {
  const previous = new Date(date);

  if (recurrence === "DAILY") {
    previous.setDate(previous.getDate() - 1);
  } else if (recurrence === "WEEKLY") {
    previous.setDate(previous.getDate() - 7);
  } else if (recurrence === "MONTHLY") {
    previous.setMonth(previous.getMonth() - 1);
  }

  return previous;
}

async function syncRecurringTasks() {
  const now = new Date();
  const recurringTasks = await prisma.task.findMany({
    where: {
      completed: true,
      NOT: { recurrence: "NONE" },
      nextResetAt: { lte: now },
    },
  });

  if (recurringTasks.length === 0) return;

  await Promise.all(
    recurringTasks.map((task) =>
      prisma.task.update({
        where: { id: task.id },
        data: {
          completed: false,
          lastCompletedAt: null,
          nextResetAt: null,
        },
      })
    )
  );
}

type SharedTask = Omit<PrismaTask, "assignee" | "priority" | "bucket" | "recurrence"> & {
  assignee: TaskAssignee;
  priority: TaskPriority;
  bucket: TaskBucket;
  recurrence: TaskRecurrence;
};

export async function getTasks(): Promise<SharedTask[]> {
  await syncRecurringTasks();

  const tasks = await prisma.task.findMany({
    orderBy: [
      { completed: "asc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  });

  return tasks.map((task) => ({
    ...task,
    assignee: parseAssignee(task.assignee),
    priority: parsePriority(task.priority),
    bucket: parseBucket(task.bucket),
    recurrence: parseRecurrence(task.recurrence),
  }));
}

export async function addTask(formData: FormData) {
  const title = parseTitle(formData.get("title")?.toString() ?? "");
  const assignee = parseAssignee(formData.get("assignee")?.toString() ?? "");
  const priority = parsePriority(formData.get("priority")?.toString() ?? "");
  const bucket = parseBucket(formData.get("bucket")?.toString() ?? "");
  const recurrence = parseRecurrence(formData.get("recurrence")?.toString() ?? "");
  const dueDate = parseDueDate(formData.get("dueDate")?.toString());
  const isGrocery = formData.get("isGrocery") === "true";

  if (!title) return;

  try {
    await prisma.task.create({
      data: {
        title,
        assignee,
        priority,
        bucket,
        recurrence,
        dueDate,
        isGrocery,
      },
    });
  } catch (err) {
    console.error("Failed to add task", err);
    throw new Error("Failed to add task");
  }

  revalidatePath("/");
}

export async function updateTask(
  id: string,
  input: {
    title: string;
    assignee: TaskAssignee;
    priority: TaskPriority;
    bucket: TaskBucket;
    recurrence: TaskRecurrence;
    dueDate?: string | null;
    isGrocery: boolean;
  }
) {
  const title = parseTitle(input.title);

  if (!title) return;

  try {
    await prisma.task.update({
      where: { id },
      data: {
        title,
        assignee: parseAssignee(input.assignee),
        priority: parsePriority(input.priority),
        bucket: parseBucket(input.bucket),
        recurrence: parseRecurrence(input.recurrence),
        dueDate: parseDueDate(input.dueDate),
        isGrocery: Boolean(input.isGrocery),
        nextResetAt: null,
      },
    });
  } catch (err) {
    console.error("Failed to update task", err);
    throw new Error("Failed to update task");
  }

  revalidatePath("/");
}

export async function moveTask(
  id: string,
  input: { assignee: TaskAssignee; section: TaskSection }
) {
  const placement = getSectionUpdate(input.section);

  try {
    await prisma.task.update({
      where: { id },
      data: {
        assignee: parseAssignee(input.assignee),
        isGrocery: placement.isGrocery,
        bucket: placement.bucket,
      },
    });
  } catch (err) {
    console.error("Failed to move task", err);
    throw new Error("Failed to move task");
  }

  revalidatePath("/");
}

export async function toggleTask(id: string, completed: boolean) {
  try {
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) return;

    const recurrence = parseRecurrence(task.recurrence);

    if (completed && recurrence !== "NONE") {
      const baseDate = task.dueDate ?? new Date();
      const nextResetAt = addInterval(baseDate, recurrence);

      await prisma.task.update({
        where: { id },
        data: {
          completed: true,
          lastCompletedAt: new Date(),
          nextResetAt,
          dueDate: task.dueDate ? nextResetAt : task.dueDate,
        },
      });
    } else if (!completed && recurrence !== "NONE" && task.nextResetAt) {
      await prisma.task.update({
        where: { id },
        data: {
          completed: false,
          lastCompletedAt: null,
          nextResetAt: null,
          dueDate: task.dueDate ? subtractInterval(task.dueDate, recurrence) : null,
        },
      });
    } else {
      await prisma.task.update({
        where: { id },
        data: {
          completed,
          lastCompletedAt: completed ? new Date() : null,
          nextResetAt: null,
        },
      });
    }
  } catch (err) {
    console.error("Failed to toggle task", err);
    throw new Error("Failed to toggle task");
  }

  revalidatePath("/");
}

export async function deleteTask(id: string) {
  try {
    await prisma.task.delete({
      where: { id },
    });
  } catch (err) {
    console.error("Failed to delete task", err);
    throw new Error("Failed to delete task");
  }

  revalidatePath("/");
}
