import { Router, Request, Response } from "express";
import { eq, and, asc, desc, gte, lt } from "drizzle-orm";
import { db } from "../db/index.js";
import { tasks } from "../db/schema.js";
const router = Router();

function toTask(r: typeof tasks.$inferSelect) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    projectId: r.projectId,
    status: r.status,
    priority: r.priority,
    estimatedMinutes: r.estimatedMinutes,
    dueDate: r.dueDate,
    sortOrder: r.sortOrder ?? 0,
    createdAt: r.createdAt,
  };
}

router.get("/", async (req: Request, res: Response) => {
  if (!db) return res.json([]);
  const projectId = req.query.projectId as string | undefined;
  const status = req.query.status as string | undefined;
  const dueToday = req.query.dueToday === "true";
  const conditions = [];
  if (projectId) conditions.push(eq(tasks.projectId, projectId));
  if (status) conditions.push(eq(tasks.status, status as "todo" | "in_progress" | "in_review" | "done"));
  if (dueToday) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    conditions.push(gte(tasks.dueDate, start));
    conditions.push(lt(tasks.dueDate, end));
  }
  const rows = await db
    .select()
    .from(tasks)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(tasks.sortOrder), desc(tasks.createdAt));
  res.json(rows.map(toTask));
});

router.post("/", async (req: Request, res: Response) => {
  if (!db) return res.status(503).json({ error: "No database" });
  const body = req.body as {
    title: string;
    description?: string;
    projectId?: string;
    priority?: "P0" | "P1" | "P2" | "P3";
    estimatedMinutes?: number;
    dueDate?: string;
  };
  if (!body?.title) return res.status(400).json({ error: "title required" });
  const id = crypto.randomUUID();
  const dueDate = body.dueDate ? new Date(body.dueDate) : null;
  await db.insert(tasks).values({
    id,
    title: body.title,
    description: body.description ?? null,
    projectId: body.projectId ?? null,
    status: "todo",
    priority: body.priority ?? "P2",
    estimatedMinutes: body.estimatedMinutes ?? null,
    dueDate,
  });
  const [row] = await db.select().from(tasks).where(eq(tasks.id, id));
  res.status(201).json(toTask(row!));
});

router.patch("/:id/status", async (req: Request, res: Response) => {
  if (!db) return res.status(503).json({ error: "No database" });
  const status = req.body?.status as "todo" | "in_progress" | "in_review" | "done";
  if (!status) return res.status(400).json({ error: "status required" });
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.update(tasks).set({ status }).where(eq(tasks.id, id!));
  res.json({});
});

router.post("/reorder", async (req: Request, res: Response) => {
  if (!db) return res.status(503).json({ error: "No database" });
  const taskIds = req.body?.taskIds as string[];
  if (!Array.isArray(taskIds)) return res.status(400).json({ error: "taskIds required" });
  for (let i = 0; i < taskIds.length; i++) {
    await db.update(tasks).set({ sortOrder: i }).where(eq(tasks.id, taskIds[i]!));
  }
  res.json({});
});

export default router;
