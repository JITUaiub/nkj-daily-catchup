"use client";

import { Coffee } from "lucide-react";

type BreakReminderProps = {
  meetingMinutesSoFar?: number;
  lastBreakAgo?: string;
};

export function BreakReminder({
  meetingMinutesSoFar = 135,
  lastBreakAgo = "2h ago",
}: BreakReminderProps) {
  const show = meetingMinutesSoFar >= 120;

  if (!show) return null;

  return (
    <div className="rounded-button bg-apple-teal/10 dark:bg-apple-teal/20 border border-apple-teal/30 px-4 py-2.5 flex items-center gap-2">
      <Coffee className="w-4 h-4 text-apple-teal shrink-0" />
      <p className="text-sm text-apple-gray-2">
        You’ve been in meetings for {Math.floor(meetingMinutesSoFar / 60)}h+.
        Last break {lastBreakAgo}. Consider a short pause.
      </p>
    </div>
  );
}
