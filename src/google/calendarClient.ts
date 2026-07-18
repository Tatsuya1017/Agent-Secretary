import { google } from "googleapis";
import { getOAuthClientForUser } from "../auth/googleAuth";

export interface CalendarEventInput {
  title: string;
  startAt: string; // ISO8601
  endAt?: string; // ISO8601、省略時は開始から1時間後
  location?: string;
}

export interface CalendarEventResult {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  location?: string;
}

async function getCalendarApi(userId: number) {
  const auth = await getOAuthClientForUser(userId);
  if (!auth) return null;
  return google.calendar({ version: "v3", auth });
}

export async function createCalendarEvent(
  userId: number,
  input: CalendarEventInput
): Promise<{ connected: false } | { connected: true; event: CalendarEventResult }> {
  const calendar = await getCalendarApi(userId);
  if (!calendar) return { connected: false };

  const start = new Date(input.startAt);
  const end = input.endAt ? new Date(input.endAt) : new Date(start.getTime() + 60 * 60 * 1000);

  const { data } = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: input.title,
      location: input.location,
      start: { dateTime: start.toISOString(), timeZone: "Asia/Tokyo" },
      end: { dateTime: end.toISOString(), timeZone: "Asia/Tokyo" },
    },
  });

  return {
    connected: true,
    event: {
      id: data.id ?? "",
      title: data.summary ?? input.title,
      startAt: data.start?.dateTime ?? start.toISOString(),
      endAt: data.end?.dateTime ?? end.toISOString(),
      location: data.location ?? undefined,
    },
  };
}

export async function listCalendarEvents(
  userId: number,
  from?: string,
  to?: string
): Promise<{ connected: false } | { connected: true; events: CalendarEventResult[] }> {
  const calendar = await getCalendarApi(userId);
  if (!calendar) return { connected: false };

  const timeMin = from ? new Date(from) : new Date();
  const timeMax = to ? new Date(to) : new Date(timeMin.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data } = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  const events: CalendarEventResult[] = (data.items ?? []).map((item) => ({
    id: item.id ?? "",
    title: item.summary ?? "(無題)",
    startAt: item.start?.dateTime ?? item.start?.date ?? "",
    endAt: item.end?.dateTime ?? item.end?.date ?? "",
    location: item.location ?? undefined,
  }));

  return { connected: true, events };
}
