"use client";

import * as Progress from "@radix-ui/react-progress";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

const WORKDAY_MINUTES = 480; // 8 hours

type CapacityBarProps = {
  plannedMinutes: number;
  totalCapacityMinutes?: number;
};

export function CapacityBar({
  plannedMinutes,
  totalCapacityMinutes = WORKDAY_MINUTES,
}: CapacityBarProps) {
  const percentage = Math.min(100, (plannedMinutes / totalCapacityMinutes) * 100);
  const isOverbooked = plannedMinutes > totalCapacityMinutes;
  const isNearFull = percentage >= 90 && !isOverbooked;

  const barColor = isOverbooked
    ? "bg-apple-red"
    : isNearFull
      ? "bg-apple-orange"
      : "bg-apple-green";

  return (
    <div className="rounded-card bg-background-light dark:bg-background-dark p-4 shadow-apple border border-apple-gray-5/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-apple-gray-2">
          8-hour workday capacity
        </span>
        <span
          className={cn(
            "text-sm font-medium",
            isOverbooked ? "text-apple-red" : "text-apple-gray-2"
          )}
        >
          {formatDuration(plannedMinutes)} planned
          {isOverbooked && " — overbooked"}
        </span>
      </div>
      <Progress.Root
        value={percentage}
        className="relative h-2 w-full overflow-hidden rounded-full bg-apple-gray-5/30"
      >
        <Progress.Indicator
          className={cn("h-full transition-all duration-300 ease-out", barColor)}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </Progress.Root>
    </div>
  );
}
