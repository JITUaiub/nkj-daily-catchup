import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, List, LayoutGrid } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export function TasksPage() {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [view, setView] = useState<"list" | "kanban">("list");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => api.tasks.list(),
  });

  const createTask = useMutation({
    mutationFn: (title: string) => api.tasks.create({ title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setNewTitle("");
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.tasks.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const byStatus = {
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    in_review: tasks.filter((t) => t.status === "in_review"),
    done: tasks.filter((t) => t.status === "done"),
  };

  return (
    <div className="page">
      <div className="page-content-wide">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-semibold text-[var(--color-label)] tracking-tight">
            Tasks
          </h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "btn btn-ghost btn-sm",
                view === "list" &&
                  "bg-[var(--color-primary)]/12 text-[var(--color-primary)] border-[var(--color-primary)]/30"
              )}
            >
              <List className="w-4 h-4" /> List
            </button>
            <button
              type="button"
              onClick={() => setView("kanban")}
              className={cn(
                "btn btn-ghost btn-sm",
                view === "kanban" &&
                  "bg-[var(--color-primary)]/12 text-[var(--color-primary)] border-[var(--color-primary)]/30"
              )}
            >
              <LayoutGrid className="w-4 h-4" /> Kanban
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="New task..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTitle.trim()) {
                createTask.mutate(newTitle.trim());
              }
            }}
            className="input flex-1"
          />
          <button
            type="button"
            onClick={() =>
              newTitle.trim() && createTask.mutate(newTitle.trim())
            }
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {isLoading ? (
          <div className="empty-state">Loading...</div>
        ) : view === "list" ? (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <motion.li
                key={t.id}
                layout
                className="list-item group"
              >
                <select
                  value={t.status}
                  onChange={(e) =>
                    updateStatus.mutate({ id: t.id, status: e.target.value })
                  }
                  className="select shrink-0 w-[7.5rem]"
                >
                  <option value="todo">To do</option>
                  <option value="in_progress">In progress</option>
                  <option value="in_review">In review</option>
                  <option value="done">Done</option>
                </select>
                <span
                  className={cn(
                    "flex-1 font-medium",
                    t.status === "done" &&
                      "line-through text-[var(--color-secondary-label)]"
                  )}
                >
                  {t.title}
                </span>
                <span className="badge badge-neutral">{t.priority}</span>
              </motion.li>
            ))}
            {tasks.length === 0 && (
              <li className="empty-state">No tasks yet. Add one above.</li>
            )}
          </ul>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(["todo", "in_progress", "in_review", "done"] as const).map(
              (status) => (
                <div
                  key={status}
                  className="card card-elevated p-4 flex flex-col min-h-[200px]"
                >
                  <h3 className="section-title mb-3">
                    {status.replace("_", " ")}
                  </h3>
                  <ul className="space-y-2 flex-1">
                    {byStatus[status].map((t) => (
                      <motion.li
                        key={t.id}
                        layout
                        className="rounded-lg bg-[var(--color-background)]/80 border border-[var(--color-separator)] px-3 py-2.5 text-sm font-medium text-[var(--color-label)]"
                      >
                        {t.title}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
