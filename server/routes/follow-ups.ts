import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../supabaseClient.js";

const router = Router();

type FollowUpRow = {
  id: string;
  title: string;
  context_note: string | null;
  meeting_id: string | null;
  due_at: string;
  completed_at: string | null;
  priority: "P0" | "P1" | "P2" | "P3";
  snoozed_until: string | null;
  created_at: string;
};

function isDueToday(d: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  return d >= today && d <= end;
}

function toFollowUp(r: FollowUpRow) {
  return {
    id: r.id,
    title: r.title,
    contextNote: r.context_note,
    meetingId: r.meeting_id,
    dueAt: r.due_at,
    completedAt: r.completed_at,
    priority: r.priority,
    snoozedUntil: r.snoozed_until,
    createdAt: r.created_at,
  };
}

router.get("/", async (req: Request, res: Response) => {
  if (!supabaseAdmin) return res.json([]);
  const dueToday = req.query.dueToday === "true";
  const includeCompleted = req.query.includeCompleted === "true";
  const { data, error } = await supabaseAdmin
    .from("follow_ups")
    .select("*")
    .order("due_at", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });

  let list = (data as FollowUpRow[]).map(toFollowUp);
  if (dueToday) list = list.filter((r) => isDueToday(new Date(r.dueAt)));
  if (!includeCompleted) list = list.filter((r) => !r.completedAt);
  res.json(list);
});

router.post("/", async (req: Request, res: Response) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "No database" });
  const body = req.body as {
    title: string;
    dueAt: string;
    contextNote?: string;
    meetingId?: string;
    priority?: "P0" | "P1" | "P2" | "P3";
  };
  if (!body?.title || !body?.dueAt) return res.status(400).json({ error: "title and dueAt required" });
  const id = crypto.randomUUID();
  const { data, error } = await supabaseAdmin
    .from("follow_ups")
    .insert({
      id,
      title: body.title,
      due_at: new Date(body.dueAt).toISOString(),
      context_note: body.contextNote ?? null,
      meeting_id: body.meetingId ?? null,
      priority: body.priority ?? "P2",
    })
    .select("*")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(toFollowUp(data as FollowUpRow));
});

router.post("/:id/complete", async (req: Request, res: Response) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "No database" });
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { error } = await supabaseAdmin
    .from("follow_ups")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", id!);
  if (error) return res.status(500).json({ error: error.message });
  res.json({});
});

router.post("/:id/snooze", async (req: Request, res: Response) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "No database" });
  const until = req.body?.until as string;
  if (!until) return res.status(400).json({ error: "until required" });
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { error } = await supabaseAdmin
    .from("follow_ups")
    .update({ snoozed_until: new Date(until).toISOString() })
    .eq("id", id!);
  if (error) return res.status(500).json({ error: error.message });
  res.json({});
});

export default router;
