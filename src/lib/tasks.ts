export const taskAssigneeOrder = ["SHARED", "ALEC", "PAU"] as const;
export type TaskAssignee = (typeof taskAssigneeOrder)[number];
const validAssignees = new Set<TaskAssignee>(taskAssigneeOrder);

export const taskPriorityOrder = ["LOW", "MEDIUM", "HIGH"] as const;
export type TaskPriority = (typeof taskPriorityOrder)[number];
const validPriorities = new Set<TaskPriority>(taskPriorityOrder);

export const taskBucketOrder = ["TODAY", "THIS_WEEK", "RECURRING", "LATER"] as const;
export type TaskBucket = (typeof taskBucketOrder)[number];
const validBuckets = new Set<TaskBucket>(taskBucketOrder);

export const taskSectionOrder = ["TODAY", "THIS_WEEK", "GROCERIES", "RECURRING", "LATER"] as const;
export type TaskSection = (typeof taskSectionOrder)[number];

export const taskRecurrenceOrder = ["NONE", "DAILY", "WEEKLY", "MONTHLY"] as const;
export type TaskRecurrence = (typeof taskRecurrenceOrder)[number];
const validRecurrences = new Set<TaskRecurrence>(taskRecurrenceOrder);

export const taskAssigneeMeta: Record<
  TaskAssignee,
  { label: string; avatar: string; accentClass: string }
> = {
  SHARED: {
    label: "Shared",
    avatar: "Us",
    accentClass: "sharedAccent",
  },
  ALEC: {
    label: "Alec",
    avatar: "A",
    accentClass: "alecAccent",
  },
  PAU: {
    label: "Pau",
    avatar: "P",
    accentClass: "pauAccent",
  },
};

export const taskPriorityMeta: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  LOW: {
    label: "Low",
    className: "priorityLow",
  },
  MEDIUM: {
    label: "Medium",
    className: "priorityMedium",
  },
  HIGH: {
    label: "High",
    className: "priorityHigh",
  },
};

export const taskBucketMeta: Record<
  TaskBucket,
  { label: string }
> = {
  TODAY: { label: "Today" },
  THIS_WEEK: { label: "This Week" },
  RECURRING: { label: "Recurring" },
  LATER: { label: "Later" },
};

export const taskSectionMeta: Record<
  TaskSection,
  { label: string }
> = {
  TODAY: { label: "Today" },
  THIS_WEEK: { label: "This Week" },
  GROCERIES: { label: "Groceries" },
  RECURRING: { label: "Recurring" },
  LATER: { label: "Later" },
};

export const taskRecurrenceMeta: Record<
  TaskRecurrence,
  { label: string }
> = {
  NONE: { label: "Doesn't repeat" },
  DAILY: { label: "Daily" },
  WEEKLY: { label: "Weekly" },
  MONTHLY: { label: "Monthly" },
};

export function normalizeTaskAssignee(value: string): TaskAssignee {
  return validAssignees.has(value as TaskAssignee)
    ? (value as TaskAssignee)
    : "SHARED";
}

export function normalizeTaskPriority(value: string): TaskPriority {
  return validPriorities.has(value as TaskPriority)
    ? (value as TaskPriority)
    : "MEDIUM";
}

export function normalizeTaskBucket(value: string): TaskBucket {
  return validBuckets.has(value as TaskBucket)
    ? (value as TaskBucket)
    : "THIS_WEEK";
}

export function normalizeTaskRecurrence(value: string): TaskRecurrence {
  return validRecurrences.has(value as TaskRecurrence)
    ? (value as TaskRecurrence)
    : "NONE";
}
