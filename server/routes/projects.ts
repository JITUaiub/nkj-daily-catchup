import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../supabaseClient.js";
import { callOpenAIChat } from "../lib/openai.js";

const router = Router();

type ProjectResourceRow = {
  id: string;
  project_id: string;
  name: string;
  designation: string | null;
  allocation_hours: number;
};

type ProjectRow = {
  id: string;
  name: string;
  color: string;
  description: string | null;
  project_resources?: ProjectResourceRow[];
};

router.get("/", async (_req: Request, res: Response) => {
  if (!supabaseAdmin) return res.json([]);
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id, name, color, description, project_resources (id, project_id, name, designation, allocation_hours)")
    .order("name", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const rows = (data as ProjectRow[]) ?? [];

  res.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      description: r.description,
      resources:
        r.project_resources?.map((pr) => ({
          id: pr.id,
          name: pr.name,
          designation: pr.designation,
          allocationHours: pr.allocation_hours,
        })) ?? [],
    }))
  );
});

router.post("/", async (req: Request, res: Response) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "No database" });
  const body = req.body as {
    name: string;
    color?: string;
    description?: string;
    resources?: { name: string; designation?: string; allocationHours: number }[];
  };

  if (!body?.name) return res.status(400).json({ error: "name required" });

  const id = crypto.randomUUID();
  const projectInsert = await supabaseAdmin.from("projects").insert({
    id,
    name: body.name,
    color: body.color ?? "#007AFF",
    description: body.description ?? null,
  });

  if (projectInsert.error) {
    return res.status(500).json({ error: projectInsert.error.message });
  }

  if (Array.isArray(body.resources) && body.resources.length > 0) {
    const resourcesToInsert = body.resources
      .filter((r) => r.name && r.allocationHours > 0)
      .map((r) => ({
        id: crypto.randomUUID(),
        project_id: id,
        name: r.name,
        designation: r.designation ?? null,
        allocation_hours: r.allocationHours,
      }));

    if (resourcesToInsert.length > 0) {
      const { error } = await supabaseAdmin.from("project_resources").insert(resourcesToInsert);
      if (error) return res.status(500).json({ error: error.message });
    }
  }

  res.status(201).json({
    id,
    name: body.name,
    color: body.color ?? "#007AFF",
    description: body.description ?? null,
    resources: body.resources ?? [],
  });
});

function toProjectResponse(r: ProjectRow) {
  return {
    id: r.id,
    name: r.name,
    color: r.color,
    description: r.description,
    resources:
      r.project_resources?.map((pr) => ({
        id: pr.id,
        name: pr.name,
        designation: pr.designation,
        allocationHours: pr.allocation_hours,
      })) ?? [],
  };
}

router.get("/:id", async (req: Request, res: Response) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "No database" });
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ error: "id required" });

  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id, name, color, description, project_resources (id, project_id, name, designation, allocation_hours)")
    .eq("id", id)
    .single();

  if (error || !data) return res.status(404).json({ error: "Project not found" });
  res.json(toProjectResponse(data as ProjectRow));
});

router.patch("/:id", async (req: Request, res: Response) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "No database" });
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ error: "id required" });

  const body = req.body as {
    name?: string;
    color?: string;
    description?: string;
    resources?: { id?: string; name: string; designation?: string; allocationHours: number }[];
  };

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (body.name !== undefined) update.name = body.name;
  if (body.color !== undefined) update.color = body.color;
  if (body.description !== undefined) update.description = body.description ?? null;

  if (Object.keys(update).length > 1) {
    const { error } = await supabaseAdmin
      .from("projects")
      .update(update)
      .eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
  }

  if (Array.isArray(body.resources)) {
    const { data: existing } = await supabaseAdmin
      .from("project_resources")
      .select("id")
      .eq("project_id", id);
    const existingIds = new Set((existing as { id: string }[] ?? []).map((r) => r.id));

    const toInsert = body.resources
      .filter((r) => !r.id && r.name && r.allocationHours > 0)
      .map((r) => ({
        id: crypto.randomUUID(),
        project_id: id,
        name: r.name,
        designation: r.designation ?? null,
        allocation_hours: r.allocationHours,
      }));

    const toUpdate = body.resources.filter(
      (r) => r.id && existingIds.has(r.id) && r.name && r.allocationHours > 0
    );
    const toDelete = existingIds;
    for (const r of toUpdate) {
      toDelete.delete(r.id!);
    }

    for (const r of toInsert) {
      const { error } = await supabaseAdmin.from("project_resources").insert(r);
      if (error) return res.status(500).json({ error: error.message });
    }
    for (const r of toUpdate) {
      const { error } = await supabaseAdmin
        .from("project_resources")
        .update({
          name: r.name,
          designation: r.designation ?? null,
          allocation_hours: r.allocationHours,
        })
        .eq("id", r.id);
      if (error) return res.status(500).json({ error: error.message });
    }
    for (const rid of toDelete) {
      await supabaseAdmin.from("project_resources").delete().eq("id", rid);
    }
  }

  const { data } = await supabaseAdmin
    .from("projects")
    .select("id, name, color, description, project_resources (id, project_id, name, designation, allocation_hours)")
    .eq("id", id)
    .single();
  res.json(data ? toProjectResponse(data as ProjectRow) : {});
});

router.delete("/:id", async (req: Request, res: Response) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "No database" });
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ error: "id required" });

  const { error } = await supabaseAdmin.from("projects").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

router.post("/:id/ai/summary", async (req: Request, res: Response) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "AI not configured (OPENAI_API_KEY missing)" });
  }
  if (!supabaseAdmin) return res.status(503).json({ error: "No database" });

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ error: "id required" });

  const { data: project, error: projError } = await supabaseAdmin
    .from("projects")
    .select("id, name, color, description, project_resources (id, name, designation, allocation_hours)")
    .eq("id", id)
    .single();

  if (projError || !project) return res.status(404).json({ error: "Project not found" });

  const { data: tasks } = await supabaseAdmin
    .from("tasks")
    .select("id, title, status, priority, logged_minutes, due_date, created_at, meeting_id")
    .eq("project_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const proj = project as ProjectRow & { project_resources?: { name: string; designation: string | null; allocation_hours: number }[] };
  const taskList = (tasks as { title: string; status: string; priority: string; logged_minutes: number | null; due_date: string | null; meeting_id: string | null }[]) ?? [];
  const totalLogged = taskList.reduce((s, t) => s + (t.logged_minutes ?? 0), 0);
  const byStatus = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
  for (const t of taskList) {
    if (t.status in byStatus) (byStatus as Record<string, number>)[t.status]++;
  }

  const systemPrompt =
    "You are a helpful assistant that summarizes project progress. Write a concise, actionable summary (2-4 paragraphs) covering: current status, key metrics (tasks by status, time logged), notable items, and suggested next steps. Use markdown. Be specific and data-driven.";

  const userPrompt = [
    `## Project: ${proj.name}`,
    proj.description ? `Description: ${proj.description}` : null,
    proj.project_resources?.length
      ? `Team (${proj.project_resources.length}): ${proj.project_resources.map((r) => `${r.name}${r.designation ? ` (${r.designation})` : ""} - ${r.allocation_hours}h`).join("; ")}`
      : null,
    "",
    "## Tasks",
    `Total: ${taskList.length}. By status: ${byStatus.todo} todo, ${byStatus.in_progress} in progress, ${byStatus.in_review} in review, ${byStatus.done} done.`,
    `Total time logged: ${Math.floor(totalLogged / 60)}h ${totalLogged % 60}m`,
    taskList.length > 0
      ? "Tasks:\n" +
        taskList
          .slice(0, 15)
          .map((t) => `- [${t.status}] ${t.title} (${t.priority}, ${t.logged_minutes ?? 0}m logged${t.meeting_id ? ", from meeting" : ""})`)
          .join("\n")
      : "No tasks yet.",
    "",
    "Generate a progress summary for this project.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const summary = await callOpenAIChat(systemPrompt, userPrompt);
    res.json({ summary });
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI error";
    res.status(500).json({ error: message });
  }
});

export default router;
