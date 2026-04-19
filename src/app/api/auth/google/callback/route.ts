import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Client } from "@/lib/google-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error || !code) {
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("gcal_error", error || "no_code");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const client = getOAuth2Client();
    const { tokens } = await client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error("Missing tokens in Google response");
    }

    // Get the user's email from the token info
    client.setCredentials(tokens);
    const tokenInfo = await client.getTokenInfo(tokens.access_token);
    const email = tokenInfo.email || "unknown";

    const tokenExpiry = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);

    await prisma.googleAccount.upsert({
      where: { email },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry,
      },
      create: {
        email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry,
      },
    });

    return NextResponse.redirect(new URL("/", request.url));
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("gcal_error", "token_exchange_failed");
    return NextResponse.redirect(redirectUrl);
  }
}
