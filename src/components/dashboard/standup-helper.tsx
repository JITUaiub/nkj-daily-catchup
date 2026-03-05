"use client";

import { Mic } from "lucide-react";
import Link from "next/link";

type StandupHelperProps = {
  inMinutes?: number | null;
  yesterdaySummary?: string;
  todayPlan?: string;
  blockers?: string;
};

export function StandupHelper({
  inMinutes = 15,
  yesterdaySummary = "Reviewed PR #230, fixed login redirect bug.",
  todayPlan = "Sprint planning, 1:1 with Sarah, API docs.",
  blockers = "Waiting on design for checkout flow.",
}: StandupHelperProps) {
  return (
    <section className="rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-apple-gray-5/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-apple-gray-1" />
          <h2 className="font-semibold text-base">Standup prep</h2>
        </div>
        {inMinutes != null && (
          <span className="text-xs text-apple-orange font-medium">
            In ~{inMinutes} min
          </span>
        )}
      </div>
      <div className="p-4 space-y-3 text-sm">
        <div>
          <p className="text-xs font-medium text-apple-gray-1 uppercase tracking-wide mb-1">
            Yesterday
          </p>
          <p className="text-apple-gray-2">{yesterdaySummary}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-apple-gray-1 uppercase tracking-wide mb-1">
            Today
          </p>
          <p className="text-apple-gray-2">{todayPlan}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-apple-gray-1 uppercase tracking-wide mb-1">
            Blockers
          </p>
          <p className="text-apple-gray-2">{blockers}</p>
        </div>
      </div>
      <div className="px-4 pb-4">
        <Link
          href="/ai?action=standup"
          className="text-sm font-medium text-apple-blue hover:underline focus-ring"
        >
          Draft update with AI →
        </Link>
      </div>
    </section>
  );
}
