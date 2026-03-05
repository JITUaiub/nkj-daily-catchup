"use client";

import { format, formatDistanceToNow } from "date-fns";
import { Video, Coffee } from "lucide-react";

type NextUpProps = {
  nextMeeting?: {
    title: string;
    start: Date;
    end: Date;
  } | null;
  nextFocusBlock?: {
    until: Date;
    label: string;
  } | null;
};

export function NextUp({ nextMeeting, nextFocusBlock }: NextUpProps) {
  const showMeeting = nextMeeting && nextMeeting.start > new Date();
  const showFocus = nextFocusBlock && !showMeeting;

  if (!showMeeting && !showFocus) {
    return (
      <div className="rounded-card bg-background-light dark:bg-background-dark p-4 shadow-apple border border-apple-gray-5/20">
        <p className="text-sm text-apple-gray-2">No upcoming events. Good time to focus.</p>
      </div>
    );
  }

  if (showMeeting) {
    return (
      <div className="rounded-card bg-apple-blue/5 dark:bg-apple-blue/10 border border-apple-blue/20 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-button bg-apple-blue/20 flex items-center justify-center shrink-0">
          <Video className="w-5 h-5 text-apple-blue" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-apple-gray-1 uppercase tracking-wide">Next up</p>
          <p className="font-medium text-black dark:text-white truncate">
            {nextMeeting.title}
          </p>
          <p className="text-xs text-apple-gray-2 mt-0.5">
            {format(nextMeeting.start, "h:mm a")} ·{" "}
            {formatDistanceToNow(nextMeeting.start, { addSuffix: true })}
          </p>
        </div>
      </div>
    );
  }

  if (showFocus) {
    return (
      <div className="rounded-card bg-apple-green/5 dark:bg-apple-green/10 border border-apple-green/20 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-button bg-apple-green/20 flex items-center justify-center shrink-0">
          <Coffee className="w-5 h-5 text-apple-green" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-apple-gray-1 uppercase tracking-wide">Focus time</p>
          <p className="font-medium text-black dark:text-white">
            {nextFocusBlock.label}
          </p>
          <p className="text-xs text-apple-gray-2 mt-0.5">
            Until {format(nextFocusBlock.until, "h:mm a")}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
