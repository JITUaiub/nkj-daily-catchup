"use client";

import { trpc } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";

const COLUMNS: { id: "todo" | "in_progress" | "in_review" | "done"; title: string; color: string }[] = [
  { id: "todo", title: "To Do", color: "bg-apple-gray-5/30" },
  { id: "in_progress", title: "In Progress", color: "bg-apple-blue/10" },
  { id: "in_review", title: "In Review", color: "bg-apple-orange/10" },
  { id: "done", title: "Done", color: "bg-apple-green/10" },
];

export function TaskKanban() {
  const { data: taskList, isLoading } = trpc.task.list.useQuery();
  const utils = trpc.useUtils();
  const updateStatus = trpc.task.updateStatus.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.id} className="min-w-[260px] rounded-card p-3 animate-pulse bg-apple-gray-5/20">
            <div className="h-5 bg-apple-gray-5/30 rounded w-24 mb-3" />
            <div className="space-y-2 h-32" />
          </div>
        ))}
      </div>
    );
  }

  const tasks = taskList ?? [];
  const byStatus = (status: string) => tasks.filter((t) => t.status === status);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => (
        <div
          key={col.id}
          className={cn(
            "min-w-[260px] rounded-card p-3 flex flex-col",
            col.color,
            "border border-apple-gray-5/20"
          )}
        >
          <h3 className="text-sm font-semibold text-apple-gray-2 mb-3">
            {col.title}
          </h3>
          <div className="space-y-2 flex-1">
            {byStatus(col.id).map((task) => (
              <div
                key={task.id}
                className="rounded-button bg-background-light dark:bg-background-dark p-3 shadow-apple border border-apple-gray-5/20"
              >
                <p className="text-sm font-medium">{task.title}</p>
                <p className="text-xs text-apple-gray-1 mt-0.5 flex items-center gap-1">
                  {task.priority}
                  {task.estimatedMinutes != null && ` · ${task.estimatedMinutes}m`}
                </p>
                {col.id !== "done" && (
                  <div className="mt-2 flex gap-1">
                    {COLUMNS.filter((c) => c.id !== col.id).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => updateStatus.mutate({ id: task.id, status: c.id })}
                        className="text-xs px-2 py-0.5 rounded bg-apple-gray-5/20 hover:bg-apple-gray-5/40 text-apple-gray-2 focus-ring"
                      >
                        → {c.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
