import { Elysia, t } from "elysia";
import { google } from "googleapis";
import { getAuthorizedClient } from "../google";

export const calendarRoutes = new Elysia({ prefix: "/calendar" }).get(
  "/events",
  async ({ query, set }) => {
    const client = await getAuthorizedClient();
    if (!client) {
      set.status = 401;
      return { error: "not_connected", events: [] };
    }
    const cal = google.calendar({ version: "v3", auth: client });
    const res = await cal.events.list({
      calendarId: "primary",
      timeMin: query.from,
      timeMax: query.to,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 2500,
    });
    const events = (res.data.items ?? []).map((e) => ({
      id: e.id!,
      title: e.summary ?? "(no title)",
      start: e.start?.dateTime ?? e.start?.date ?? null,
      end: e.end?.dateTime ?? e.end?.date ?? null,
      allDay: Boolean(e.start?.date),
      location: e.location ?? null,
      description: e.description ?? null,
      htmlLink: e.htmlLink ?? null,
      attendees: (e.attendees ?? []).map((a) => ({
        email: a.email ?? "",
        responseStatus: a.responseStatus ?? null,
      })),
    }));
    return { events };
  },
  {
    query: t.Object({
      from: t.String({ format: "date-time" }),
      to: t.String({ format: "date-time" }),
    }),
  },
);
