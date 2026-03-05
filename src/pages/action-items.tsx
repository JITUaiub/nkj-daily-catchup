import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Plus,
  Check,
  Trash2,
  Calendar,
  Video,
  ChevronRight,
  ListTodo,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AddActionItemDialog } from "@/components/dialogs/add-action-item-dialog";

type ActionItem = {
  id: string;
  type: "task" | "follow_up";
  title: string;
  status: string;
  priority: string;
  dueAt: string | null;
  projectId?: string | null;
  meetingId: string | null;
  meeting?: { id: string; title: string; startAt: string; endAt: string };
  createdAt: string;
  completedAt?: string | null;
  loggedMinutes?: number;
};

type FilterMode = "all" | "today" | "from_meetings" | "active" | "done";

export function ActionItemsPage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("active");
  const [projectId, setProjectId] = useState<string | "all">(
    () => (localStorage.getItem("workday:actionItemsProjectId") as string | null) ?? "all"
  );
  const [logOpenFor, setLogOpenFor] = useState<string | null>(null);
  const [logHours, setLogHours] = useState("");
  const [logMinutes, setLogMinutes] = useState("");

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.projects.list(),
  });

  const {
    data: actionData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["action-items", filter, projectId],
    queryFn: () =>
      api.actionItems.list({
        filter,
        projectId: projectId === "all" ? undefined : projectId,
        dueToday: filter === "today",
      }),
  });

  const updateTaskStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.tasks.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-items"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const completeFollowUp = useMutation({
    mutationFn: (id: string) => api.followUps.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-items"] });
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => api.tasks.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-items"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const logTime = useMutation({
    mutationFn: ({ id, minutes }: { id: string; minutes: number }) =>
      api.tasks.logTime(id, minutes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-items"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setLogOpenFor(null);
      setLogHours("");
      setLogMinutes("");
    },
  });

  const tasks = actionData?.tasks ?? [];
  const followUps = actionData?.followUps ?? [];
  const allItems: ActionItem[] = [...tasks, ...followUps].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  useEffect(() => {
    if (projectId !== "all") {
      localStorage.setItem("workday:actionItemsProjectId", projectId);
    } else {
      localStorage.removeItem("workday:actionItemsProjectId");
    }
  }, [projectId]);

  const formatLogged = (minutes: number) => {
    if (!minutes || minutes <= 0) return "0m";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  };

  const handleLogSubmit = (taskId: string) => {
    const totalMinutes = Number(logHours || 0) * 60 + Number(logMinutes || 0);
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
              Action Items
            </h1>
            <p className="mt-1 text-sm text-[var(--color-secondary-label)]">
              Tasks and follow-ups from meetings, notes, and standalone. Navigate to source when linked.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="inline-flex items-center gap-1 rounded-full bg-[var(--color-background-elevated)] border border-[var(--color-separator)] p-0.5">
            {[
              { id: "active" as const, label: "Active" },
              { id: "all" as const, label: "All" },
              { id: "today" as const, label: "Today" },
              { id: "from_meetings" as const, label: "From meetings" },
              { id: "done" as const, label: "Done" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
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
            <span className="font-medium text-[var(--color-label)]">{selectedProject.name}</span>
          </div>
        )}

        {/* List */}
        {isError ? (
          <div className="empty-state rounded-xl border border-[var(--color-separator)] bg-[var(--color-card)]">
            <p className="mb-2">
              Couldn&apos;t load action items{" "}
              <span className="text-[var(--color-secondary-label)]">
                ({(error as Error).message})
              </span>
              .
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["action-items"] })}
            >
              Try again
            </button>
          </div>
        ) : isLoading ? (
          <div className="empty-state rounded-xl border border-[var(--color-separator)] bg-[var(--color-card)]">
            Loading action items…
          </div>
        ) : allItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="empty-state rounded-xl border-2 border-dashed border-[var(--color-separator)] bg-[var(--color-background-elevated)]/50 py-16"
          >
            <ListTodo className="w-14 h-14 text-[var(--color-primary)]/40 mx-auto mb-4" />
            <p className="font-medium text-[var(--color-label)] mb-1">No action items yet</p>
            <p className="text-sm text-[var(--color-secondary-label)] mb-6">
              Add one above, or promote from meetings and notes.
            </p>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" /> Add action item
            </button>
          </motion.div>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence mode="popLayout">
              {allItems.map((item) => (
                <ActionItemRow
                  key={`${item.type}-${item.id}`}
                  item={item}
                  isLogging={logOpenFor === item.id}
                  logHours={logHours}
                  logMinutes={logMinutes}
                  onLogHoursChange={setLogHours}
                  onLogMinutesChange={setLogMinutes}
                  onLogOpen={() => setLogOpenFor((c) => (c === item.id ? null : item.id))}
                  onLogSubmit={() => item.type === "task" && handleLogSubmit(item.id)}
                  onLogCancel={() => {
                    setLogOpenFor(null);
                    setLogHours("");
                    setLogMinutes("");
                  }}
                  onStatusChange={
                    item.type === "task"
                      ? (status) => updateTaskStatus.mutate({ id: item.id, status })
                      : undefined
                  }
                  onComplete={
                    item.type === "follow_up"
                      ? () => completeFollowUp.mutate(item.id)
                      : undefined
                  }
                  onDelete={
                    item.type === "task"
                      ? () => deleteTask.mutate(item.id)
                      : undefined
                  }
                  formatLogged={formatLogged}
                  isLogPending={logTime.isPending}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <AddActionItemDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        projectId={projectId === "all" ? undefined : projectId}
        projects={projects}
      />
    </div>
  );
}

function ActionItemRow({
  item,
  isLogging,
  logHours,
  logMinutes,
  onLogHoursChange,
  onLogMinutesChange,
  onLogOpen,
  onLogSubmit,
  onLogCancel,
  onStatusChange,
  onComplete,
  onDelete,
  formatLogged,
  isLogPending,
}: {
  item: ActionItem;
  isLogging: boolean;
  logHours: string;
  logMinutes: string;
  onLogHoursChange: (v: string) => void;
  onLogMinutesChange: (v: string) => void;
  onLogOpen: () => void;
  onLogSubmit: () => void;
  onLogCancel: () => void;
  onStatusChange?: (status: string) => void;
  onComplete?: () => void;
  onDelete?: () => void;
  formatLogged: (m: number) => string;
  isLogPending: boolean;
}) {
  const isDone = item.status === "done" || !!item.completedAt;
  const isTask = item.type === "task";

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={cn(
        "list-item group flex-col gap-1 rounded-xl",
        isDone && "opacity-75"
      )}
    >
      <div className="flex items-center gap-3 w-full">
        {isTask && onStatusChange ? (
          <select
            value={item.status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="select shrink-0 w-[7.5rem]"
          >
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="in_review">In review</option>
            <option value="done">Done</option>
          </select>
        ) : item.type === "follow_up" && onComplete ? (
          <button
            type="button"
            onClick={onComplete}
            className={cn(
              "w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-colors focus-ring",
              isDone
                ? "bg-[var(--color-success)]/20 border-[var(--color-success)]/40 text-[var(--color-success)]"
                : "border-[var(--color-separator)] text-[var(--color-secondary-label)] hover:bg-[var(--color-fill)] hover:text-[var(--color-success)] hover:border-[var(--color-success)]/40"
            )}
          >
            <Check className="w-4 h-4" />
          </button>
        ) : null}

        <span
          className={cn(
            "flex-1 font-medium",
            isDone && "line-through text-[var(--color-secondary-label)]"
          )}
        >
          {item.title}
        </span>

        <span className="badge badge-neutral shrink-0">{item.priority}</span>

        {item.meeting && (
          <Link
            to="/meetings"
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors shrink-0"
          >
            <Video className="w-3 h-3" />
            {item.meeting.title}
            <ChevronRight className="w-3 h-3" />
          </Link>
        )}

        <div className="flex items-center gap-2 shrink-0 text-[11px] text-[var(--color-secondary-label)]">
          {item.dueAt && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(item.dueAt), "MMM d")}
            </span>
          )}
          {isTask && (item.loggedMinutes ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatLogged(item.loggedMinutes ?? 0)}
            </span>
          )}
          {isTask && (
            <button
              type="button"
              onClick={onLogOpen}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--color-separator)] text-[var(--color-label)] hover:bg-[var(--color-background-elevated)] transition-colors"
            >
              <Clock className="w-3 h-3" />
              Log
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg text-[var(--color-secondary-label)] hover:text-[var(--color-danger)] hover:bg-red-500/10 transition-colors"
              aria-label="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isLogging && isTask && (
        <div className="w-full pl-12 pb-1">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-[var(--color-secondary-label)]">Add</span>
            <input
              type="number"
              min={0}
              value={logHours}
              onChange={(e) => onLogHoursChange(e.target.value)}
              placeholder="0"
              className="input input-ghost w-12 h-7 text-xs"
              aria-label="Hours"
            />
            <span className="text-[var(--color-secondary-label)]">h</span>
            <input
              type="number"
              min={0}
              value={logMinutes}
              onChange={(e) => onLogMinutesChange(e.target.value)}
              placeholder="30"
              className="input input-ghost w-12 h-7 text-xs"
              aria-label="Minutes"
            />
            <span className="text-[var(--color-secondary-label)]">m</span>
            <button
              type="button"
              onClick={onLogSubmit}
              className="btn btn-primary btn-xs"
              disabled={isLogPending}
            >
              Save
            </button>
            <button type="button" onClick={onLogCancel} className="btn btn-ghost btn-xs">
              Cancel
            </button>
          </div>
        </div>
      )}
    </motion.li>
  );
}
