"use client";

import { useMemo } from "react";
import { format, addDays } from "date-fns";
import { CapacityBar } from "./capacity-bar";
import { TodayTasks } from "./today-tasks";
import { TodayMeetings } from "./today-meetings";
import { ActiveTimer } from "./active-timer";
import { CarryOverBanner } from "./carry-over-banner";
import { QuickAddFAB } from "./quick-add-fab";
import { FocusModeToggle } from "./focus-mode-toggle";
import { StatsStrip } from "./stats-strip";
import { UrgentOverdue } from "./urgent-overdue";
import { NextUp } from "./next-up";
import { FollowUpsDueToday } from "./follow-ups-due-today";
import { StandupHelper } from "./standup-helper";
import { WeekAhead } from "./week-ahead";
import { EndOfDayPrompt } from "./end-of-day-prompt";
import { BreakReminder } from "./break-reminder";
import { TodaysNoteTeaser } from "./todays-note-teaser";

const QUOTES = [
  "Design is not just what it looks like. Design is how it works.",
  "Stay hungry. Stay foolish.",
  "Innovation distinguishes between a leader and a follower.",
  "Simple can be harder than complex.",
  "Focus and simplicity.",
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Mock data for prototype
const MOCK_URGENT = [
  { id: "1", title: "Fix login redirect on Safari", type: "p0" as const },
  { id: "2", title: "API spec for payments", type: "overdue" as const, due: "Yesterday" },
];

const MOCK_MEETINGS_TODAY = [
  {
    id: "1",
    title: "Sprint Planning",
    start: new Date(new Date().setHours(10, 0, 0, 0)),
    end: new Date(new Date().setHours(11, 0, 0, 0)),
  },
  {
    id: "2",
    title: "1:1 with Sarah",
    start: new Date(new Date().setHours(14, 0, 0, 0)),
    end: new Date(new Date().setHours(14, 30, 0, 0)),
  },
];

const MOCK_FOLLOW_UPS = [
  { id: "1", title: "Send API spec to Sarah", dueAt: new Date(new Date().setHours(12, 0, 0, 0)), priority: "P1" },
  { id: "2", title: "Review design feedback", dueAt: new Date(new Date().setHours(17, 0, 0, 0)), priority: "P2" },
];

const MOCK_WEEK_AHEAD = [
  { date: addDays(new Date(), 1), label: "Sprint kickoff", type: "meeting" as const, count: 1 },
  { date: addDays(new Date(), 2), label: "Docs deadline", type: "deadline" as const },
  { date: addDays(new Date(), 4), label: "Release candidate", type: "milestone" as const },
];

function getNextMeeting() {
  const now = new Date();
  const next = MOCK_MEETINGS_TODAY.find((m) => m.start > now);
  return next ?? null;
}

function getNextFocusBlock() {
  const nextMeeting = getNextMeeting();
  if (nextMeeting) {
    return {
      until: nextMeeting.start,
      label: "Focus until next meeting",
    };
  }
  return { until: new Date(new Date().setHours(18, 0, 0, 0)), label: "Open focus time" };
}

export function DailyCommandCenter() {
  const greeting = getGreeting();
  const quote = useMemo(
    () => QUOTES[Math.floor(Math.random() * QUOTES.length)],
    []
  );
  const nextMeeting = getNextMeeting();
  const nextFocusBlock = getNextMeeting() ? null : getNextFocusBlock();

  return (
    <div className="min-h-full bg-surface-light dark:bg-surface-dark">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="mb-6">
          <p className="text-sm text-apple-gray-1 mb-1">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
          <h1 className="font-display font-semibold text-2xl text-black dark:text-white">
            {greeting}, Alex
          </h1>
          <p className="text-apple-gray-2 text-sm mt-1 italic">&ldquo;{quote}&rdquo;</p>
        </header>

        {/* Stats at a glance */}
        <section className="mb-6">
          <StatsStrip
            tasksDone={2}
            tasksPlanned={5}
            hoursLoggedMinutes={195}
            meetingsCount={2}
          />
        </section>

        {/* Capacity bar */}
        <section className="mb-6">
          <CapacityBar plannedMinutes={240} totalCapacityMinutes={480} />
        </section>

        {/* Urgent / Overdue */}
        {MOCK_URGENT.length > 0 && (
          <section className="mb-6">
            <UrgentOverdue items={MOCK_URGENT} />
          </section>
        )}

        {/* Next up (meeting or focus block) + Today's note teaser */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <section>
            <NextUp nextMeeting={nextMeeting} nextFocusBlock={nextFocusBlock} />
          </section>
          <section>
            <TodaysNoteTeaser preview="Sprint focus: auth module review, then 1:1 prep…" hasPlan />
          </section>
        </div>

        {/* Break reminder (when lots of meetings) */}
        <section className="mb-6">
          <BreakReminder meetingMinutesSoFar={135} lastBreakAgo="2h ago" />
        </section>

        {/* Carry-over from yesterday */}
        <CarryOverBanner count={2} />

        {/* Active timer */}
        <section className="mb-6">
          <ActiveTimer />
        </section>

        {/* Today's meetings */}
        <section className="mb-6">
          <TodayMeetings />
        </section>

        {/* Today's task queue */}
        <section className="mb-6">
          <TodayTasks />
        </section>

        {/* Follow-ups due today */}
        {MOCK_FOLLOW_UPS.length > 0 && (
          <section className="mb-6">
            <FollowUpsDueToday items={MOCK_FOLLOW_UPS} />
          </section>
        )}

        {/* Standup helper + Week ahead (side by side on larger screens) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <StandupHelper
            inMinutes={15}
            yesterdaySummary="Reviewed PR #230, fixed login redirect bug."
            todayPlan="Sprint planning, 1:1 with Sarah, API docs."
            blockers="Waiting on design for checkout flow."
          />
          <WeekAhead items={MOCK_WEEK_AHEAD} />
        </div>

        {/* End of day prompt */}
        <section className="mb-8">
          <EndOfDayPrompt wrapUpInHours={2} hasReflection={false} />
        </section>

        {/* Focus mode toggle - top right */}
        <div className="fixed top-4 right-6 z-40">
          <FocusModeToggle />
        </div>

        {/* Quick-add FAB */}
        <QuickAddFAB />
      </div>
    </div>
  );
}
