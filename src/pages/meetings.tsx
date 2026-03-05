import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Plus,
  RefreshCw,
  Link2,
  Unlink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Video,
  ListTodo,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AddMeetingDialog } from "@/components/dialogs/add-meeting-dialog";

const API_BASE =
  typeof import.meta.env !== "undefined" && import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
    : typeof import.meta.env !== "undefined" && import.meta.env.DEV
      ? "http://localhost:3001"
      : "";

export function MeetingsPage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: todayData } = useQuery({
    queryKey: ["meetings", "today-with-google"],
    queryFn: () => api.meetings.getTodayWithGoogle({ includeCancelled: true, includeDormant: true }),
  });
  const { data: googleStatus } = useQuery({
    queryKey: ["meetings", "google-status"],
    queryFn: () => api.meetings.getGoogleStatus(),
  });

  const syncMutation = useMutation({
    mutationFn: () => api.meetings.syncGoogle(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["meetings"] }),
  });
  const disconnectMutation = useMutation({
    mutationFn: () => api.meetings.disconnectGoogle(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["meetings"] }),
  });

  const meetings = todayData?.meetings ?? [];
  const googleConnected =
    googleStatus?.googleConnected ?? todayData?.googleConnected ?? false;

  return (
    <div className="page">
      <div className="page-content-wide">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-label)] tracking-tight">
              Meetings
            </h1>
            <p className="mt-1 text-sm text-[var(--color-secondary-label)]">
              Today&apos;s schedule. Prepare, take notes, and promote action items.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {googleConnected ? (
              <>
                <button
                  type="button"
                  onClick={() => syncMutation.mutate()}
                  className="btn btn-ghost btn-sm"
                >
                  <RefreshCw className="w-4 h-4" /> Sync
                </button>
                <button
                  type="button"
                  onClick={() => disconnectMutation.mutate()}
                  className="btn btn-ghost btn-sm text-[var(--color-secondary-label)]"
                >
                  <Unlink className="w-4 h-4" /> Disconnect
                </button>
              </>
            ) : (
              <a
                href={`${API_BASE}/api/auth/google`}
                className="btn btn-primary btn-sm"
              >
                <Link2 className="w-4 h-4" /> Connect Google Calendar
              </a>
            )}
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus className="w-4 h-4" /> Add meeting
            </button>
          </div>
        </div>

        <section>
          <h2 className="section-title">Today</h2>
          <ul className="space-y-3">
            {meetings.map((m) => {
              const start = new Date(m.startAt);
              const end = new Date(m.endAt);
              const key = `${m.source}-${m.id}`;
              const isGoogle = m.source === "google";
              const status = m.status;
              const statusLabel =
                status === "completed"
                  ? "Completed"
                  : status === "cancelled"
                    ? "Cancelled"
                    : status === "dormant"
                      ? "Dormant"
                      : "Upcoming";

              return (
                <MeetingItem
                  key={key}
                  id={m.id}
                  title={m.title}
                  startAt={start}
                  endAt={end}
                  location={m.location}
                  link={m.link}
                  prepNotes={m.prepNotes}
                  meetingNotes={m.meetingNotes}
                  actionItems={m.actionItems}
                  source={isGoogle ? "google" : "manual"}
                  status={status}
                  statusLabel={statusLabel}
                />
              );
            })}
            {meetings.length === 0 && (
              <li className="empty-state rounded-xl border-2 border-dashed border-[var(--color-separator)] bg-[var(--color-background-elevated)]/50 py-12">
                No meetings today. Add one or connect Google Calendar.
              </li>
            )}
          </ul>
        </section>
      </div>

      <AddMeetingDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

type MeetingItemProps = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  location: string | null;
  link: string | null;
  prepNotes: string | null;
  meetingNotes: string | null;
  actionItems: string | null;
  source: "manual" | "google";
  status?: string;
  statusLabel: string;
};

function MeetingItem({
  id,
  title,
  startAt,
  endAt,
  location,
  link,
  prepNotes,
  meetingNotes,
  actionItems,
  source,
  status,
  statusLabel,
}: MeetingItemProps) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [prep, setPrep] = useState(prepNotes ?? "");
  const [notes, setNotes] = useState(meetingNotes ?? "");
  const [actions, setActions] = useState(actionItems ?? "");
  const [promoteAsTasks, setPromoteAsTasks] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (body: { prepNotes?: string; meetingNotes?: string; actionItems?: string }) =>
      api.meetings.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });

  const prepAiMutation = useMutation({
    mutationFn: () => api.meetings.generatePrep(id, { extraContext: notes || actions }),
    onSuccess: (res) => {
      setPrep(res.suggestion);
    },
  });

  const actionsAiMutation = useMutation({
    mutationFn: () => api.meetings.generateActionItems(id, { transcript: notes, notes: prep }),
    onSuccess: (res) => {
      setActions(res.suggestion);
    },
  });

  const promoteMutation = useMutation({
    mutationFn: () =>
      api.actionItems.promoteFromMeeting(id, {
        actionItemsText: actions,
        asTasks: promoteAsTasks,
      }),
    onSuccess: (res) => {
      if (res.created > 0) {
        queryClient.invalidateQueries({ queryKey: ["action-items"] });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      }
    },
  });

  const isGoogle = source === "google";
  const isCancelled = status === "cancelled";
  const isDormant = status === "dormant";
  const isCompleted = status === "completed";

  const saveField = (field: "prepNotes" | "meetingNotes" | "actionItems", value: string) => {
    updateMutation.mutate({ [field]: value || undefined });
  };

  return (
    <motion.li
      layout
      className={cn(
        "card card-elevated p-4 flex flex-col gap-2 rounded-xl",
        isCancelled && "opacity-75",
        isDormant && "opacity-80"
      )}
    >
      <div className="flex items-start gap-3 flex-wrap">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            isGoogle ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
            isCancelled && "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
            isDormant && "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
            isCompleted && "bg-[var(--color-secondary-label)]/10 text-[var(--color-secondary-label)]"
          )}
        >
          <Video className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-[var(--color-label)] truncate">{title}</p>
            {isGoogle && (
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-medium">
                Google
              </span>
            )}
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-lg font-medium",
                isCompleted && "bg-[var(--color-secondary-label)]/10 text-[var(--color-secondary-label)]",
                !isCompleted &&
                  status === "active" &&
                  "bg-[var(--color-success)]/10 text-[var(--color-success)]",
                status === "cancelled" && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
                status === "dormant" && "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              )}
            >
              {statusLabel}
            </span>
          </div>
          <p className="text-xs text-[var(--color-secondary-label)] mt-0.5">
            {format(startAt, "h:mm a")} – {format(endAt, "h:mm a")}
            {location && ` · ${location}`}
          </p>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline mt-1"
            >
              <Link2 className="w-3 h-3" /> Open in calendar
            </a>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="ml-auto text-xs text-[var(--color-secondary-label)] hover:text-[var(--color-label)] flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[var(--color-fill)] transition-colors"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Details
        </button>
      </div>

      {expanded && (
        <div className="pt-3 mt-2 border-t border-[var(--color-separator)] space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="text-xs font-medium text-[var(--color-secondary-label)]">
                Preparation
              </label>
              <button
                type="button"
                onClick={() => prepAiMutation.mutate()}
                disabled={prepAiMutation.isPending}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg border border-[var(--color-separator)] text-[var(--color-secondary-label)] hover:text-[var(--color-label)]"
              >
                {prepAiMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                AI
              </button>
            </div>
            <textarea
              value={prep}
              onChange={(e) => setPrep(e.target.value)}
              onBlur={() => {
                if (prep !== (prepNotes ?? "")) saveField("prepNotes", prep);
              }}
              rows={2}
              placeholder="Talking points, questions, goals…"
              className="input min-h-[60px] resize-none rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-secondary-label)] mb-1">
              Transcript / notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                if (notes !== (meetingNotes ?? "")) saveField("meetingNotes", notes);
              }}
              rows={3}
              placeholder="Paste transcript or jot notes…"
              className="input min-h-[80px] resize-none rounded-xl"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="text-xs font-medium text-[var(--color-secondary-label)]">
                Action items
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => actionsAiMutation.mutate()}
                  disabled={actionsAiMutation.isPending}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg border border-[var(--color-separator)] text-[var(--color-secondary-label)] hover:text-[var(--color-label)]"
                >
                  {actionsAiMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  AI
                </button>
                <button
                  type="button"
                  onClick={() => promoteMutation.mutate()}
                  disabled={!actions.trim() || promoteMutation.isPending}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/25 font-medium disabled:opacity-50"
                >
                  {promoteMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <ListTodo className="w-3 h-3" />
                  )}
                  Promote to Action Items
                </button>
              </div>
            </div>
            <textarea
              value={actions}
              onChange={(e) => setActions(e.target.value)}
              onBlur={() => {
                if (actions !== (actionItems ?? "")) saveField("actionItems", actions);
              }}
              rows={2}
              placeholder="Action items (one per line or bullet)…"
              className="input min-h-[60px] resize-none rounded-xl"
            />
            {actions.trim() && (
              <label className="mt-2 flex items-center gap-2 text-[11px] text-[var(--color-secondary-label)]">
                <input
                  type="checkbox"
                  checked={promoteAsTasks}
                  onChange={(e) => setPromoteAsTasks(e.target.checked)}
                  className="rounded border-[var(--color-separator)]"
                />
                Create as tasks (with status) instead of follow-ups
              </label>
            )}
          </div>

          {(updateMutation.isPending || prepAiMutation.isPending || actionsAiMutation.isPending || promoteMutation.isPending) && (
            <p className="text-[10px] text-[var(--color-secondary-label)] flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Working…
            </p>
          )}
        </div>
      )}
    </motion.li>
  );
}
