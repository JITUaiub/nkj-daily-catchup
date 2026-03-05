import { Router, Request, Response } from "express";
import { and, eq, gte, lte, or, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { meetings } from "../db/schema.js";
import { getSessionFromRequest } from "../auth.js";
import { getGoogleToken, deleteGoogleToken } from "../lib/google-tokens.js";
import { fetchGoogleCalendarRange } from "../lib/google-calendar.js";

const router = Router();

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
function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rowToDisplay(r: typeof meetings.$inferSelect) {
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

router.get("/google-status", async (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  const userEmail = session?.email ?? null;
  if (!userEmail) {
    return res.json({ googleConnected: false, connectedEmail: null });
  }
  try {
    const stored = await getGoogleToken(userEmail);
    const connected = !!stored?.accessToken;
    return res.json({
      googleConnected: connected,
      connectedEmail: connected ? userEmail : null,
    });
  } catch {
    return res.json({ googleConnected: false, connectedEmail: null });
  }
});

router.get("/today", async (_req: Request, res: Response) => {
  if (!db) return res.json([]);
  const start = startOfToday();
  const end = endOfToday();
  const rows = await db
    .select()
    .from(meetings)
    .where(
      and(
        gte(meetings.startAt, start),
        lte(meetings.startAt, end),
        eq(meetings.status, "active")
      )
    );
  res.json(rows.map(rowToDisplay));
});

router.get("/today-with-google", async (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  const userEmail = session?.email ?? null;
  const includeCancelled = req.query.includeCancelled === "true";
  const includeDormant = req.query.includeDormant === "true";
  if (!db) {
    return res.json({
      meetings: [],
      googleConnected: false,
      connectedEmail: null,
    });
  }
  const start = startOfToday();
  const end = endOfToday();
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

  const rows = await db
    .select()
    .from(meetings)
    .where(
      and(gte(meetings.startAt, start), lte(meetings.startAt, end), visibleCondition)
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

  const list = rows.map(rowToDisplay).sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  res.json({
    meetings: list,
    googleConnected: !!accessToken,
    connectedEmail: accessToken ? userEmail : null,
  });
});

router.get("/week-with-google", async (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  const userEmail = session?.email ?? null;
  const includeCancelled = req.query.includeCancelled === "true";
  const includeDormant = req.query.includeDormant === "true";
  if (!db) {
    return res.json({
      meetingsByDay: [],
      googleConnected: false,
      connectedEmail: null,
    });
  }
  const { start: weekStart, end: weekEnd } = getWeekStartEnd();
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

  const rows = await db
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

  const byDay = new Map<string, ReturnType<typeof rowToDisplay>[]>();
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

  res.json({
    meetingsByDay,
    googleConnected: !!accessToken,
    connectedEmail: accessToken ? userEmail : null,
  });
});

router.post("/sync-google", async (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  const userEmail = session?.email ?? null;
  if (!userEmail || !db) return res.json({ synced: false });

  const stored = await getGoogleToken(userEmail);
  const accessToken = stored?.accessToken ?? null;
  if (!accessToken) return res.json({ synced: false });

  const { start: weekStart, end: weekEnd } = getWeekStartEnd();
  let googleEvents: { id: string; title: string; startAt: Date; endAt: Date; location?: string; link?: string }[];
  try {
    googleEvents = await fetchGoogleCalendarRange(accessToken, weekStart, weekEnd);
  } catch {
    return res.json({ synced: false });
  }

  const fetchedIds = new Set(googleEvents.map((e) => e.id));

  for (const e of googleEvents) {
    const existing = await db
      .select({ id: meetings.id })
      .from(meetings)
      .where(
        and(
          eq(meetings.googleEventId, e.id),
          eq(meetings.calendarAccountEmail, userEmail)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(meetings)
        .set({
          title: e.title,
          startAt: e.startAt,
          endAt: e.endAt,
          location: e.location ?? null,
          link: e.link ?? null,
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(meetings.id, existing[0].id));
    } else {
      await db.insert(meetings).values({
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
      });
    }
  }

  const existingInRange = await db
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
      await db
        .update(meetings)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(meetings.id, row.id));
    }
  }

  res.json({ synced: true });
});

router.post("/", async (req: Request, res: Response) => {
  if (!db) return res.status(503).json({ error: "No database" });
  const body = req.body as {
    title: string;
    startAt: string;
    endAt: string;
    location?: string;
    link?: string;
    prepNotes?: string;
    takePreparation?: string;
    meetingNotes?: string;
    actionItems?: string;
  };
  if (!body?.title || !body?.startAt || !body?.endAt) {
    return res.status(400).json({ error: "title, startAt, endAt required" });
  }
  const id = crypto.randomUUID();
  await db.insert(meetings).values({
    id,
    title: body.title,
    startAt: new Date(body.startAt),
    endAt: new Date(body.endAt),
    location: body.location ?? null,
    link: body.link ?? null,
    prepNotes: body.prepNotes ?? null,
    takePreparation: body.takePreparation ?? null,
    meetingNotes: body.meetingNotes ?? null,
    actionItems: body.actionItems ?? null,
    source: "manual",
    status: "active",
  });
  res.status(201).json({ id });
});

router.patch("/:id", async (req: Request, res: Response) => {
  if (!db) return res.status(503).json({ error: "No database" });
  const body = req.body as {
    prepNotes?: string;
    takePreparation?: string;
    meetingNotes?: string;
    actionItems?: string;
  };
  await db
    .update(meetings)
    .set({
      ...(body.prepNotes !== undefined && { prepNotes: body.prepNotes }),
      ...(body.takePreparation !== undefined && { takePreparation: body.takePreparation }),
      ...(body.meetingNotes !== undefined && { meetingNotes: body.meetingNotes }),
      ...(body.actionItems !== undefined && { actionItems: body.actionItems }),
      updatedAt: new Date(),
    })
    .where(eq(meetings.id, (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)!));
  res.json({ ok: true });
});

router.post("/disconnect-google", async (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  const userEmail = session?.email ?? null;
  if (!userEmail) return res.json({ success: false });

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
  res.json({ success: true });
});

export default router;
