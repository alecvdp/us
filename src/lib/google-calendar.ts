import { prisma } from "@/lib/prisma";
import { getOAuth2Client } from "@/lib/google-auth";
import type { GoogleAccount } from "@prisma/client";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

type GoogleCalendarEvent = {
  id: string;
  summary?: string;
  start: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  status: string;
};

type GoogleCalendarListResponse = {
  items?: GoogleCalendarEvent[];
};

async function getValidAccessToken(
  account: GoogleAccount
): Promise<string> {
  // If token is still valid (with 60s buffer), return it
  if (account.tokenExpiry.getTime() > Date.now() + 60_000) {
    return account.accessToken;
  }

  // Refresh the token
  const client = getOAuth2Client();
  client.setCredentials({
    refresh_token: account.refreshToken,
  });

  const { credentials } = await client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error("Failed to refresh Google access token");
  }

  const tokenExpiry = credentials.expiry_date
    ? new Date(credentials.expiry_date)
    : new Date(Date.now() + 3600 * 1000);

  // Update stored token
  await prisma.googleAccount.update({
    where: { id: account.id },
    data: {
      accessToken: credentials.access_token,
      tokenExpiry,
    },
  });

  return credentials.access_token;
}

async function fetchUpcomingEvents(
  accessToken: string,
  calendarId: string
): Promise<GoogleCalendarEvent[]> {
  const now = new Date();
  const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "100",
  });

  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Calendar API error ${res.status}: ${text}`);
  }

  const data: GoogleCalendarListResponse = await res.json();
  return (data.items || []).filter((e) => e.status !== "cancelled");
}

function parseGoogleDate(dt: { dateTime?: string; date?: string }): Date {
  if (dt.dateTime) return new Date(dt.dateTime);
  if (dt.date) return new Date(`${dt.date}T12:00:00.000Z`);
  return new Date();
}

export async function syncCalendarEvents(): Promise<{
  synced: number;
  removed: number;
}> {
  const accounts = await prisma.googleAccount.findMany();
  let totalSynced = 0;
  let totalRemoved = 0;

  for (const account of accounts) {
    try {
      const accessToken = await getValidAccessToken(account);
      const googleEvents = await fetchUpcomingEvents(
        accessToken,
        account.calendarId
      );

      const googleEventIds = new Set(googleEvents.map((e) => e.id));

      // Upsert events from Google
      for (const ge of googleEvents) {
        const title = ge.summary || "(No title)";
        const date = parseGoogleDate(ge.start);
        const endDate = ge.end ? parseGoogleDate(ge.end) : null;

        await prisma.event.upsert({
          where: { googleEventId: ge.id },
          update: { title, date, endDate },
          create: {
            title,
            date,
            endDate,
            source: "google",
            googleEventId: ge.id,
          },
        });
        totalSynced++;
      }

      // Remove Google events that are no longer in the API response
      const existingGoogleEvents = await prisma.event.findMany({
        where: { source: "google" },
        select: { id: true, googleEventId: true },
      });

      for (const existing of existingGoogleEvents) {
        if (existing.googleEventId && !googleEventIds.has(existing.googleEventId)) {
          await prisma.event.delete({ where: { id: existing.id } });
          totalRemoved++;
        }
      }

      // Update last sync timestamp
      await prisma.googleAccount.update({
        where: { id: account.id },
        data: { lastSyncAt: new Date() },
      });
    } catch (err) {
      console.error(`Google Calendar sync failed for ${account.email}:`, err);
    }
  }

  return { synced: totalSynced, removed: totalRemoved };
}

export async function syncIfStale(): Promise<void> {
  const accounts = await prisma.googleAccount.findMany();
  if (accounts.length === 0) return;

  const needsSync = accounts.some(
    (a) =>
      !a.lastSyncAt ||
      Date.now() - a.lastSyncAt.getTime() > SYNC_COOLDOWN_MS
  );

  if (needsSync) {
    await syncCalendarEvents();
  }
}

export async function getGoogleAccounts() {
  return prisma.googleAccount.findMany({
    select: {
      id: true,
      email: true,
      calendarId: true,
      lastSyncAt: true,
    },
  });
}

export async function disconnectGoogleAccount(id: string) {
  // Delete all Google events from this account
  // Since we only support one calendar per account right now,
  // remove all Google-sourced events when disconnecting
  await prisma.event.deleteMany({ where: { source: "google" } });
  await prisma.googleAccount.delete({ where: { id } });
}
