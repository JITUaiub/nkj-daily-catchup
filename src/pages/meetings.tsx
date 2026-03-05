import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, RefreshCw, Link2, Unlink } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const API_BASE =
  typeof import.meta.env !== "undefined" && import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
    : typeof import.meta.env !== "undefined" && import.meta.env.DEV
      ? "http://localhost:3001"
      : "";

export function MeetingsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const { data: todayData } = useQuery({
    queryKey: ["meetings", "today-with-google"],
    queryFn: () => api.meetings.getTodayWithGoogle(),
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
  const createMutation = useMutation({
    mutationFn: () =>
      api.meetings.create({
        title,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setTitle("");
      setStartAt("");
      setEndAt("");
      setShowForm(false);
    },
  });

  const meetings = todayData?.meetings ?? [];
  const googleConnected =
    googleStatus?.googleConnected ?? todayData?.googleConnected ?? false;

  return (
    <div className="page">
      <div className="page-content-wide">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-semibold text-[var(--color-label)] tracking-tight">
            Meetings
          </h1>
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
              onClick={() => setShowForm(!showForm)}
              className="btn btn-ghost btn-sm"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>

        {showForm && (
          <motion.div
            className="card card-elevated p-5 mb-6"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <input
              type="text"
              placeholder="Meeting title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input mb-3"
            />
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="input flex-1"
              />
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="input flex-1"
              />
            </div>
            <button
              type="button"
              onClick={() =>
                title.trim() && startAt && endAt && createMutation.mutate()
              }
              className="btn btn-primary"
            >
              Create
            </button>
          </motion.div>
        )}

        <section>
          <h2 className="section-title">Today</h2>
          <ul className="space-y-2">
            {meetings.map((m) => (
              <motion.li
                key={m.id}
                layout
                className="list-item flex-wrap gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--color-label)]">
                    {m.title}
                  </p>
                  <p className="text-sm text-[var(--color-secondary-label)]">
                    {format(new Date(m.startAt), "h:mm a")} –{" "}
                    {format(new Date(m.endAt), "h:mm a")}
                    {m.source === "google" && " · Google Calendar"}
                  </p>
                </div>
                <span
                  className={cn(
                    "badge shrink-0",
                    m.status === "active" && "badge-success",
                    m.status === "cancelled" && "badge-danger",
                    m.status === "dormant" && "badge-neutral"
                  )}
                >
                  {m.status}
                </span>
              </motion.li>
            ))}
            {meetings.length === 0 && (
              <li className="empty-state">
                No meetings today. Add one or connect Google Calendar.
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
