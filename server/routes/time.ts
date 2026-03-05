import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../supabaseClient.js";

const router = Router();

type TimeEntryRow = {
  id: string;
  user_id: string | null;
  task_id: string | null;
  started_at: string;
  ended_at: string | null;
  category: string;
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

router.get("/active", async (_req: Request, res: Response) => {
  if (!supabaseAdmin) return res.json(null);
  const { data, error } = await supabaseAdmin
    .from("time_entries")
    .select("*")
    .is("ended_at", null)
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });
  const row = (data as TimeEntryRow[])[0];
  if (!row) return res.json(null);
  res.json({
    id: row.id,
    startedAt: row.started_at,
    taskId: row.task_id,
    category: row.category,
  });
});

router.post("/start", async (req: Request, res: Response) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "No database" });
  const body = req.body as { taskId?: string; category?: string };
  const id = crypto.randomUUID();
  const startedAt = new Date();
  const { error } = await supabaseAdmin.from("time_entries").insert({
    id,
    started_at: startedAt.toISOString(),
    task_id: body?.taskId ?? null,
    category: body?.category ?? "coding",
  });
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ id, startedAt });
});

router.post("/stop", async (_req: Request, res: Response) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "No database" });
  const now = new Date();
  const { data, error } = await supabaseAdmin
    .from("time_entries")
    .select("*")
    .is("ended_at", null)
    .limit(1);
  if (error) return res.status(500).json({ error: error.message });

  const row = (data as TimeEntryRow[])[0];
  if (row) {
    const updateError = (
      await supabaseAdmin
        .from("time_entries")
        .update({ ended_at: now.toISOString() })
        .eq("id", row.id)
    ).error;
    if (updateError) return res.status(500).json({ error: updateError.message });
  }
  res.json({});
});

router.get("/today", async (_req: Request, res: Response) => {
  if (!supabaseAdmin) return res.json({ byProject: [], byCategory: [], total: 0 });
  const start = startOfToday();
  const { data, error } = await supabaseAdmin
    .from("time_entries")
    .select("*")
    .gte("started_at", start.toISOString());
  if (error) return res.status(500).json({ error: error.message });

  const byCategory: Record<string, number> = {};
  const now = new Date();
  for (const r of data as TimeEntryRow[]) {
    const end = r.ended_at ? new Date(r.ended_at) : now;
    const min = Math.round((end.getTime() - new Date(r.started_at).getTime()) / 60000);
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
