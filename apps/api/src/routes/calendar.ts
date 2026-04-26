import { Elysia, t } from "elysia";
import { google } from "googleapis";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { oauthTokens } from "../db/schema";
import { getAuthorizedClient, loadStoredTokens } from "../google";

export const calendarRoutes = new Elysia({ prefix: "/calendar" })
  .get("/list", async ({ set }) => {
    const client = await getAuthorizedClient();
    if (!client) {
      set.status = 401;
      return { error: "not_connected", calendars: [] };
    }
    const cal = google.calendar({ version: "v3", auth: client });
    const res = await cal.calendarList.list();
    const calendars = (res.data.items ?? []).map((c) => ({
      id: c.id!,
      summary: c.summary ?? "(no title)",
      primary: Boolean(c.primary),
      backgroundColor: c.backgroundColor,
      foregroundColor: c.foregroundColor,
    }));
    return { calendars };
  })
  .post(
    "/selected",
    async ({ body }) => {
      const stored = await loadStoredTokens();
      if (!stored) throw new Error("Not authorized");
      await db
        .update(oauthTokens)
        .set({ selectedCalendarIds: body.ids })
        .where(eq(oauthTokens.id, 1));
      return { ok: true };
    },
    {
      body: t.Object({
        ids: t.Array(t.String()),
      }),
    },
  )
  .get(
    "/events",
    async ({ query, set }) => {
      const client = await getAuthorizedClient();
      const stored = await loadStoredTokens();
      if (!client || !stored) {
        set.status = 401;
        return { error: "not_connected", events: [] };
      }

      const calendarIds =
        stored.selectedCalendarIds && stored.selectedCalendarIds.length > 0
          ? stored.selectedCalendarIds
          : ["primary"];

      const cal = google.calendar({ version: "v3", auth: client });

      const allEvents = await Promise.all(
        calendarIds.map(async (calendarId) => {
          try {
            const res = await cal.events.list({
              calendarId,
              timeMin: query.from,
              timeMax: query.to,
              singleEvents: true,
              orderBy: "startTime",
              maxResults: 2500,
            });
            return (res.data.items ?? []).map((e) => ({
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
          } catch (err) {
            console.error(`Error fetching events for ${calendarId}:`, err);
            return [];
          }
        }),
      );

      const events = allEvents.flat();
      return { events };
    },
    {
      query: t.Object({
        from: t.String({ format: "date-time" }),
        to: t.String({ format: "date-time" }),
      }),
    },
  );
