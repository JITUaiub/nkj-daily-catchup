"use client";

import { format, addDays } from "date-fns";
import { Calendar } from "lucide-react";

type WeekItem = {
  date: Date;
  label: string;
  count?: number;
  type: "deadline" | "meeting" | "milestone";
};

type WeekAheadProps = {
  items: WeekItem[];
};

export function WeekAhead({ items }: WeekAheadProps) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-apple-gray-5/20 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-apple-gray-1" />
        <h2 className="font-semibold text-base">This week</h2>
      </div>
      <ul className="divide-y divide-apple-gray-5/20">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
          >
            <span className="text-apple-gray-1 w-20 shrink-0">
              {format(item.date, "EEE M/d")}
            </span>
            <span
              className={
                item.type === "deadline"
                  ? "text-apple-red"
                  : item.type === "milestone"
                    ? "text-apple-blue"
                    : "text-apple-gray-2"
              }
            >
              {item.label}
            </span>
            {item.count != null && item.count > 0 && (
              <span className="text-apple-gray-1 text-xs ml-auto">
                {item.count} items
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
