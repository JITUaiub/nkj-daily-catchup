"use client";

import { useTimerStore } from "@/stores/timer";
import { formatDuration } from "@/lib/utils";
import { Play, Square } from "lucide-react";

export function ActiveTimer() {
  const { isRunning, elapsedMinutes, start, stop, currentTaskTitle } = useTimerStore();

  if (!isRunning && elapsedMinutes === 0) {
    return (
      <section className="rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 p-4 flex items-center justify-between">
        <p className="text-sm text-apple-gray-2">No active timer</p>
        <button
          type="button"
          onClick={() => start()}
          className="flex items-center gap-2 px-3 py-2 rounded-button bg-apple-blue text-white text-sm font-medium hover:opacity-90 transition-opacity focus-ring"
        >
          <Play className="w-4 h-4" />
          Start timer
        </button>
      </section>
    );
  }

  if (isRunning) {
    return (
      <section className="rounded-card bg-apple-blue/10 dark:bg-apple-blue/20 border border-apple-blue/30 shadow-apple p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-apple-gray-2 uppercase tracking-wide">Tracking</p>
          <p className="font-medium text-apple-blue">
            {currentTaskTitle || "No task selected"}
          </p>
          <p className="text-2xl font-display font-semibold text-apple-blue mt-1 tabular-nums">
            {formatDuration(elapsedMinutes)}
          </p>
        </div>
        <button
          type="button"
          onClick={stop}
          className="flex items-center gap-2 px-4 py-2 rounded-button bg-apple-red text-white text-sm font-medium hover:opacity-90 transition-opacity focus-ring"
        >
          <Square className="w-4 h-4" />
          Stop
        </button>
      </section>
    );
  }

  return null;
}
