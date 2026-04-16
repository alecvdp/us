import { describe, expect, it } from "vitest";
import {
  normalizeTaskAssignee,
  normalizeTaskBucket,
  normalizeTaskPriority,
  normalizeTaskRecurrence,
} from "./tasks";

describe("normalizeTaskAssignee", () => {
  it("passes through valid values", () => {
    expect(normalizeTaskAssignee("SHARED")).toBe("SHARED");
    expect(normalizeTaskAssignee("ALEC")).toBe("ALEC");
    expect(normalizeTaskAssignee("PAU")).toBe("PAU");
  });

  it("falls back to SHARED for unknown / legacy values", () => {
    // "WIFE" was the old enum value before IRL-9 renamed to PAU. Rows
    // migrated incorrectly should not crash — they should just default.
    expect(normalizeTaskAssignee("WIFE")).toBe("SHARED");
    expect(normalizeTaskAssignee("")).toBe("SHARED");
    expect(normalizeTaskAssignee("garbage")).toBe("SHARED");
  });
});

describe("normalizeTaskPriority", () => {
  it("passes through valid values", () => {
    expect(normalizeTaskPriority("LOW")).toBe("LOW");
    expect(normalizeTaskPriority("MEDIUM")).toBe("MEDIUM");
    expect(normalizeTaskPriority("HIGH")).toBe("HIGH");
  });

  it("falls back to MEDIUM for unknown values", () => {
    expect(normalizeTaskPriority("URGENT")).toBe("MEDIUM");
    expect(normalizeTaskPriority("")).toBe("MEDIUM");
  });
});

describe("normalizeTaskBucket", () => {
  it("passes through valid values", () => {
    expect(normalizeTaskBucket("TODAY")).toBe("TODAY");
    expect(normalizeTaskBucket("THIS_WEEK")).toBe("THIS_WEEK");
    expect(normalizeTaskBucket("RECURRING")).toBe("RECURRING");
    expect(normalizeTaskBucket("LATER")).toBe("LATER");
  });

  it("falls back to THIS_WEEK for unknown values", () => {
    expect(normalizeTaskBucket("INBOX")).toBe("THIS_WEEK");
    expect(normalizeTaskBucket("")).toBe("THIS_WEEK");
  });
});

describe("normalizeTaskRecurrence", () => {
  it("passes through valid values", () => {
    expect(normalizeTaskRecurrence("NONE")).toBe("NONE");
    expect(normalizeTaskRecurrence("DAILY")).toBe("DAILY");
    expect(normalizeTaskRecurrence("WEEKLY")).toBe("WEEKLY");
    expect(normalizeTaskRecurrence("MONTHLY")).toBe("MONTHLY");
  });

  it("falls back to NONE for unknown values", () => {
    expect(normalizeTaskRecurrence("YEARLY")).toBe("NONE");
    expect(normalizeTaskRecurrence("")).toBe("NONE");
  });
});
