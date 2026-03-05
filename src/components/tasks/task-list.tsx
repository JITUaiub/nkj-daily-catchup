"use client";

import { Circle, CheckCircle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";

const priorityColor: Record<string, string> = {
  P0: "text-apple-red",
  P1: "text-apple-orange",
  P2: "text-apple-gray-2",
  P3: "text-apple-gray-1",
};

export function TaskList() {
  const { data: taskList, isLoading } = trpc.task.list.useQuery();
  const utils = trpc.useUtils();
  const updateStatus = trpc.task.updateStatus.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
  });

  if (isLoading) {
    return (
      <div className="rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 p-8 text-center text-apple-gray-2 text-sm">
        Loading tasks…
      </div>
    );
  }

  const tasks = taskList ?? [];

  if (tasks.length === 0) {
    return (
      <div className="rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 p-8 text-center text-apple-gray-2 text-sm">
        No tasks yet. Add one to get started.
      </div>
    );
  }

  return (
    <div className="rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 overflow-hidden">
      <ul className="divide-y divide-apple-gray-5/20">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
          >
            <button
              type="button"
              onClick={() =>
                updateStatus.mutate({
                  id: task.id,
                  status: task.status === "done" ? "todo" : "done",
                })
              }
              className={cn(
                "focus-ring rounded p-0.5",
                task.status === "done" ? "text-apple-green" : "text-apple-gray-1 hover:text-apple-green"
              )}
              title={task.status === "done" ? "Mark not done" : "Mark done"}
            >
              {task.status === "done" ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium",
                  task.status === "done" && "line-through text-apple-gray-2"
                )}
              >
                {task.title}
              </p>
              <p className="text-xs text-apple-gray-1 flex items-center gap-2 mt-0.5">
                {task.projectId && <span>Project</span>}
                <span className={cn("font-medium", priorityColor[task.priority])}>
                  {task.priority}
                </span>
                {task.estimatedMinutes != null && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" /> {task.estimatedMinutes}m
                  </span>
                )}
              </p>
            </div>
            <span className="text-xs text-apple-gray-1 capitalize px-2 py-0.5 rounded bg-surface-light dark:bg-surface-dark">
              {task.status.replace("_", " ")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
