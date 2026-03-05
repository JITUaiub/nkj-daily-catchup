import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Sparkles,
  Loader2,
  CheckSquare,
  ListTodo,
  Video,
  Clock,
  Users,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { EditProjectDialog } from "@/components/dialogs/edit-project-dialog";
import { AddTaskDialog } from "@/components/dialogs/add-task-dialog";
import { Modal } from "@/components/ui/modal";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { data: project, isLoading, isError, error } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.projects.get(id!),
    enabled: !!id,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", "project", id],
    queryFn: () => api.tasks.list({ projectId: id }),
    enabled: !!id,
  });

  const { data: actionData } = useQuery({
    queryKey: ["action-items", "project", id],
    queryFn: () => api.actionItems.list({ filter: "all", projectId: id }),
    enabled: !!id,
  });

  const summaryMutation = useMutation({
    mutationFn: () => api.projects.generateSummary(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-summary", id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.projects.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate("/projects");
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      api.tasks.updateStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project", id] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: (taskId: string) => api.tasks.remove(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["action-items"] });
    },
  });

  const tasksFromMeetings = actionData?.tasks?.filter((t) => t.meetingId) ?? [];
  const totalLogged = tasks.reduce((s, t) => s + (t.loggedMinutes ?? 0), 0);
  const byStatus = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
  for (const t of tasks) {
    if (t.status in byStatus) (byStatus as Record<string, number>)[t.status]++;
  }

  const formatLogged = (minutes: number) => {
    if (!minutes || minutes <= 0) return "0m";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  };

  if (!id) return null;
  if (isLoading || !project) {
    return (
      <div className="page">
        <div className="page-content-wide">
          <div className="empty-state">Loading project…</div>
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="page">
        <div className="page-content-wide">
          <div className="empty-state">
            <p className="mb-2">{(error as Error).message}</p>
            <Link to="/projects" className="btn btn-secondary btn-sm">
              Back to projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalHours = project.resources.reduce((s, r) => s + (r.allocationHours ?? 0), 0);

  return (
    <div className="page">
      <div className="page-content-wide">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/projects"
            className="p-2 -m-2 rounded-lg text-[var(--color-secondary-label)] hover:bg-[var(--color-fill)] hover:text-[var(--color-label)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div
            className="w-12 h-12 rounded-xl shrink-0 border border-[var(--color-background)]"
            style={{ backgroundColor: `${project.color}30` }}
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-[var(--color-label)] truncate">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-sm text-[var(--color-secondary-label)] mt-0.5 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="btn btn-ghost btn-sm"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(true)}
              className="btn btn-ghost btn-sm text-[var(--color-danger)] hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>

        {/* AI Summary */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card card-elevated p-5 rounded-xl mb-6"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="section-title flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
              AI Progress Summary
            </h2>
            <button
              type="button"
              onClick={() => summaryMutation.mutate()}
              disabled={summaryMutation.isPending}
              className="btn btn-ghost btn-sm"
            >
              {summaryMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {summaryMutation.isPending ? "Generating…" : "Generate"}
            </button>
          </div>
          {summaryMutation.data?.summary ? (
            <div
              className="text-sm text-[var(--color-label)] whitespace-pre-wrap leading-relaxed"
              style={{ fontFamily: "inherit" }}
            >
              {summaryMutation.data.summary}
            </div>
          ) : summaryMutation.isError ? (
            <p className="text-sm text-[var(--color-danger)]">
              {(summaryMutation.error as Error).message}
            </p>
          ) : (
            <p className="text-sm text-[var(--color-secondary-label)]">
              Click Generate to create an AI summary of project progress based on tasks and status.
            </p>
          )}
        </motion.section>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="card card-elevated p-4 rounded-xl">
            <p className="text-[11px] font-medium text-[var(--color-secondary-label)] uppercase tracking-wide">
              Tasks
            </p>
            <p className="text-xl font-semibold text-[var(--color-label)]">{tasks.length}</p>
            <p className="text-xs text-[var(--color-secondary-label)]">
              {byStatus.done} done · {byStatus.in_progress} in progress
            </p>
          </div>
          <div className="card card-elevated p-4 rounded-xl">
            <p className="text-[11px] font-medium text-[var(--color-secondary-label)] uppercase tracking-wide">
              Time logged
            </p>
            <p className="text-xl font-semibold text-[var(--color-label)]">
              {formatLogged(totalLogged)}
            </p>
          </div>
          <div className="card card-elevated p-4 rounded-xl">
            <p className="text-[11px] font-medium text-[var(--color-secondary-label)] uppercase tracking-wide">
              From meetings
            </p>
            <p className="text-xl font-semibold text-[var(--color-label)]">
              {tasksFromMeetings.length}
            </p>
          </div>
          <div className="card card-elevated p-4 rounded-xl">
            <p className="text-[11px] font-medium text-[var(--color-secondary-label)] uppercase tracking-wide">
              Capacity
            </p>
            <p className="text-xl font-semibold text-[var(--color-label)]">{totalHours}h</p>
            <p className="text-xs text-[var(--color-secondary-label)]">allocated</p>
          </div>
        </div>

        {/* Team */}
        {project.resources.length > 0 && (
          <section className="mb-6">
            <h2 className="section-title flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team
            </h2>
            <ul className="flex flex-wrap gap-2">
              {project.resources.map((r) => (
                <li
                  key={r.id}
                  className="px-3 py-1.5 rounded-xl bg-[var(--color-fill)] text-sm text-[var(--color-label)]"
                >
                  {r.name}
                  {r.designation && (
                    <span className="text-[var(--color-secondary-label)]"> · {r.designation}</span>
                  )}
                  <span className="text-[var(--color-secondary-label)]"> ({r.allocationHours}h)</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Tasks */}
        <section>
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="section-title flex items-center gap-2 mb-0">
              <CheckSquare className="w-4 h-4" />
              Tasks
            </h2>
            <button
              type="button"
              onClick={() => setAddTaskOpen(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus className="w-4 h-4" /> Add task
            </button>
          </div>
          {tasksLoading ? (
            <div className="empty-state">Loading tasks…</div>
          ) : tasks.length === 0 ? (
            <div className="empty-state rounded-xl border-2 border-dashed border-[var(--color-separator)] py-8">
              No tasks in this project yet.
            </div>
          ) : (
            <ul className="space-y-2">
              {tasks.map((t) => (
                <motion.li
                  key={t.id}
                  layout
                  className="list-item rounded-xl flex items-center gap-3"
                >
                  <select
                    value={t.status}
                    onChange={(e) => updateStatus.mutate({ taskId: t.id, status: e.target.value })}
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
                      t.status === "done" && "line-through text-[var(--color-secondary-label)]"
                    )}
                  >
                    {t.title}
                  </span>
                  <span className="badge badge-neutral shrink-0">{t.priority}</span>
                  <span className="text-[11px] text-[var(--color-secondary-label)] flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatLogged(t.loggedMinutes ?? 0)}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteTask.mutate(t.id)}
                    className="p-1.5 rounded-lg text-[var(--color-secondary-label)] hover:text-[var(--color-danger)] hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.li>
              ))}
            </ul>
          )}
        </section>

        {/* Action items from meetings */}
        {tasksFromMeetings.length > 0 && (
          <section className="mt-8">
            <h2 className="section-title flex items-center gap-2">
              <ListTodo className="w-4 h-4" />
              Action items from meetings
            </h2>
            <ul className="space-y-2">
              {tasksFromMeetings.map((item) => (
                <li
                  key={item.id}
                  className="list-item rounded-xl flex items-center gap-3"
                >
                  <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                    <Video className="w-3 h-3" />
                    From meeting
                  </span>
                  <span className="flex-1 font-medium">{item.title}</span>
                  <span className="badge badge-neutral">{item.priority}</span>
                  <Link
                    to="/meetings"
                    className="text-xs text-[var(--color-primary)] hover:underline"
                  >
                    View meeting
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <EditProjectDialog open={editOpen} onOpenChange={setEditOpen} project={project} />
      <AddTaskDialog
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
        projectId={id}
        projects={project ? [project] : []}
      />

      <Modal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete project"
        size="sm"
      >
        <p className="text-sm text-[var(--color-secondary-label)] mb-4">
          Are you sure you want to delete &quot;{project.name}&quot;? Tasks will be unassigned but
          not deleted.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteConfirmOpen(false)}
            className="btn btn-ghost"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="btn btn-danger"
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
