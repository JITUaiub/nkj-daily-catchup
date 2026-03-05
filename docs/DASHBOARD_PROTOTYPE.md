# Dashboard Prototype — Employee Daily Hub

This document describes the **My Day** dashboard prototype and how each section will eventually connect to real data.

## Dashboard sections (top to bottom)

### 1. Header
- **Date** — Current day (e.g. Sunday, March 1).
- **Greeting** — "Good morning/afternoon/evening, [Name]".
- **Quote** — Short motivational line (rotating).

*Next:* Name from auth/session; optional user preference for quote.

---

### 2. Stats strip (at a glance)
- **Tasks done today** — e.g. 2/5.
- **Time logged** — Total minutes logged today.
- **Meetings today** — Count of calendar events.

*Next:* Drive from `tasks` (completed today), `time_entries`, and calendar sync.

---

### 3. 8-hour capacity bar
- **Planned vs capacity** — Visual bar (green / yellow / red if overbooked).
- **Planned time** — Sum of task estimates + meeting time for today.

*Next:* Sum `tasks.estimatedMinutes` for today’s queue + meeting duration from calendar.

---

### 4. Urgent / overdue (needs attention)
- **P0 tasks** and **overdue items** — Links to task detail.
- Shown only when there are such items.

*Next:* Filter `tasks` where `priority = 'P0'` or `dueDate < today`.

---

### 5. Next up + Today’s note teaser (grid)
- **Next up** — Next meeting (with countdown) or “Focus time until [time]”.
- **Today’s note** — Teaser line + link to daily note.

*Next:* Next meeting from calendar; focus block = next free slot. Note from `daily_notes` for today.

---

### 6. Break reminder
- Shown when **meeting time today** exceeds a threshold (e.g. 2h).
- Suggests a short break; can show “last break X ago” if we track it.

*Next:* Sum meeting minutes from calendar; optional “last break” from time_entries (e.g. category “break”) or manual log.

---

### 7. Carry-over from yesterday
- **Count** of incomplete tasks from previous day.
- **Review** → Tasks filtered by carry-over.

*Next:* Tasks with `completedAt IS NULL` and `dueDate = yesterday` (or carried_over_from logic).

---

### 8. Active timer
- **Start / Stop** — Tied to current task (optional).
- **Elapsed time** while running.

*Next:* Persist to `time_entries` (start/stop); show active entry from DB or in-memory state.

---

### 9. Today’s meetings
- List of **today’s calendar events** with time and countdown.
- Prep link per meeting (later).

*Next:* Calendar API (Google/Apple); store in `meetings` or fetch on load.

---

### 10. Today’s task queue
- **Ordered list** of tasks to do today (drag to reorder).
- Checkbox, title, project, priority, estimate.

*Next:* `tasks` for today (or “today queue” ordering); reorder updates `sort_order` or a separate “today_order” table.

---

### 11. Follow-ups due today
- **Due today** with time and priority.
- Link to follow-up detail.

*Next:* `follow_ups` where `dueAt` is today and not completed.

---

### 12. Standup helper + Week ahead (grid)
- **Standup prep** — Yesterday / Today / Blockers (pre-filled from notes or AI).
- **“Draft update with AI”** → WorkDay AI standup action.
- **This week** — Key dates: deadlines, milestones, meetings.

*Next:* Standup text from last note or AI; week from `tasks.dueDate`, `meetings`, or milestones.

---

### 13. End of day prompt
- **Time until wrap-up** (e.g. “~2h until typical wrap-up”).
- **Reflect** → Link to daily note reflection section.
- Can hide or change copy if user already added a reflection.

*Next:* User preference for “typical end time”; `daily_notes.endOfDayReflection` to set `hasReflection`.

---

## Global UI (all pages)

- **Sidebar** — Nav (My Day, Tasks, Time, Follow-ups, Notes, Meetings, Projects, WorkDay AI), ⌘K, Settings, theme.
- **Focus mode toggle** — Top right; hides non-essential UI (later: DND suggestion).
- **Quick-add FAB** — Task, Note, Timer, Follow-up.

---

## Next phase: “Make the whole app working”

1. **Auth** — Session/user so all data is scoped (e.g. NextAuth).
2. **DB** — Wire each section to MySQL via tRPC (tasks, time_entries, follow_ups, daily_notes, meetings).
3. **Calendar** — Sync meetings (Google/Apple) and optionally “no meeting” blocks.
4. **AI** — Standup draft, plan my day, summarize (OpenAI).
5. **Real-time** — Optional live updates (e.g. timer, task reorder) if needed.

All dashboard sections are built as presentational components with mock data; swapping to tRPC and real DB will not change the layout, only the data source.
