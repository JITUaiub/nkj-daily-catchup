import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { followUps } from "../db/schema.js";

const router = Router();

function isDueToday(d: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  return d >= today && d <= end;
}

function toFollowUp(r: typeof followUps.$inferSelect) {
  return {
    id: r.id,
    title: r.title,
    contextNote: r.contextNote,
    dueAt: r.dueAt,
    completedAt: r.completedAt,
    priority: r.priority,
    snoozedUntil: r.snoozedUntil,
    createdAt: r.createdAt,
  };
}

router.get("/", async (req: Request, res: Response) => {
  if (!db) return res.json([]);
  const dueToday = req.query.dueToday === "true";
  const includeCompleted = req.query.includeCompleted === "true";
  let rows = await db.select().from(followUps).orderBy(followUps.dueAt);
  let list = rows.map(toFollowUp);
  if (dueToday) list = list.filter((r) => isDueToday(r.dueAt));
  if (!includeCompleted) list = list.filter((r) => !r.completedAt);
  res.json(list);
});

router.post("/", async (req: Request, res: Response) => {
  if (!db) return res.status(503).json({ error: "No database" });
  const body = req.body as {
    title: string;
    dueAt: string;
    contextNote?: string;
    priority?: "P0" | "P1" | "P2" | "P3";
  };
  if (!body?.title || !body?.dueAt) return res.status(400).json({ error: "title and dueAt required" });
  const id = crypto.randomUUID();
  await db.insert(followUps).values({
    id,
    title: body.title,
    dueAt: new Date(body.dueAt),
    contextNote: body.contextNote ?? null,
    priority: body.priority ?? "P2",
  });
  const [row] = await db.select().from(followUps).where(eq(followUps.id, id));
  res.status(201).json(toFollowUp(row!));
});

router.post("/:id/complete", async (req: Request, res: Response) => {
  if (!db) return res.status(503).json({ error: "No database" });
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db
    .update(followUps)
    .set({ completedAt: new Date() })
    .where(eq(followUps.id, id!));
  res.json({});
});

router.post("/:id/snooze", async (req: Request, res: Response) => {
  if (!db) return res.status(503).json({ error: "No database" });
  const until = req.body?.until as string;
  if (!until) return res.status(400).json({ error: "until required" });
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db
    .update(followUps)
    .set({ snoozedUntil: new Date(until) })
    .where(eq(followUps.id, id!));
  res.json({});
});

export default router;
