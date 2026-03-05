"use client";

import { Bell } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

type FollowUpItem = {
  id: string;
  title: string;
  dueAt: Date;
  priority: string;
};

type FollowUpsDueTodayProps = {
  items: FollowUpItem[];
};

export function FollowUpsDueToday({ items }: FollowUpsDueTodayProps) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-apple-gray-5/20 flex items-center gap-2">
        <Bell className="w-4 h-4 text-apple-gray-1" />
        <h2 className="font-semibold text-base">Follow-ups due today</h2>
        <span className="text-xs text-apple-gray-1 ml-auto">{items.length}</span>
      </div>
      <ul className="divide-y divide-apple-gray-5/20">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/follow-ups?id=${item.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors focus-ring"
            >
              <span className="text-sm font-medium truncate pr-2">{item.title}</span>
              <span className="text-xs text-apple-gray-1 shrink-0">
                {format(item.dueAt, "h:mm a")} · {item.priority}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
