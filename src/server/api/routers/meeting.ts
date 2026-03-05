import { z } from "zod";
import { and, eq, gte, inArray, lte, or, sql } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { meetings } from "@/server/db/schema";
import { fetchGoogleCalendarRange } from "@/lib/google-calendar";
import { getGoogleToken, deleteGoogleToken } from "@/server/lib/google-tokens";
import { db as serverDb } from "@/server/db";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfToday() {
  return startOfDay(new Date());
}
function endOfToday() {
  return endOfDay(new Date());
}

function getWeekStartEnd(): { start: Date; end: Date } {
  const start = startOfToday();
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/** YYYY-MM-DD in local time (no UTC shift). */
function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type MeetingDisplay = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  location: string | null;
  link: string | null;
  prepNotes: string | null;
  takePreparation: string | null;
  meetingNotes: string | null;
  actionItems: string | null;
  source: "manual" | "google";
  status: string;
};

function rowToDisplay(r: {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  location: string | null;
  link: string | null;
  prepNotes: string | null;
  takePreparation: string | null;
  meetingNotes: string | null;
  actionItems: string | null;
  source: "manual" | "google";
  status: string;
}): MeetingDisplay {
  return {
    id: r.id,
    title: r.title,
    startAt: r.startAt,
    endAt: r.endAt,
    location: r.location,
    link: r.link,
    prepNotes: r.prepNotes,
    takePreparation: r.takePreparation ?? null,
    meetingNotes: r.meetingNotes ?? null,
    actionItems: r.actionItems ?? null,
    source: r.source,
    status: r.status,
  };
}

export const meetingRouter = createTRPCRouter({
  /** Connection state only (for header/banner). Does not fetch from Google. */
  getGoogleConnectionStatus: publicProcedure.query(async ({ ctx }) => {
    const userEmail = ctx.session?.user?.email ?? null;
    if (!userEmail) {
      return { googleConnected: false, connectedEmail: null as string | null };
    }
    try {
      const stored = await getGoogleToken(userEmail);
      const connected = !!stored?.accessToken;
      return {
        googleConnected: connected,
        connectedEmail: connected ? userEmail : null,
      };
    } catch {
      return { googleConnected: false, connectedEmail: null };
    }
  }),

  getToday: publicProcedure.query(async ({ ctx }) => {
    const start = startOfToday();
    const end = endOfToday();
    if (!ctx.db) return [];
    const rows = await ctx.db
      .select()
      .from(meetings)
      .where(
        and(
          gte(meetings.startAt, start),
          lte(meetings.startAt, end),
          eq(meetings.status, "active")
        )
      );
    return rows.map(rowToDisplay);
  }),

  /** Reads only from DB (no Google API call). Use syncGoogle to fetch from Google. */
  getTodayWithGoogle: publicProcedure
    .input(
      z
        .object({
          includeCancelled: z.boolean().optional(),
          includeDormant: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const start = startOfToday();
      const end = endOfToday();
      const userEmail = ctx.session?.user?.email ?? null;
      const includeCancelled = input?.includeCancelled ?? false;
      const includeDormant = input?.includeDormant ?? false;

      if (!ctx.db) {
        return {
          meetings: [] as MeetingDisplay[],
          googleConnected: false,
          connectedEmail: null as string | null,
        };
      }

      const statuses: ("active" | "cancelled" | "dormant")[] = ["active"];
      if (includeCancelled) statuses.push("cancelled");
      if (includeDormant) statuses.push("dormant");

      const visibleCondition = userEmail
        ? or(
            eq(meetings.source, "manual"),
            and(
              eq(meetings.source, "google"),
              eq(meetings.calendarAccountEmail, userEmail),
              inArray(meetings.status, statuses)
            )
          )!
        : eq(meetings.source, "manual");

      const rows = await ctx.db
        .select()
        .from(meetings)
        .where(
          and(
            gte(meetings.startAt, start),
            lte(meetings.startAt, end),
            visibleCondition
          )
        );

    let accessToken: string | null = null;
    if (userEmail) {
      try {
        const stored = await getGoogleToken(userEmail);
        accessToken = stored?.accessToken ?? null;
      } catch {
        accessToken = null;
      }
    }

      const list = rows.map(rowToDisplay);
      list.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

      return {
        meetings: list,
        googleConnected: !!accessToken,
        connectedEmail: accessToken ? userEmail : null,
      };
    }),

  /** Reads only from DB (no Google API call). Use syncGoogle to fetch from Google. */
  getWeekWithGoogle: publicProcedure
    .input(
      z
        .object({
          includeCancelled: z.boolean().optional(),
          includeDormant: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { start: weekStart, end: weekEnd } = getWeekStartEnd();
      const userEmail = ctx.session?.user?.email ?? null;
      const includeCancelled = input?.includeCancelled ?? false;
      const includeDormant = input?.includeDormant ?? false;

      if (!ctx.db) {
        return {
          meetingsByDay: [] as { date: string; meetings: MeetingDisplay[] }[],
          googleConnected: false,
          connectedEmail: null as string | null,
        };
      }

      const statuses: ("active" | "cancelled" | "dormant")[] = ["active"];
      if (includeCancelled) statuses.push("cancelled");
      if (includeDormant) statuses.push("dormant");

      const visibleCondition = userEmail
        ? or(
            eq(meetings.source, "manual"),
            and(
              eq(meetings.source, "google"),
              eq(meetings.calendarAccountEmail, userEmail),
              inArray(meetings.status, statuses)
            )
          )!
        : eq(meetings.source, "manual");

      const rows = await ctx.db
        .select()
        .from(meetings)
        .where(
          and(
            gte(meetings.startAt, weekStart),
            lte(meetings.startAt, weekEnd),
            visibleCondition
          )
        );

      let accessToken: string | null = null;
      if (userEmail) {
        try {
          const stored = await getGoogleToken(userEmail);
          accessToken = stored?.accessToken ?? null;
        } catch {
          accessToken = null;
        }
      }

      const byDay = new Map<string, MeetingDisplay[]>();
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        byDay.set(toLocalDateKey(d), []);
      }
      for (const r of rows) {
        const dayKey = toLocalDateKey(new Date(r.startAt));
        const arr = byDay.get(dayKey);
        if (arr) arr.push(rowToDisplay(r));
      }
      const meetingsByDay = Array.from(byDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, meetingsList]) => {
          meetingsList.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
          return { date, meetings: meetingsList };
        });

      return {
        meetingsByDay,
        googleConnected: !!accessToken,
        connectedEmail: accessToken ? userEmail : null,
      };
    }),

  /** Fetches from Google Calendar and upserts into DB. Only procedure that calls Google. */
  syncGoogle: publicProcedure.mutation(async ({ ctx }) => {
    const userEmail = ctx.session?.user?.email ?? null;
    if (!userEmail || !ctx.db) return { synced: false };

    const stored = await getGoogleToken(userEmail);
    const accessToken = stored?.accessToken ?? null;
    if (!accessToken) return { synced: false };

    const { start: weekStart, end: weekEnd } = getWeekStartEnd();
    let googleEvents: { id: string; title: string; startAt: Date; endAt: Date; location?: string; link?: string }[];
    try {
      googleEvents = await fetchGoogleCalendarRange(accessToken, weekStart, weekEnd);
    } catch {
      return { synced: false };
    }

    const fetchedIds = new Set(googleEvents.map((e) => e.id));

    // Upsert: one meeting per Google event (unique on googleEventId + calendarAccountEmail)
    for (const e of googleEvents) {
      await ctx.db
        .insert(meetings)
        .values({
          id: crypto.randomUUID(),
          title: e.title,
          startAt: e.startAt,
          endAt: e.endAt,
          location: e.location ?? null,
          link: e.link ?? null,
          source: "google",
          status: "active",
          googleEventId: e.id,
          calendarAccountEmail: userEmail,
        })
        .onDuplicateKeyUpdate({
          set: {
            title: sql`values(title)`,
            startAt: sql`values(start_at)`,
            endAt: sql`values(end_at)`,
            location: sql`values(location)`,
            link: sql`values(link)`,
            status: sql`'active'`,
            updatedAt: sql`current_timestamp()`,
          },
        });
    }

    const existingInRange = await ctx.db
      .select({ id: meetings.id, googleEventId: meetings.googleEventId })
      .from(meetings)
      .where(
        and(
          eq(meetings.source, "google"),
          eq(meetings.calendarAccountEmail, userEmail),
          gte(meetings.startAt, weekStart),
          lte(meetings.startAt, weekEnd)
        )
      );

    for (const row of existingInRange) {
      if (row.googleEventId && !fetchedIds.has(row.googleEventId)) {
        await ctx.db
          .update(meetings)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(meetings.id, row.id));
      }
    }

    return { synced: true };
  }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        startAt: z.date(),
        endAt: z.date(),
        location: z.string().optional(),
        link: z.string().optional(),
        prepNotes: z.string().optional(),
        takePreparation: z.string().optional(),
        meetingNotes: z.string().optional(),
        actionItems: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      if (ctx.db) {
        await ctx.db.insert(meetings).values({
          id,
          title: input.title,
          startAt: input.startAt,
          endAt: input.endAt,
          location: input.location ?? null,
          link: input.link ?? null,
          prepNotes: input.prepNotes ?? null,
          takePreparation: input.takePreparation ?? null,
          meetingNotes: input.meetingNotes ?? null,
          actionItems: input.actionItems ?? null,
          source: "manual",
          status: "active",
        });
        return { id };
      }
      return { id };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        prepNotes: z.string().optional(),
        takePreparation: z.string().optional(),
        meetingNotes: z.string().optional(),
        actionItems: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.db) return { ok: false };
      await ctx.db
        .update(meetings)
        .set({
          ...(input.prepNotes !== undefined && { prepNotes: input.prepNotes }),
          ...(input.takePreparation !== undefined && { takePreparation: input.takePreparation }),
          ...(input.meetingNotes !== undefined && { meetingNotes: input.meetingNotes }),
          ...(input.actionItems !== undefined && { actionItems: input.actionItems }),
          updatedAt: new Date(),
        })
        .where(eq(meetings.id, input.id));
      return { ok: true };
    }),

  disconnectGoogle: publicProcedure.mutation(async ({ ctx }) => {
    const userEmail = ctx.session?.user?.email ?? null;
    if (!userEmail) return { success: false };

    const db = ctx.db ?? serverDb;
    if (db) {
      await db
        .update(meetings)
        .set({ status: "dormant", updatedAt: new Date() })
        .where(
          and(
            eq(meetings.source, "google"),
            eq(meetings.calendarAccountEmail, userEmail)
          )
        );
    }
    await deleteGoogleToken(userEmail);
    return { success: true };
  }),
});
