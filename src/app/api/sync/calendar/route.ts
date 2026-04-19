import { NextResponse } from "next/server";
import { syncCalendarEvents } from "@/lib/google-calendar";

export async function GET() {
  try {
    const result = await syncCalendarEvents();
    return NextResponse.json(result);
  } catch (err) {
    console.error("Calendar sync endpoint error:", err);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
