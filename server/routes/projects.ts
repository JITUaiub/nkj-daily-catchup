import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { projects } from "../db/schema.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  if (!db) return res.json([]);
  const rows = await db.select().from(projects).orderBy(projects.name);
  res.json(rows.map((r) => ({ id: r.id, name: r.name, color: r.color })));
});

router.post("/", async (req: Request, res: Response) => {
  if (!db) return res.status(503).json({ error: "No database" });
  const body = req.body as { name: string; color?: string };
  if (!body?.name) return res.status(400).json({ error: "name required" });
  const id = crypto.randomUUID();
  await db.insert(projects).values({
    id,
    name: body.name,
    color: body.color ?? "#007AFF",
  });
  res.status(201).json({ id, name: body.name, color: body.color ?? "#007AFF" });
});

export default router;
