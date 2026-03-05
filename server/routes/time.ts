import { Router, Request, Response } from "express";
import { eq, gte } from "drizzle-orm";
import { db } from "../db/index.js";
import { timeEntries } from "../db/schema.js";

const router = Router();

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

router.get("/active", async (_req: Request, res: Response) => {
  if (!db) return res.json(null);
  const rows = await db
    .select()
    .from(timeEntries)
    .where(eq(timeEntries.endedAt, null as unknown as Date));
  const row = rows[0];
  if (!row) return res.json(null);
  res.json({
    id: row.id,
    startedAt: row.startedAt,
    taskId: row.taskId,
    category: row.category,
  });
});

router.post("/start", async (req: Request, res: Response) => {
  if (!db) return res.status(503).json({ error: "No database" });
  const body = req.body as { taskId?: string; category?: string };
  const id = crypto.randomUUID();
  const startedAt = new Date();
  await db.insert(timeEntries).values({
    id,
    startedAt,
    taskId: body?.taskId ?? null,
    category: body?.category ?? "coding",
  });
  res.status(201).json({ id, startedAt });
});

router.post("/stop", async (_req: Request, res: Response) => {
  if (!db) return res.status(503).json({ error: "No database" });
  const now = new Date();
  const rows = await db
    .select()
    .from(timeEntries)
    .where(eq(timeEntries.endedAt, null as unknown as Date));
  const row = rows[0];
  if (row) {
    await db.update(timeEntries).set({ endedAt: now }).where(eq(timeEntries.id, row.id));
  }
  res.json({});
});

router.get("/today", async (_req: Request, res: Response) => {
  if (!db) return res.json({ byProject: [], byCategory: [], total: 0 });
  const start = startOfToday();
  const rows = await db
    .select()
    .from(timeEntries)
    .where(gte(timeEntries.startedAt, start));
  const byCategory: Record<string, number> = {};
  const now = new Date();
  for (const r of rows) {
    const end = r.endedAt ?? now;
    const min = Math.round((end.getTime() - new Date(r.startedAt).getTime()) / 60000);
    byCategory[r.category] = (byCategory[r.category] ?? 0) + min;
  }
  const byCategoryList = Object.entries(byCategory).map(([category, minutes]) => ({
    category,
    minutes,
  }));
  const total = byCategoryList.reduce((s, r) => s + r.minutes, 0);
  res.json({ byProject: [], byCategory: byCategoryList, total });
});

export default router;
