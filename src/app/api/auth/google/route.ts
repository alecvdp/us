import { NextResponse } from "next/server";
import { getAuthorizationUrl } from "@/lib/google-auth";

export async function GET() {
  try {
    const url = getAuthorizationUrl();
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json(
      { error: "Google OAuth not configured" },
      { status: 500 }
    );
  }
}
