"use client";

import { FileText } from "lucide-react";
import Link from "next/link";

type TodaysNoteTeaserProps = {
  preview?: string | null;
  hasPlan?: boolean;
};

export function TodaysNoteTeaser({
  preview = "Sprint focus: auth module review, then 1:1 prep…",
  hasPlan = true,
}: TodaysNoteTeaserProps) {
  return (
    <Link
      href="/notes"
      className="rounded-card bg-background-light dark:bg-background-dark p-4 shadow-apple border border-apple-gray-5/20 flex items-center gap-3 hover:border-apple-blue/30 transition-colors focus-ring block"
    >
      <div className="w-10 h-10 rounded-button bg-apple-blue/10 flex items-center justify-center shrink-0">
        <FileText className="w-5 h-5 text-apple-blue" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-black dark:text-white text-sm">Today&apos;s note</p>
        <p className="text-xs text-apple-gray-2 truncate mt-0.5">
          {hasPlan ? preview : "No note yet — add a plan or scratch pad"}
        </p>
      </div>
    </Link>
  );
}
