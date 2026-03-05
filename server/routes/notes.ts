import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { dailyNotes } from "../db/schema.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  if (!db) return res.json(null);
  const dateParam = req.query.date as string;
  if (!dateParam) return res.status(400).json({ error: "date required" });
  const date = new Date(dateParam);
  date.setHours(0, 0, 0, 0);
  const start = new Date(date);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  const rows = await db
    .select()
    .from(dailyNotes)
    .where(eq(dailyNotes.date, start));
  const row = rows[0];
  if (!row) return res.json(null);
  res.json({
    id: row.id,
    date: row.date,
    yesterdaySummary: row.yesterdaySummary,
    todayPlan: row.todayPlan,
    scratchPad: row.scratchPad,
    endOfDayReflection: row.endOfDayReflection,
  });
});

router.put("/", async (req: Request, res: Response) => {
  if (!db) return res.status(503).json({ error: "No database" });
  const body = req.body as {
    date: string;
    yesterdaySummary?: string;
    todayPlan?: string;
    scratchPad?: string;
    endOfDayReflection?: string;
  };
  if (!body?.date) return res.status(400).json({ error: "date required" });
  const date = new Date(body.date);
  date.setHours(0, 0, 0, 0);
  const existing = await db
    .select()
    .from(dailyNotes)
    .where(eq(dailyNotes.date, date));
  const id = existing[0]?.id ?? crypto.randomUUID();
  const payload = {
    yesterdaySummary: body.yesterdaySummary ?? null,
    todayPlan: body.todayPlan ?? null,
    scratchPad: body.scratchPad ?? null,
    endOfDayReflection: body.endOfDayReflection ?? null,
  };
  if (existing[0]) {
    await db.update(dailyNotes).set(payload).where(eq(dailyNotes.id, id));
  } else {
    await db.insert(dailyNotes).values({ id, date, ...payload });
  }
  res.json({});
});

export default router;
