import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../supabaseClient.js";
import { getSessionFromRequest } from "../auth.js";
import {
  getGoogleToken,
  deleteGoogleToken,
} from "../lib/google-tokens-supabase.js";
import { fetchGoogleCalendarRange } from "../lib/google-calendar.js";

const router = Router();

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfToday() {
  return startOfDay(new Date());
}
function endOfToday() {
  return endOfDay(new Date());
}
function getWeekStartEnd(): { start: Date; end: Date } {
  const start = startOfToday();
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}
function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type MeetingRow = {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  location: string | null;
  link: string | null;
  prep_notes: string | null;
  take_preparation: string | null;
  meeting_notes: string | null;
  action_items: string | null;
  source: "manual" | "google";
  status: "active" | "cancelled" | "completed" | "dormant";
  google_event_id: string | null;
  calendar_account_email: string | null;
  updated_at: string | null;
};

function rowToDisplay(r: MeetingRow) {
  const now = new Date();
  let status: "active" | "cancelled" | "completed" | "dormant" = r.status;
  const endAtDate = new Date(r.end_at);
  if (status === "active" && endAtDate.getTime() < now.getTime()) {
    status = "completed";
  }

  return {
    id: r.id,
    title: r.title,
    startAt: new Date(r.start_at),
    endAt: endAtDate,
    location: r.location,
    link: r.link,
    prepNotes: r.prep_notes,
    takePreparation: r.take_preparation ?? null,
    meetingNotes: r.meeting_notes ?? null,
    actionItems: r.action_items ?? null,
    source: r.source,
    status,
  };
}

router.get("/google-status", async (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  const userEmail = session?.email ?? null;
  if (!userEmail) {
    return res.json({ googleConnected: false, connectedEmail: null });
  }
  try {
    const stored = await getGoogleToken(userEmail);
    const connected = !!stored?.accessToken;
    return res.json({
      googleConnected: connected,
      connectedEmail: connected ? userEmail : null,
    });
  } catch {
    return res.json({ googleConnected: false, connectedEmail: null });
  }
});

router.get("/today", async (_req: Request, res: Response) => {
  if (!supabaseAdmin) return res.json([]);
  const start = startOfToday();
  const end = endOfToday();
  const { data, error } = await supabaseAdmin
    .from("meetings")
    .select("*")
    .gte("start_at", start.toISOString())
    .lte("start_at", end.toISOString())
    .eq("status", "active");
  if (error) return res.status(500).json({ error: error.message });
  res.json((data as MeetingRow[]).map(rowToDisplay));
});

router.get("/today-with-google", async (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  const userEmail = session?.email ?? null;
  const includeCancelled = req.query.includeCancelled === "true";
  const includeDormant = req.query.includeDormant === "true";
  if (!supabaseAdmin) {
    return res.json({
      meetings: [],
      googleConnected: false,
      connectedEmail: null,
    });
  }
  const start = startOfToday();
  const end = endOfToday();
  const statuses: ("active" | "cancelled" | "dormant")[] = ["active"];
  if (includeCancelled) statuses.push("cancelled");
  if (includeDormant) statuses.push("dormant");
  const { data, error } = await supabaseAdmin
    .from("meetings")
    .select("*")
    .gte("start_at", start.toISOString())
    .lte("start_at", end.toISOString());
  if (error) return res.status(500).json({ error: error.message });

  let accessToken: string | null = null;
  if (userEmail) {
    try {
      const stored = await getGoogleToken(userEmail);
      accessToken = stored?.accessToken ?? null;
    } catch {
      accessToken = null;
    }
  }

  const visible = (data as MeetingRow[]).filter((m) => {
    if (m.source === "manual") return true;
    if (!userEmail) return false;
    return (
      m.source === "google" &&
      m.calendar_account_email === userEmail &&
      statuses.includes(m.status)
    );
  });

  const list = visible
    .map(rowToDisplay)
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  res.json({
    meetings: list,
    googleConnected: !!accessToken,
    connectedEmail: accessToken ? userEmail : null,
  });
});

router.get("/week-with-google", async (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  const userEmail = session?.email ?? null;
  const includeCancelled = req.query.includeCancelled === "true";
  const includeDormant = req.query.includeDormant === "true";
  if (!supabaseAdmin) {
    return res.json({
      meetingsByDay: [],
      googleConnected: false,
      connectedEmail: null,
    });
  }
  const { start: weekStart, end: weekEnd } = getWeekStartEnd();
  const statuses: ("active" | "cancelled" | "dormant")[] = ["active"];
  if (includeCancelled) statuses.push("cancelled");
  if (includeDormant) statuses.push("dormant");
  const { data, error } = await supabaseAdmin
    .from("meetings")
    .select("*")
    .gte("start_at", weekStart.toISOString())
    .lte("start_at", weekEnd.toISOString());
  if (error) return res.status(500).json({ error: error.message });

  let accessToken: string | null = null;
  if (userEmail) {
    try {
      const stored = await getGoogleToken(userEmail);
      accessToken = stored?.accessToken ?? null;
    } catch {
      accessToken = null;
    }
  }

  const filtered = (data as MeetingRow[]).filter((m) => {
    if (m.source === "manual") return true;
    if (!userEmail) return false;
    return (
      m.source === "google" &&
      m.calendar_account_email === userEmail &&
      statuses.includes(m.status)
    );
  });

  const byDay = new Map<string, ReturnType<typeof rowToDisplay>[]>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    byDay.set(toLocalDateKey(d), []);
  }
  for (const r of filtered) {
    const dayKey = toLocalDateKey(new Date(r.start_at));
    const arr = byDay.get(dayKey);
    if (arr) arr.push(rowToDisplay(r));
  }
  const meetingsByDay = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, meetingsList]) => {
      meetingsList.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
      return { date, meetings: meetingsList };
    });

  res.json({
    meetingsByDay,
    googleConnected: !!accessToken,
    connectedEmail: accessToken ? userEmail : null,
  });
});

router.post("/sync-google", async (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  const userEmail = session?.email ?? null;
  if (!userEmail || !supabaseAdmin) return res.json({ synced: false });

  const stored = await getGoogleToken(userEmail);
  const accessToken = stored?.accessToken ?? null;
  if (!accessToken) return res.json({ synced: false });

  const { start: weekStart, end: weekEnd } = getWeekStartEnd();
  let googleEvents: { id: string; title: string; startAt: Date; endAt: Date; location?: string; link?: string }[];
  try {
    googleEvents = await fetchGoogleCalendarRange(accessToken, weekStart, weekEnd);
  } catch {
    return res.json({ synced: false });
  }

  const fetchedIds = new Set(googleEvents.map((e) => e.id));

  for (const e of googleEvents) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("meetings")
      .select("id")
      .eq("google_event_id", e.id)
      .eq("calendar_account_email", userEmail)
      .limit(1);

    if (existingError) return res.json({ synced: false });

    const row = (existing as { id: string }[])[0];

    if (row) {
      const { error } = await supabaseAdmin
        .from("meetings")
        .update({
          title: e.title,
          start_at: e.startAt.toISOString(),
          end_at: e.endAt.toISOString(),
          location: e.location ?? null,
          link: e.link ?? null,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (error) return res.json({ synced: false });
    } else {
      const { error } = await supabaseAdmin.from("meetings").insert({
        id: crypto.randomUUID(),
        title: e.title,
        start_at: e.startAt.toISOString(),
        end_at: e.endAt.toISOString(),
        location: e.location ?? null,
        link: e.link ?? null,
        source: "google",
        status: "active",
        google_event_id: e.id,
        calendar_account_email: userEmail,
      });
      if (error) return res.json({ synced: false });
    }
  }

  const { data: existingInRange, error: existingInRangeError } =
    await supabaseAdmin
      .from("meetings")
      .select("id, google_event_id")
      .eq("source", "google")
      .eq("calendar_account_email", userEmail)
      .gte("start_at", weekStart.toISOString())
      .lte("start_at", weekEnd.toISOString());

  if (existingInRangeError) return res.json({ synced: false });

  for (const row of existingInRange as {
    id: string;
    google_event_id: string | null;
  }[]) {
    if (row.google_event_id && !fetchedIds.has(row.google_event_id)) {
      const { error } = await supabaseAdmin
        .from("meetings")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", row.id);
      if (error) return res.json({ synced: false });
    }
  }

  res.json({ synced: true });
});

router.post("/", async (req: Request, res: Response) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "No database" });
  const body = req.body as {
    title: string;
    startAt: string;
    endAt: string;
    location?: string;
    link?: string;
    prepNotes?: string;
    takePreparation?: string;
    meetingNotes?: string;
    actionItems?: string;
  };
  if (!body?.title || !body?.startAt || !body?.endAt) {
    return res.status(400).json({ error: "title, startAt, endAt required" });
  }
  const id = crypto.randomUUID();
  const { error } = await supabaseAdmin.from("meetings").insert({
    id,
    title: body.title,
    start_at: new Date(body.startAt).toISOString(),
    end_at: new Date(body.endAt).toISOString(),
    location: body.location ?? null,
    link: body.link ?? null,
    prep_notes: body.prepNotes ?? null,
    take_preparation: body.takePreparation ?? null,
    meeting_notes: body.meetingNotes ?? null,
    action_items: body.actionItems ?? null,
    source: "manual",
    status: "active",
  });
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ id });
});

router.patch("/:id", async (req: Request, res: Response) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "No database" });
  const body = req.body as {
    prepNotes?: string;
    takePreparation?: string;
    meetingNotes?: string;
    actionItems?: string;
  };
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (body.prepNotes !== undefined) update.prep_notes = body.prepNotes;
  if (body.takePreparation !== undefined)
    update.take_preparation = body.takePreparation;
  if (body.meetingNotes !== undefined)
    update.meeting_notes = body.meetingNotes;
  if (body.actionItems !== undefined)
    update.action_items = body.actionItems;

  const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)!;
  const { error } = await supabaseAdmin
    .from("meetings")
    .update(update)
    .eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

router.post("/disconnect-google", async (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  const userEmail = session?.email ?? null;
  if (!userEmail) return res.json({ success: false });

  if (supabaseAdmin) {
    await supabaseAdmin
      .from("meetings")
      .update({ status: "dormant", updated_at: new Date().toISOString() })
      .eq("source", "google")
      .eq("calendar_account_email", userEmail);
  }
  await deleteGoogleToken(userEmail);
  res.json({ success: true });
});

async function callOpenAIChatLegacy(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`OpenAI error: ${err}`);
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned no content");
  }
  return content.trim();
}

router.post("/:id/ai/prep", async (req: Request, res: Response) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "AI not configured (OPENAI_API_KEY missing)" });
  }
  if (!supabaseAdmin) return res.status(503).json({ error: "No database" });

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ error: "id required" });

  const extraContext = (req.body?.extraContext as string | undefined) ?? "";

  const { data, error } = await supabaseAdmin
    .from("meetings")
    .select("title, start_at, end_at, location, prep_notes, meeting_notes, action_items")
    .eq("id", id)
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const row = data as {
    title: string;
    start_at: string;
    end_at: string;
    location: string | null;
    prep_notes: string | null;
    meeting_notes: string | null;
    action_items: string | null;
  };

  const systemPrompt =
    "You are a helpful assistant that prepares concise, practical preparation notes for upcoming meetings. Keep output short, structured, and immediately actionable.";

  const userPrompt = [
    `Meeting: ${row.title}`,
    `When: ${new Date(row.start_at).toISOString()} – ${new Date(row.end_at).toISOString()}`,
    row.location ? `Location: ${row.location}` : null,
    row.prep_notes ? `Existing preparation:\n${row.prep_notes}` : null,
    row.meeting_notes ? `Existing notes or transcript:\n${row.meeting_notes}` : null,
    row.action_items ? `Existing action items:\n${row.action_items}` : null,
    extraContext ? `Additional context from user:\n${extraContext}` : null,
    "",
    "Write improved preparation notes for this meeting. Use markdown bullet points.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const suggestion = await callOpenAIChatLegacy(systemPrompt, userPrompt);
    res.json({ suggestion });
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI error";
    res.status(500).json({ error: message });
  }
});

router.post("/:id/ai/action-items", async (req: Request, res: Response) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "AI not configured (OPENAI_API_KEY missing)" });
  }
  if (!supabaseAdmin) return res.status(503).json({ error: "No database" });

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ error: "id required" });

  const transcript = (req.body?.transcript as string | undefined) ?? "";
  const notes = (req.body?.notes as string | undefined) ?? "";

  const { data, error } = await supabaseAdmin
    .from("meetings")
    .select("title, meeting_notes, action_items")
    .eq("id", id)
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const row = data as {
    title: string;
    meeting_notes: string | null;
    action_items: string | null;
  };

  const systemPrompt =
    "You are an assistant that extracts clear, owner-agnostic action items from meeting transcripts and notes. Return a concise markdown bullet list of action items.";

  const userPrompt = [
    `Meeting: ${row.title}`,
    row.meeting_notes ? `Existing notes:\n${row.meeting_notes}` : null,
    row.action_items ? `Existing action items:\n${row.action_items}` : null,
    transcript ? `Transcript:\n${transcript}` : null,
    notes ? `Additional notes from user:\n${notes}` : null,
    "",
    "Extract and refine action items. Use bullet points, each starting with a verb.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const suggestion = await callOpenAIChatLegacy(systemPrompt, userPrompt);
    res.json({ suggestion });
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI error";
    res.status(500).json({ error: message });
  }
});

export default router;
