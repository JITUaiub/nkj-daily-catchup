"use client";

import { Calendar, Video } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const MOCK_MEETINGS = [
  {
    id: "1",
    title: "Sprint Planning",
    start: new Date(new Date().setHours(10, 0, 0, 0)),
    end: new Date(new Date().setHours(11, 0, 0, 0)),
    isVideo: true,
  },
  {
    id: "2",
    title: "1:1 with Sarah",
    start: new Date(new Date().setHours(14, 0, 0, 0)),
    end: new Date(new Date().setHours(14, 30, 0, 0)),
    isVideo: true,
  },
];

export function TodayMeetings() {
  return (
    <section className="rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-apple-gray-5/20 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-apple-gray-1" />
        <h2 className="font-semibold text-base">Today&apos;s meetings</h2>
      </div>
      <ul className="divide-y divide-apple-gray-5/20">
        {MOCK_MEETINGS.length === 0 ? (
          <li className="px-4 py-8 text-center text-apple-gray-1 text-sm">
            No meetings today. Protect your focus time.
          </li>
        ) : (
          MOCK_MEETINGS.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-button bg-apple-blue/10 flex items-center justify-center">
                <Video className="w-5 h-5 text-apple-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{m.title}</p>
                <p className="text-xs text-apple-gray-1 mt-0.5">
                  {format(m.start, "h:mm a")} – {format(m.end, "h:mm a")}
                  <span className="ml-1">
                    · {formatDistanceToNow(m.start, { addSuffix: true })}
                  </span>
                </p>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
