import { google } from "googleapis";

export type GoogleCalendarEvent = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  location?: string;
  link?: string;
  source: "google";
};

export async function fetchGoogleCalendarRange(
  accessToken: string,
  start: Date,
  end: Date
): Promise<{ id: string; title: string; startAt: Date; endAt: Date; location?: string; link?: string }[]> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  const items = res.data.items ?? [];
  return items
    .filter((e) => e.start && e.end)
    .map((e) => ({
      id: e.id ?? crypto.randomUUID(),
      title: (e.summary ?? "No title") as string,
      startAt: new Date(e.start!.dateTime ?? e.start!.date!),
      endAt: new Date(e.end!.dateTime ?? e.end!.date!),
      location: e.location ?? undefined,
      link: e.htmlLink ?? undefined,
    }));
}
