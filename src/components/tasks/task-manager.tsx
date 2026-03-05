"use client";

import { useState } from "react";
import { LayoutList, LayoutGrid, Plus } from "lucide-react";
import { TaskKanban } from "./task-kanban";
import { TaskList } from "./task-list";
import { AddTaskDialog } from "./add-task-dialog";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "kanban";

export function TaskManager() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="min-h-full bg-surface-light dark:bg-surface-dark">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <header className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h1 className="font-display font-semibold text-2xl">Tasks</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-button bg-apple-blue text-white text-sm font-medium hover:opacity-90 focus-ring"
            >
              <Plus className="w-4 h-4" /> Add task
            </button>
            <div className="flex items-center gap-1 rounded-button bg-apple-gray-5/20 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-button transition-colors focus-ring",
                viewMode === "list"
                  ? "bg-background-light dark:bg-background-dark shadow-sm text-apple-blue"
                  : "text-apple-gray-2 hover:text-apple-gray-1"
              )}
              title="List view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={cn(
                "p-2 rounded-button transition-colors focus-ring",
                viewMode === "kanban"
                  ? "bg-background-light dark:bg-background-dark shadow-sm text-apple-blue"
                  : "text-apple-gray-2 hover:text-apple-gray-1"
              )}
              title="Kanban view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            </div>
          </div>
        </header>

        {viewMode === "list" ? <TaskList /> : <TaskKanban />}
      </div>
      <AddTaskDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
