"use client";

import { useEffect } from "react";
import { useTimerStore } from "@/stores/timer";
import { trpc } from "@/lib/trpc/react";
import { formatDuration } from "@/lib/utils";
import { Play, Square } from "lucide-react";

const CATEGORIES = [
  { id: "coding", label: "Coding" },
  { id: "review", label: "Code review" },
  { id: "meetings", label: "Meetings" },
  { id: "admin", label: "Admin" },
  { id: "break", label: "Break" },
];

export function TimeTrackerPage() {
  const { isRunning, elapsedMinutes, start: startLocal, stop: stopLocal } = useTimerStore();
  const utils = trpc.useUtils();
  const { data: active } = trpc.time.getActive.useQuery(undefined, { refetchInterval: isRunning ? 10000 : false });
  const { data: summary } = trpc.time.getTodaySummary.useQuery();
  const startMutation = trpc.time.start.useMutation({
    onSuccess: () => {
      utils.time.getActive.invalidate();
      utils.time.getTodaySummary.invalidate();
      startLocal();
    },
  });
  const stopMutation = trpc.time.stop.useMutation({
    onSuccess: () => {
      utils.time.getActive.invalidate();
      utils.time.getTodaySummary.invalidate();
      stopLocal();
    },
  });

  useEffect(() => {
    if (active && !isRunning) startLocal();
    if (!active && isRunning) stopLocal();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  const handleStart = (category: string) => {
    startMutation.mutate({ category });
  };

  const handleStop = () => {
    stopMutation.mutate();
  };

  const byCategory = summary?.byCategory ?? [];
  const total = summary?.total ?? 0;

  return (
    <div className="min-h-full bg-surface-light dark:bg-surface-dark">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="font-display font-semibold text-2xl mb-8">Time Tracker</h1>

        <div className="rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 p-6 mb-8">
          <h2 className="text-sm font-medium text-apple-gray-2 mb-4">Current session</h2>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="text-4xl font-display font-semibold tabular-nums text-apple-blue">
              {isRunning ? formatDuration(elapsedMinutes) : "0m"}
            </div>
            <div className="flex gap-2">
              {!isRunning ? (
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleStart(cat.id)}
                      disabled={startMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 rounded-button bg-apple-blue text-white text-sm font-medium hover:opacity-90 focus-ring disabled:opacity-50"
                    >
                      <Play className="w-4 h-4" /> {cat.label}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStop}
                  disabled={stopMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-button bg-apple-red text-white font-medium hover:opacity-90 focus-ring disabled:opacity-50"
                >
                  <Square className="w-4 h-4" /> Stop
                </button>
              )}
            </div>
          </div>
          {active && <p className="text-xs text-apple-gray-1 mt-2">Category: {active.category}</p>}
        </div>

        <div className="rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 p-6">
          <h2 className="text-sm font-medium text-apple-gray-2 mb-4">Today&apos;s time by category</h2>
          {byCategory.length === 0 ? (
            <p className="text-sm text-apple-gray-2">No time logged today yet.</p>
          ) : (
            <>
              <div className="space-y-3">
                {byCategory.map((row) => (
                  <div key={row.category} className="flex items-center justify-between">
                    <span className="text-sm">{row.category}</span>
                    <span className="text-sm font-medium tabular-nums">{formatDuration(row.minutes)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-apple-gray-5/20 flex justify-between text-sm font-medium">
                <span>Total</span>
                <span className="tabular-nums">{formatDuration(total)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
