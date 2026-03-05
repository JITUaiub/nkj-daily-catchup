import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../supabaseClient.js";
const router = Router();

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  project_id: string | null;
  meeting_id: string | null;
  status: "todo" | "in_progress" | "in_review" | "done";
  priority: "P0" | "P1" | "P2" | "P3";
  estimated_minutes: number | null;
  due_date: string | null;
  sort_order: number | null;
  logged_minutes: number | null;
  created_at: string;
};

function toTask(r: TaskRow) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    projectId: r.project_id,
    meetingId: r.meeting_id,
    status: r.status,
    priority: r.priority,
    estimatedMinutes: r.estimated_minutes,
    dueDate: r.due_date,
    sortOrder: r.sort_order ?? 0,
    loggedMinutes: r.logged_minutes ?? 0,
    createdAt: r.created_at,
  };
}

router.get("/", async (req: Request, res: Response) => {
  if (!supabaseAdmin) return res.json([]);
  const projectId = req.query.projectId as string | undefined;
  const status = req.query.status as string | undefined;
  const dueToday = req.query.dueToday === "true";

  let query = supabaseAdmin.from("tasks").select("*");

  if (projectId) {
    query = query.eq("project_id", projectId);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (dueToday) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query = query
      .gte("due_date", start.toISOString())
      .lt("due_date", end.toISOString());
  }

  const { data, error } = await query
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json((data as TaskRow[]).map(toTask));
});

router.post("/", async (req: Request, res: Response) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "No database" });
  const body = req.body as {
    title: string;
    description?: string;
    projectId?: string;
    meetingId?: string;
    priority?: "P0" | "P1" | "P2" | "P3";
    estimatedMinutes?: number;
    dueDate?: string;
  };
  if (!body?.title) return res.status(400).json({ error: "title required" });
  const id = crypto.randomUUID();
  const dueDate = body.dueDate ? new Date(body.dueDate) : null;
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .insert([
      {
        id,
        title: body.title,
        description: body.description ?? null,
        project_id: body.projectId ?? null,
        meeting_id: body.meetingId ?? null,
        status: "todo",
        priority: body.priority ?? "P2",
        estimated_minutes: body.estimatedMinutes ?? null,
        due_date: dueDate ? dueDate.toISOString() : null,
        logged_minutes: 0,
      },
    ])
    .select("*")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(toTask(data as TaskRow));
});

router.patch("/:id", async (req: Request, res: Response) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "No database" });
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ error: "id required" });

  const body = req.body as Partial<{
    title: string;
    description: string | null;
    projectId: string | null;
    status: "todo" | "in_progress" | "in_review" | "done";
    priority: "P0" | "P1" | "P2" | "P3";
    estimatedMinutes: number | null;
    dueDate: string | null;
    loggedMinutes: number | null;
  }>;

  const update: Record<string, unknown> = {};
  if (body.title !== undefined) update.title = body.title;
  if (body.description !== undefined) update.description = body.description;
  if (body.projectId !== undefined) update.project_id = body.projectId;
  if (body.status !== undefined) update.status = body.status;
  if (body.priority !== undefined) update.priority = body.priority;
  if (body.estimatedMinutes !== undefined)
    update.estimated_minutes = body.estimatedMinutes;
  if (body.dueDate !== undefined) {
    update.due_date = body.dueDate ? new Date(body.dueDate).toISOString() : null;
  }
  if (body.loggedMinutes !== undefined) update.logged_minutes = body.loggedMinutes;

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  const { data, error } = await supabaseAdmin
    .from("tasks")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ? toTask(data as TaskRow) : {});
});

router.patch("/:id/status", async (req: Request, res: Response) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "No database" });
  const status = req.body?.status as "todo" | "in_progress" | "in_review" | "done";
  if (!status) return res.status(400).json({ error: "status required" });
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { error } = await supabaseAdmin
    .from("tasks")
    .update({ status })
    .eq("id", id!);
  if (error) return res.status(500).json({ error: error.message });
  res.json({});
});

router.post("/reorder", async (req: Request, res: Response) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "No database" });
  const taskIds = req.body?.taskIds as string[];
  if (!Array.isArray(taskIds)) return res.status(400).json({ error: "taskIds required" });
  for (let i = 0; i < taskIds.length; i++) {
    const { error } = await supabaseAdmin
      .from("tasks")
      .update({ sort_order: i })
      .eq("id", taskIds[i]!);
    if (error) return res.status(500).json({ error: error.message });
  }
  res.json({});
});

router.delete("/:id", async (req: Request, res: Response) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "No database" });
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ error: "id required" });
  const { error } = await supabaseAdmin.from("tasks").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

router.post("/:id/log-time", async (req: Request, res: Response) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "No database" });
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ error: "id required" });

  const body = req.body as { minutes?: number };
  const minutes = Number(body?.minutes ?? 0);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return res.status(400).json({ error: "minutes must be a positive number" });
  }

  const { data: current, error: fetchError } = await supabaseAdmin
    .from("tasks")
    .select("logged_minutes")
    .eq("id", id)
    .single();

  if (fetchError) return res.status(500).json({ error: fetchError.message });

  const currentMinutes = (current as { logged_minutes: number | null }).logged_minutes ?? 0;
  const newTotal = currentMinutes + minutes;

  const { error: updateError } = await supabaseAdmin
    .from("tasks")
    .update({ logged_minutes: newTotal })
    .eq("id", id);

  if (updateError) return res.status(500).json({ error: updateError.message });

  res.status(200).json({ id, loggedMinutes: newTotal });
});

export default router;
