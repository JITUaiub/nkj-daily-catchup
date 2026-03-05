"use client";

import { GripVertical, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_TASKS = [
  { id: "1", title: "Review PR #234 — Auth module", project: "Payments", est: 30, priority: "P1" },
  { id: "2", title: "Fix login redirect on Safari", project: "Web App", est: 60, priority: "P0" },
  { id: "3", title: "Update API documentation", project: "Platform", est: 45, priority: "P2" },
];

export function TodayTasks() {
  return (
    <section className="rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-apple-gray-5/20 flex items-center justify-between">
        <h2 className="font-semibold text-base">Today&apos;s task queue</h2>
        <span className="text-xs text-apple-gray-1">
          Drag to reorder
        </span>
      </div>
      <ul className="divide-y divide-apple-gray-5/20">
        {MOCK_TASKS.map((task, i) => (
          <li
            key={task.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group"
          >
            <button
              type="button"
              className="cursor-grab active:cursor-grabbing text-apple-gray-1 opacity-0 group-hover:opacity-100 focus:opacity-100 focus-ring rounded p-0.5"
              aria-label="Drag to reorder"
            >
              <GripVertical className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="flex-shrink-0 text-apple-gray-1 hover:text-apple-blue transition-colors"
              aria-label="Mark complete"
            >
              <Circle className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{task.title}</p>
              <p className="text-xs text-apple-gray-1 flex items-center gap-1 mt-0.5">
                <span>{task.project}</span>
                <span>·</span>
                <span className={cn(
                  "font-medium",
                  task.priority === "P0" && "text-apple-red",
                  task.priority === "P1" && "text-apple-orange"
                )}>
                  {task.priority}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-1 text-apple-gray-1 text-xs flex-shrink-0">
              <Clock className="w-3.5 h-3.5" />
              {task.est}m
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
