import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../supabaseClient.js";
import { getSessionFromRequest } from "../auth.js";

const router = Router();

type TaskRow = {
  id: string;
  title: string;
  project_id: string | null;
  meeting_id: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  logged_minutes: number | null;
  created_at: string;
};

type FollowUpRow = {
  id: string;
  title: string;
  meeting_id: string | null;
  due_at: string;
  completed_at: string | null;
  priority: string;
  created_at: string;
};

type MeetingRow = {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
};

/** Parse action items text into array of non-empty lines */
function parseActionItemsText(text: string): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/\n|•|[-*]/)
    .map((s) => s.trim().replace(/^[-*•]\s*/, ""))
    .filter((s) => s.length > 0);
}

/** Unified action item shape for frontend */
export type ActionItemDto = {
  id: string;
  type: "task" | "follow_up";
  title: string;
  status: string;
  priority: string;
  dueAt: string | null;
  projectId: string | null;
  meetingId: string | null;
  meeting?: { id: string; title: string; startAt: string; endAt: string };
  createdAt: string;
  completedAt?: string | null;
  loggedMinutes?: number;
};

router.get("/", async (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  if (!session?.email || !supabaseAdmin) {
    return res.json({ tasks: [], followUps: [], meetingsById: {} });
  }

  const filter = (req.query.filter as string) || "all";
  const projectId = req.query.projectId as string | undefined;
  const dueToday = req.query.dueToday === "true";

  // Fetch tasks
  let tasksQuery = supabaseAdmin.from("tasks").select("id, title, project_id, meeting_id, status, priority, due_date, logged_minutes, created_at");
  if (projectId) tasksQuery = tasksQuery.eq("project_id", projectId);
  if (dueToday) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    tasksQuery = tasksQuery
      .gte("due_date", start.toISOString())
      .lt("due_date", end.toISOString());
  }
  const { data: tasksData, error: tasksError } = await tasksQuery
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (tasksError) return res.status(500).json({ error: tasksError.message });

  // Fetch follow-ups
  let followUpsQuery = supabaseAdmin.from("follow_ups").select("id, title, meeting_id, due_at, completed_at, priority, created_at");
  if (projectId) {
    // Follow-ups don't have project_id; we can't filter by project
  }
  if (dueToday) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    followUpsQuery = followUpsQuery
      .gte("due_at", start.toISOString())
      .lte("due_at", end.toISOString());
  }
  const { data: followUpsData, error: followUpsError } = await followUpsQuery
    .order("due_at", { ascending: true });

  if (followUpsError) return res.status(500).json({ error: followUpsError.message });

  const tasks = (tasksData as TaskRow[]) || [];
  const followUps = (followUpsData as FollowUpRow[]) || [];

  // Filter by source
  let filteredTasks = tasks;
  let filteredFollowUps = followUps;
  if (filter === "from_meetings") {
    filteredTasks = tasks.filter((t) => t.meeting_id);
    filteredFollowUps = followUps.filter((f) => f.meeting_id);
  }
  if (filter === "done") {
    filteredTasks = tasks.filter((t) => t.status === "done");
    filteredFollowUps = followUps.filter((f) => f.completed_at);
  }
  if (filter === "active") {
    filteredTasks = tasks.filter((t) => t.status !== "done");
    filteredFollowUps = followUps.filter((f) => !f.completed_at);
  }

  // Fetch meeting details for items that have meeting_id
  const meetingIds = new Set<string>();
  filteredTasks.forEach((t) => t.meeting_id && meetingIds.add(t.meeting_id));
  filteredFollowUps.forEach((f) => f.meeting_id && meetingIds.add(f.meeting_id));

  let meetingsById: Record<string, MeetingRow> = {};
  if (meetingIds.size > 0) {
    const { data: meetingsData } = await supabaseAdmin
      .from("meetings")
      .select("id, title, start_at, end_at")
      .in("id", Array.from(meetingIds));
    if (meetingsData) {
      for (const m of meetingsData as MeetingRow[]) {
        meetingsById[m.id] = m;
      }
    }
  }

  const tasksDto: ActionItemDto[] = filteredTasks.map((t) => ({
    id: t.id,
    type: "task",
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueAt: t.due_date,
    projectId: t.project_id,
    meetingId: t.meeting_id,
    meeting: t.meeting_id && meetingsById[t.meeting_id]
      ? {
          id: meetingsById[t.meeting_id].id,
          title: meetingsById[t.meeting_id].title,
          startAt: meetingsById[t.meeting_id].start_at,
          endAt: meetingsById[t.meeting_id].end_at,
        }
      : undefined,
    createdAt: t.created_at,
    loggedMinutes: t.logged_minutes ?? 0,
  }));

  const followUpsDto: ActionItemDto[] = filteredFollowUps.map((f) => ({
    id: f.id,
    type: "follow_up",
    title: f.title,
    status: f.completed_at ? "done" : "todo",
    priority: f.priority,
    dueAt: f.due_at,
    projectId: null,
    meetingId: f.meeting_id,
    meeting: f.meeting_id && meetingsById[f.meeting_id]
      ? {
          id: meetingsById[f.meeting_id].id,
          title: meetingsById[f.meeting_id].title,
          startAt: meetingsById[f.meeting_id].start_at,
          endAt: meetingsById[f.meeting_id].end_at,
        }
      : undefined,
    createdAt: f.created_at,
    completedAt: f.completed_at,
  }));

  res.json({
    tasks: tasksDto,
    followUps: followUpsDto,
    meetingsById,
  });
});

/** Promote meeting action_items text to tasks/follow-ups */
router.post("/promote-from-meeting/:meetingId", async (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  if (!session?.email || !supabaseAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const meetingId = Array.isArray(req.params.meetingId) ? req.params.meetingId[0] : req.params.meetingId;
  if (!meetingId) return res.status(400).json({ error: "meetingId required" });

  const body = req.body as { actionItemsText?: string; asTasks?: boolean };
  const actionItemsText = body?.actionItemsText ?? "";
  const asTasks = body?.asTasks ?? false;

  const lines = parseActionItemsText(actionItemsText);
  if (lines.length === 0) {
    return res.json({ created: 0, ids: [] });
  }

  const meeting = await supabaseAdmin
    .from("meetings")
    .select("id, title, start_at")
    .eq("id", meetingId)
    .single();

  if (meeting.error || !meeting.data) {
    return res.status(404).json({ error: "Meeting not found" });
  }

  const meetingRow = meeting.data as { id: string; title: string; start_at: string };
  const defaultDue = new Date(meetingRow.start_at);
  defaultDue.setDate(defaultDue.getDate() + 1);
  defaultDue.setHours(17, 0, 0, 0);

  const ids: string[] = [];

  if (asTasks) {
    for (const title of lines) {
      const id = crypto.randomUUID();
      const { error } = await supabaseAdmin.from("tasks").insert({
        id,
        title,
        status: "todo",
        priority: "P2",
        meeting_id: meetingId,
      });
      if (!error) ids.push(id);
    }
  } else {
    for (const title of lines) {
      const id = crypto.randomUUID();
      const { error } = await supabaseAdmin.from("follow_ups").insert({
        id,
        title,
        due_at: defaultDue.toISOString(),
        priority: "P2",
        meeting_id: meetingId,
      });
      if (!error) ids.push(id);
    }
  }

  res.json({ created: ids.length, ids });
});

/** Create action items from notes todayPlan text */
router.post("/promote-from-notes", async (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  if (!session?.email || !supabaseAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const body = req.body as { todayPlanText?: string; date?: string };
  const todayPlanText = body?.todayPlanText ?? "";
  const dateStr = body?.date;

  const lines = parseActionItemsText(todayPlanText);
  if (lines.length === 0) {
    return res.json({ created: 0, ids: [] });
  }

  const baseDate = dateStr ? new Date(dateStr) : new Date();
  baseDate.setHours(17, 0, 0, 0);

  const ids: string[] = [];
  for (const title of lines) {
    const id = crypto.randomUUID();
    const dueAt = new Date(baseDate);
    const { error } = await supabaseAdmin.from("follow_ups").insert({
      id,
      title,
      due_at: dueAt.toISOString(),
      priority: "P2",
    });
    if (!error) ids.push(id);
  }

  res.json({ created: ids.length, ids });
});

export default router;
