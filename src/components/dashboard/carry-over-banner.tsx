"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";

export function CarryOverBanner({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <div className="mb-6 rounded-button bg-apple-orange/10 dark:bg-apple-orange/20 border border-apple-orange/30 px-4 py-3 flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-apple-orange shrink-0" />
      <p className="text-sm text-apple-orange flex-1">
        <strong>{count}</strong> item{count !== 1 ? "s" : ""} carried over from yesterday.
      </p>
      <Link
        href="/tasks?filter=carry-over"
        className="text-sm font-medium text-apple-orange hover:underline focus-ring rounded"
      >
        Review
      </Link>
    </div>
  );
}
