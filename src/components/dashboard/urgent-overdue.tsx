"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

type UrgentItem = {
  id: string;
  title: string;
  type: "overdue" | "p0";
  due?: string;
};

type UrgentOverdueProps = {
  items: UrgentItem[];
};

export function UrgentOverdue({ items }: UrgentOverdueProps) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-card bg-apple-red/5 dark:bg-apple-red/10 border border-apple-red/20 p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-apple-red shrink-0" />
        <h2 className="text-sm font-semibold text-apple-red">Needs attention</h2>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/tasks?id=${item.id}`}
              className="flex items-center justify-between text-sm hover:underline focus-ring rounded py-0.5"
            >
              <span className="font-medium text-black dark:text-white truncate pr-2">
                {item.title}
              </span>
              <span className="text-xs text-apple-red shrink-0">
                {item.type === "overdue" ? item.due : "P0"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
