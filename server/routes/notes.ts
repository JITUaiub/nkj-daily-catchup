import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../supabaseClient.js";

const router = Router();

type DailyNoteRow = {
  id: string;
  date: string;
  yesterday_summary: string | null;
  today_plan: string | null;
  scratch_pad: string | null;
  end_of_day_reflection: string | null;
};

router.get("/", async (req: Request, res: Response) => {
  if (!supabaseAdmin) return res.json(null);
  const dateParam = req.query.date as string;
  if (!dateParam) return res.status(400).json({ error: "date required" });
  const date = new Date(dateParam);
  date.setHours(0, 0, 0, 0);
  const start = date.toISOString();

  const { data, error } = await supabaseAdmin
    .from("daily_notes")
    .select("*")
    .eq("date", start)
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });
  const row = (data as DailyNoteRow[])[0];
  if (!row) return res.json(null);
  res.json({
    id: row.id,
    date: row.date,
    yesterdaySummary: row.yesterday_summary,
    todayPlan: row.today_plan,
    scratchPad: row.scratch_pad,
    endOfDayReflection: row.end_of_day_reflection,
  });
});

router.put("/", async (req: Request, res: Response) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "No database" });
  const body = req.body as {
    date: string;
    yesterdaySummary?: string;
    todayPlan?: string;
    scratchPad?: string;
    endOfDayReflection?: string;
  };
  if (!body?.date) return res.status(400).json({ error: "date required" });
  const date = new Date(body.date);
  date.setHours(0, 0, 0, 0);
  const start = date.toISOString();

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("daily_notes")
    .select("id")
    .eq("date", start)
    .limit(1);

  if (existingError) return res.status(500).json({ error: existingError.message });

  const id = (existing as { id: string }[])[0]?.id ?? crypto.randomUUID();
  const payload = {
    yesterday_summary: body.yesterdaySummary ?? null,
    today_plan: body.todayPlan ?? null,
    scratch_pad: body.scratchPad ?? null,
    end_of_day_reflection: body.endOfDayReflection ?? null,
  };

  if ((existing as { id: string }[])[0]) {
    const { error } = await supabaseAdmin
      .from("daily_notes")
      .update(payload)
      .eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
  } else {
    const { error } = await supabaseAdmin.from("daily_notes").insert({
      id,
      date: start,
      ...payload,
    });
    if (error) return res.status(500).json({ error: error.message });
  }
  res.json({});
});

export default router;
