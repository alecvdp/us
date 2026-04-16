import { describe, expect, it } from "vitest";
import {
  addCalendarDays,
  addCalendarMonths,
  daysUntilCalendarDate,
  formatCalendarDateForInput,
  parseCalendarDate,
} from "./dates";

describe("parseCalendarDate", () => {
  it("returns null for null/undefined/empty", () => {
    expect(parseCalendarDate(null)).toBeNull();
    expect(parseCalendarDate(undefined)).toBeNull();
    expect(parseCalendarDate("")).toBeNull();
  });

  it("returns null for malformed input", () => {
    expect(parseCalendarDate("not-a-date")).toBeNull();
    expect(parseCalendarDate("2026-13-99")).toBeNull();
  });

  it("anchors to UTC noon regardless of input", () => {
    const parsed = parseCalendarDate("2026-04-17");
    expect(parsed).not.toBeNull();
    // The whole point of the IRL-22 fix: independent of server TZ, the stored
    // value is always 12:00:00 UTC on the named day.
    expect(parsed!.toISOString()).toBe("2026-04-17T12:00:00.000Z");
  });

  it("preserves the calendar day across DST boundaries", () => {
    // 2026 US DST starts March 8 at 02:00 local. The day before and the day
    // after should both round-trip cleanly to UTC noon.
    expect(parseCalendarDate("2026-03-07")!.toISOString()).toBe(
      "2026-03-07T12:00:00.000Z",
    );
    expect(parseCalendarDate("2026-03-08")!.toISOString()).toBe(
      "2026-03-08T12:00:00.000Z",
    );
    expect(parseCalendarDate("2026-03-09")!.toISOString()).toBe(
      "2026-03-09T12:00:00.000Z",
    );
  });
});

describe("formatCalendarDateForInput", () => {
  it("returns empty string for null/undefined", () => {
    expect(formatCalendarDateForInput(null)).toBe("");
    expect(formatCalendarDateForInput(undefined)).toBe("");
  });

  it("round-trips with parseCalendarDate", () => {
    const cases = ["2026-01-01", "2026-04-17", "2026-12-31", "2027-02-28"];
    for (const input of cases) {
      const parsed = parseCalendarDate(input);
      expect(formatCalendarDateForInput(parsed)).toBe(input);
    }
  });

  it("accepts a Date object directly", () => {
    expect(formatCalendarDateForInput(new Date("2026-04-17T12:00:00.000Z"))).toBe(
      "2026-04-17",
    );
  });
});

describe("addCalendarDays", () => {
  it("advances by whole days in UTC", () => {
    const start = parseCalendarDate("2026-04-17")!;
    expect(addCalendarDays(start, 1).toISOString()).toBe(
      "2026-04-18T12:00:00.000Z",
    );
    expect(addCalendarDays(start, 7).toISOString()).toBe(
      "2026-04-24T12:00:00.000Z",
    );
    expect(addCalendarDays(start, -1).toISOString()).toBe(
      "2026-04-16T12:00:00.000Z",
    );
  });

  it("does not drift the noon-UTC anchor across DST", () => {
    // March 7 2026 is the Saturday before US DST starts. Adding 1 day must
    // still land at noon UTC on March 8, not 11am or 1pm UTC.
    const before = parseCalendarDate("2026-03-07")!;
    const after = addCalendarDays(before, 1);
    expect(after.toISOString()).toBe("2026-03-08T12:00:00.000Z");
    expect(addCalendarDays(before, 7).toISOString()).toBe(
      "2026-03-14T12:00:00.000Z",
    );
  });

  it("does not mutate the input", () => {
    const start = parseCalendarDate("2026-04-17")!;
    const startIso = start.toISOString();
    addCalendarDays(start, 5);
    expect(start.toISOString()).toBe(startIso);
  });
});

describe("addCalendarMonths", () => {
  it("advances by whole months in UTC", () => {
    const start = parseCalendarDate("2026-04-17")!;
    expect(addCalendarMonths(start, 1).toISOString()).toBe(
      "2026-05-17T12:00:00.000Z",
    );
    expect(addCalendarMonths(start, -1).toISOString()).toBe(
      "2026-03-17T12:00:00.000Z",
    );
  });

  it("handles month-end overflow the same way Date does (Jan 31 + 1mo = Mar 3)", () => {
    // Documenting current behavior — Date arithmetic rolls over because Feb is
    // shorter than Jan. If we want clamping ("Jan 31 + 1mo = Feb 28"), that's
    // a separate decision.
    const jan31 = parseCalendarDate("2026-01-31")!;
    const result = addCalendarMonths(jan31, 1);
    expect(result.toISOString()).toBe("2026-03-03T12:00:00.000Z");
  });
});

describe("daysUntilCalendarDate", () => {
  it("returns 0 for the same calendar day", () => {
    const now = new Date("2026-04-17T15:00:00");
    const due = parseCalendarDate("2026-04-17")!;
    expect(daysUntilCalendarDate(due, now)).toBe(0);
  });

  it("returns 1 for tomorrow", () => {
    const now = new Date("2026-04-17T15:00:00");
    const due = parseCalendarDate("2026-04-18")!;
    expect(daysUntilCalendarDate(due, now)).toBe(1);
  });

  it("returns negative for past dates", () => {
    const now = new Date("2026-04-17T15:00:00");
    const due = parseCalendarDate("2026-04-15")!;
    expect(daysUntilCalendarDate(due, now)).toBe(-2);
  });

  it("rounds across DST so a 1-day diff doesn't collapse to 0", () => {
    // March 7 → March 8 spans the US DST transition. Naive floor-division of
    // millisecond diffs would give 0 for the +23h gap. Math.round avoids this.
    const before = new Date("2026-03-07T15:00:00");
    const after = parseCalendarDate("2026-03-08")!;
    expect(daysUntilCalendarDate(after, before)).toBe(1);
  });
});
