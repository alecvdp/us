// Shared helpers for "calendar dates" — values that represent a day on the
// calendar (e.g. a task due date, a recurrence anchor) rather than a specific
// instant in time. Stored as a Date pinned to UTC noon so:
//
//   - the value is unambiguous regardless of server timezone (parseDueDate used
//     to parse strings as local time, which silently shifted dates depending
//     on whether the server ran in PT or UTC), and
//
//   - any reader in any timezone from UTC-12 to UTC+12 sees the same calendar
//     day when reading with local Date accessors (noon UTC ± 12h stays inside
//     the same day).

const DAY_MS = 86_400_000;

export function parseCalendarDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  // Force UTC noon — without the trailing Z, JS interprets the string as local
  // time and the stored value depends on server TZ.
  const parsed = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatCalendarDateForInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const parsed = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return "";
  // Read components in local time. Because calendar dates are pinned to UTC
  // noon, any TZ between UTC-12 and UTC+12 reads back the same calendar day.
  const y = parsed.getFullYear();
  const m = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const d = `${parsed.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Day-shifted in UTC so DST transitions don't drift the stored noon-UTC anchor.
export function addCalendarDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function addCalendarMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

// Days from "today" (in the viewer's local TZ) to the given calendar date.
// Negative = past, 0 = today, 1 = tomorrow, etc.
//
// We compare in *local* time because "today" is a viewer concept — a user in PT
// at 11pm on April 16 should see "due tomorrow" for an April 17 task, not "due
// today" because UTC has rolled over.
export function daysUntilCalendarDate(date: Date | string, now: Date = new Date()): number {
  const target = typeof date === "string" ? new Date(date) : date;
  const targetMidnight = new Date(target);
  targetMidnight.setHours(0, 0, 0, 0);
  const todayMidnight = new Date(now);
  todayMidnight.setHours(0, 0, 0, 0);
  // Math.round, not floor — DST transitions make a "1 day" diff land at 23 or 25
  // hours, which floor would round down to 0.
  return Math.round((targetMidnight.getTime() - todayMidnight.getTime()) / DAY_MS);
}
