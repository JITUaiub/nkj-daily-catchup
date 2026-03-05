"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Bell, Plus, Check } from "lucide-react";
import { trpc } from "@/lib/trpc/react";
import { AddFollowUpDialog } from "./add-follow-up-dialog";
import { cn } from "@/lib/utils";

export function FollowUpsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const { data: list, isLoading } = trpc.followUp.list.useQuery({
    includeCompleted: showCompleted,
  });
  const utils = trpc.useUtils();
  const complete = trpc.followUp.complete.useMutation({
    onSuccess: () => utils.followUp.list.invalidate(),
  });

  const items = list ?? [];

  return (
    <div className="min-h-full bg-surface-light dark:bg-surface-dark">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <header className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h1 className="font-display font-semibold text-2xl">Follow-ups</h1>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-apple-gray-2">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded border-apple-gray-5"
              />
              Show completed
            </label>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-button bg-apple-blue text-white text-sm font-medium hover:opacity-90 focus-ring"
            >
              <Plus className="w-4 h-4" /> Add follow-up
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 p-8 text-center text-apple-gray-2 text-sm">
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 p-12 text-center">
            <Bell className="w-12 h-12 text-apple-gray-5 mx-auto mb-4" />
            <p className="text-apple-gray-2 mb-2">No follow-ups</p>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="text-apple-blue font-medium hover:underline"
            >
              Add one
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 p-4 flex items-center gap-4",
                  item.completedAt && "opacity-60"
                )}
              >
                <button
                  type="button"
                  onClick={() => !item.completedAt && complete.mutate({ id: item.id })}
                  className={cn(
                    "w-8 h-8 rounded-button flex items-center justify-center shrink-0 focus-ring",
                    item.completedAt
                      ? "bg-apple-green/20 text-apple-green"
                      : "bg-apple-gray-5/20 text-apple-gray-1 hover:bg-apple-green/20 hover:text-apple-green"
                  )}
                >
                  <Check className="w-4 h-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-medium",
                      item.completedAt && "line-through text-apple-gray-2"
                    )}
                  >
                    {item.title}
                  </p>
                  {item.contextNote && (
                    <p className="text-sm text-apple-gray-2 mt-0.5">{item.contextNote}</p>
                  )}
                  <p className="text-xs text-apple-gray-1 mt-1">
                    Due {format(new Date(item.dueAt), "MMM d, h:mm a")} · {item.priority}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <AddFollowUpDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
