"use client";

import { Sunset } from "lucide-react";
import Link from "next/link";

type EndOfDayPromptProps = {
  wrapUpInHours?: number;
  hasReflection?: boolean;
};

export function EndOfDayPrompt({
  wrapUpInHours = 2,
  hasReflection = false,
}: EndOfDayPromptProps) {
  return (
    <div className="rounded-card bg-apple-orange/5 dark:bg-apple-orange/10 border border-apple-orange/20 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-button bg-apple-orange/20 flex items-center justify-center shrink-0">
        <Sunset className="w-5 h-5 text-apple-orange" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-black dark:text-white">
          {wrapUpInHours > 0
            ? `~${wrapUpInHours}h until typical wrap-up`
            : "End of day"}
        </p>
        <p className="text-sm text-apple-gray-2 mt-0.5">
          {hasReflection
            ? "You added a reflection today."
            : "Add a quick reflection to close the day."}
        </p>
      </div>
      {!hasReflection && (
        <Link
          href="/notes?section=reflection"
          className="shrink-0 text-sm font-medium text-apple-orange hover:underline focus-ring"
        >
          Reflect
        </Link>
      )}
    </div>
  );
}
