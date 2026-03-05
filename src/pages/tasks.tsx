import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, List, LayoutGrid, Trash2, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AddTaskDialog } from "@/components/dialogs/add-task-dialog";

type ViewMode = "list" | "kanban";
type FilterMode = "all" | "today" | "done";

export function TasksPage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("list");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [projectId, setProjectId] = useState<string | "all">(
    () => (localStorage.getItem("workday:selectedProjectId") as string | null) ?? "all"
  );
  const [logOpenFor, setLogOpenFor] = useState<string | null>(null);
  const [logHours, setLogHours] = useState("");
  const [logMinutes, setLogMinutes] = useState("");

  const {
    data: projects = [],
    isLoading: projectsLoading,
    isError: projectsError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.projects.list(),
  });

  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["tasks", filter, projectId],
    queryFn: () => {
      const base: { projectId?: string; status?: string; dueToday?: boolean } = {};
      if (projectId !== "all") base.projectId = projectId;
      if (filter === "today") {
        base.dueToday = true;
      } else if (filter === "done") {
        base.status = "done";
      }
      return api.tasks.list(base);
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.tasks.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => api.tasks.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const logTime = useMutation({
    mutationFn: ({ id, minutes }: { id: string; minutes: number }) =>
      api.tasks.logTime(id, minutes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setLogOpenFor(null);
      setLogHours("");
      setLogMinutes("");
    },
  });

  const byStatus = {
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    in_review: tasks.filter((t) => t.status === "in_review"),
    done: tasks.filter((t) => t.status === "done"),
  };

  useEffect(() => {
    if (projectId !== "all") {
      localStorage.setItem("workday:selectedProjectId", projectId);
    } else {
      localStorage.removeItem("workday:selectedProjectId");
    }
  }, [projectId]);

  const formatLogged = (minutes: number) => {
    if (!minutes || minutes <= 0) return "0m logged";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h && m) return `${h}h ${m}m logged`;
    if (h) return `${h}h logged`;
    return `${m}m logged`;
  };

  const handleLogSubmit = (taskId: string) => {
    const hoursVal = Number(logHours || 0);
    const minutesVal = Number(logMinutes || 0);
    const totalMinutes = hoursVal * 60 + minutesVal;
    if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return;
    logTime.mutate({ id: taskId, minutes: totalMinutes });
  };

  const selectedProject =
    projectId === "all" ? null : projects.find((p) => p.id === projectId) ?? null;

  return (
    <div className="page">
      <div className="page-content-wide">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-label)] tracking-tight">
              Tasks
            </h1>
            <p className="mt-1 text-sm text-[var(--color-secondary-label)]">
              View and log time on tasks. Filter by project or switch to list/kanban view.
            </p>
          </div>
          <div className="flex items-center gap-2">
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
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus className="w-4 h-4" /> Add task
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-1 rounded-full bg-[var(--color-background-elevated)] border border-[var(--color-separator)] p-0.5">
            {[
              { id: "all", label: "All" },
              { id: "today", label: "Today" },
              { id: "done", label: "Done" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id as FilterMode)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                  filter === f.id
                    ? "bg-[var(--color-label)] text-[var(--color-background)]"
                    : "text-[var(--color-secondary-label)] hover:text-[var(--color-label)]"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-background-elevated)] border border-[var(--color-separator)] px-2 py-1.5">
            <span className="text-[10px] font-medium text-[var(--color-secondary-label)] uppercase tracking-wide">
              Project
            </span>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value as string | "all")}
              className="bg-transparent text-xs text-[var(--color-label)] focus:outline-none"
            >
              <option value="all">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedProject && (
          <div className="mb-4 text-xs text-[var(--color-secondary-label)] flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full border border-[var(--color-background)] shadow-sm"
              style={{ backgroundColor: selectedProject.color }}
            />
            <span className="font-medium text-[var(--color-label)]">
              {selectedProject.name}
            </span>
            {selectedProject.description && (
              <span className="truncate max-w-[260px]">
                — {selectedProject.description}
              </span>
            )}
          </div>
        )}

        {/* Content */}
        {isError ? (
          <div className="empty-state rounded-xl border border-[var(--color-separator)] bg-[var(--color-card)]">
            <p className="mb-2">
              Couldn&apos;t load your tasks{" "}
              <span className="text-[var(--color-secondary-label)]">
                ({(error as Error).message})
              </span>
              .
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["tasks"] })}
            >
              Try again
            </button>
          </div>
        ) : projectsError ? (
          <div className="empty-state rounded-xl border border-[var(--color-separator)] bg-[var(--color-card)]">
            <p className="mb-2">
              Couldn&apos;t load projects. Tasks will still show, but project scoping won&apos;t work.
            </p>
          </div>
        ) : isLoading || projectsLoading ? (
          <div className="empty-state rounded-xl border border-[var(--color-separator)] bg-[var(--color-card)]">
            Loading your task queue…
          </div>
        ) : view === "list" ? (
          <ul className="space-y-2">
            {tasks.map((t) => {
              const isLogging = logOpenFor === t.id;
              return (
                <motion.li
                  key={t.id}
                  layout
                  className="list-item group flex-col gap-1 rounded-xl"
                >
                  <div className="flex items-center gap-3 w-full">
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
                    <span className="badge badge-neutral shrink-0">{t.priority}</span>
                    <div className="flex items-center gap-2 shrink-0 text-[11px] text-[var(--color-secondary-label)]">
                      <button
                        type="button"
                        onClick={() =>
                          setLogOpenFor((current) => (current === t.id ? null : t.id))
                        }
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--color-separator)] text-[var(--color-label)] hover:bg-[var(--color-background-elevated)] transition-colors"
                      >
                        <Clock className="w-3 h-3" />
                        Log time
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTask.mutate(t.id)}
                        className="p-1.5 rounded-lg text-[var(--color-secondary-label)] hover:text-[var(--color-danger)] hover:bg-red-500/10 transition-colors"
                        aria-label="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 pl-[calc(7.5rem+0.75rem)] pr-1 pb-1">
                    <p className="text-[11px] text-[var(--color-secondary-label)]">
                      {formatLogged(t.loggedMinutes)}
                    </p>
                  </div>
                  {isLogging && (
                    <div className="w-full pl-[calc(7.5rem+0.75rem)] pb-1">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-[var(--color-secondary-label)]">Add</span>
                        <input
                          type="number"
                          min={0}
                          value={logHours}
                          onChange={(e) => setLogHours(e.target.value)}
                          placeholder="0"
                          className="input input-ghost w-12 h-7 text-xs"
                          aria-label="Hours"
                        />
                        <span className="text-[var(--color-secondary-label)]">h</span>
                        <input
                          type="number"
                          min={0}
                          value={logMinutes}
                          onChange={(e) => setLogMinutes(e.target.value)}
                          placeholder="30"
                          className="input input-ghost w-12 h-7 text-xs"
                          aria-label="Minutes"
                        />
                        <span className="text-[var(--color-secondary-label)]">m</span>
                        <button
                          type="button"
                          onClick={() => handleLogSubmit(t.id)}
                          className="btn btn-primary btn-xs"
                          disabled={logTime.isPending}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLogOpenFor(null);
                            setLogHours("");
                            setLogMinutes("");
                          }}
                          className="btn btn-ghost btn-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </motion.li>
              );
            })}
            {tasks.length === 0 && (
              <li className="empty-state rounded-xl border-2 border-dashed border-[var(--color-separator)] bg-[var(--color-background-elevated)]/50 py-12">
                <p className="mb-4">No tasks yet. Add one to get started.</p>
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="btn btn-primary"
                >
                  <Plus className="w-4 h-4" /> Add task
                </button>
              </li>
            )}
          </ul>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(["todo", "in_progress", "in_review", "done"] as const).map((status) => (
              <motion.div
                key={status}
                layout
                className="card card-elevated p-4 flex flex-col min-h-[200px] rounded-xl"
              >
                <h3 className="section-title mb-3 capitalize">
                  {status.replace("_", " ")}
                </h3>
                <ul className="space-y-2 flex-1">
                  {byStatus[status].map((t) => (
                    <motion.li
                      key={t.id}
                      layout
                      className="rounded-xl bg-[var(--color-background)]/80 border border-[var(--color-separator)] px-3 py-2.5 text-sm text-[var(--color-label)] hover:border-[var(--color-primary)]/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium">{t.title}</span>
                        <button
                          type="button"
                          onClick={() => deleteTask.mutate(t.id)}
                          className="text-[var(--color-secondary-label)] hover:text-[var(--color-danger)] p-1"
                          aria-label="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-[var(--color-secondary-label)]">
                        <span>{t.priority}</span>
                        <span>{formatLogged(t.loggedMinutes)}</span>
                      </div>
                    </motion.li>
                  ))}
                  {byStatus[status].length === 0 && (
                    <li className="text-xs text-[var(--color-secondary-label)] italic py-4">
                      Nothing in this column yet.
                    </li>
                  )}
                </ul>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AddTaskDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        projectId={projectId === "all" ? undefined : projectId}
        projects={projects}
      />
    </div>
  );
}
