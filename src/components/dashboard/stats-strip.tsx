"use client";

import { CheckCircle, Clock, Calendar } from "lucide-react";
import { formatDuration } from "@/lib/utils";

type StatsStripProps = {
  tasksDone: number;
  tasksPlanned: number;
  hoursLoggedMinutes: number;
  meetingsCount: number;
};

export function StatsStrip({
  tasksDone,
  tasksPlanned,
  hoursLoggedMinutes,
  meetingsCount,
}: StatsStripProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-button bg-background-light dark:bg-background-dark p-3 shadow-apple border border-apple-gray-5/20 flex items-center gap-3">
        <div className="w-9 h-9 rounded-button bg-apple-green/15 flex items-center justify-center">
          <CheckCircle className="w-4 h-4 text-apple-green" />
        </div>
        <div>
          <p className="text-lg font-semibold tabular-nums text-black dark:text-white">
            {tasksDone}/{tasksPlanned}
          </p>
          <p className="text-xs text-apple-gray-1">Tasks done today</p>
        </div>
      </div>
      <div className="rounded-button bg-background-light dark:bg-background-dark p-3 shadow-apple border border-apple-gray-5/20 flex items-center gap-3">
        <div className="w-9 h-9 rounded-button bg-apple-blue/15 flex items-center justify-center">
          <Clock className="w-4 h-4 text-apple-blue" />
        </div>
        <div>
          <p className="text-lg font-semibold tabular-nums text-black dark:text-white">
            {formatDuration(hoursLoggedMinutes)}
          </p>
          <p className="text-xs text-apple-gray-1">Time logged</p>
        </div>
      </div>
      <div className="rounded-button bg-background-light dark:bg-background-dark p-3 shadow-apple border border-apple-gray-5/20 flex items-center gap-3">
        <div className="w-9 h-9 rounded-button bg-apple-orange/15 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-apple-orange" />
        </div>
        <div>
          <p className="text-lg font-semibold tabular-nums text-black dark:text-white">
            {meetingsCount}
          </p>
          <p className="text-xs text-apple-gray-1">Meetings today</p>
        </div>
      </div>
    </div>
  );
}
