"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar, Plus, Video, Link2, RefreshCw, Unlink, Loader2, Filter } from "lucide-react";
import { signIn } from "next-auth/react";
import { trpc } from "@/lib/trpc/react";
import { AddMeetingDialog } from "./add-meeting-dialog";
import { MeetingCard } from "./meeting-card";

type Tab = "daily" | "weekly";

export function MeetingsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("daily");
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [includeDormant, setIncludeDormant] = useState(false);

  const filterInput = { includeCancelled, includeDormant };

  const { data: connectionStatus, refetch: refetchConnection } = trpc.meeting.getGoogleConnectionStatus.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const googleConnected = connectionStatus?.googleConnected ?? false;
  const connectedEmail = connectionStatus?.connectedEmail ?? null;

  const { data: dailyData, isLoading: dailyLoading, refetch: refetchDaily, isRefetching: dailyRefetching } =
    trpc.meeting.getTodayWithGoogle.useQuery(filterInput, { refetchOnWindowFocus: false });

  const { data: weekData, isLoading: weekLoading, refetch: refetchWeek, isRefetching: weekRefetching } =
    trpc.meeting.getWeekWithGoogle.useQuery(filterInput, { refetchOnWindowFocus: false });

  const utils = trpc.useUtils();
  const syncGoogle = trpc.meeting.syncGoogle.useMutation({
    onSuccess: () => {
      utils.meeting.getTodayWithGoogle.invalidate();
      utils.meeting.getWeekWithGoogle.invalidate();
    },
  });
  const disconnect = trpc.meeting.disconnectGoogle.useMutation({
    onSuccess: () => {
      void refetchConnection();
      utils.meeting.getGoogleConnectionStatus.invalidate();
      utils.meeting.getTodayWithGoogle.invalidate();
      utils.meeting.getWeekWithGoogle.invalidate();
    },
  });

  const dailyMeetings = dailyData?.meetings ?? [];
  const isSyncing = syncGoogle.isPending || dailyRefetching || (tab === "weekly" && weekRefetching);

  const meetingsByDay = weekData?.meetingsByDay ?? [];
  const sevenDays = (() => {
    if (meetingsByDay.length >= 7) return meetingsByDay;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const out: { date: string; meetings: typeof dailyMeetings }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const existing = meetingsByDay.find((x) => x.date === dateKey);
      out.push(existing ?? { date: dateKey, meetings: [] });
    }
    return out.sort((a, b) => a.date.localeCompare(b.date));
  })();

  const handleConnect = () => {
    const callbackUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/meetings`
        : "/meetings";
    signIn("google", { callbackUrl });
  };
  const handleDisconnect = () => disconnect.mutate();
  const handleReload = async () => {
    if (googleConnected) {
      await syncGoogle.mutateAsync();
    }
    refetchDaily();
    refetchWeek();
  };

  // After OAuth redirect, refetch connection status so UI shows "connected"
  useEffect(() => {
    void refetchConnection();
  }, []);

  return (
    <div className="min-h-full bg-surface-light dark:bg-surface-dark">
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Header */}
        <header className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h1 className="font-display font-semibold text-2xl">Meetings</h1>
          <div className="flex items-center gap-2 flex-wrap">
            {googleConnected ? (
              <>
                <button
                  type="button"
                  onClick={handleReload}
                  disabled={isSyncing}
                  title="Sync from Google Calendar"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-button bg-white dark:bg-apple-gray-5 border border-apple-gray-5/50 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 focus-ring disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                  Reload
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnect.isLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-button bg-white dark:bg-apple-gray-5 border border-red-400/40 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 focus-ring disabled:opacity-50"
                >
                  {disconnect.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unlink className="w-4 h-4" />
                  )}
                  Disconnect
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                className="flex items-center gap-2 px-4 py-2 rounded-button bg-white dark:bg-apple-gray-5 border border-apple-gray-5/50 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 focus-ring"
              >
                <Calendar className="w-4 h-4 text-apple-blue" />
                Connect Google Calendar
              </button>
            )}

            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-button bg-apple-blue text-white text-sm font-medium hover:opacity-90 focus-ring"
            >
              <Plus className="w-4 h-4" /> Add meeting
            </button>
          </div>
        </header>

        {googleConnected && connectedEmail && (
          <div className="mb-5 flex items-center gap-2 px-4 py-2.5 rounded-button bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300">
            <Link2 className="w-4 h-4 shrink-0" />
            <span>Synced with Google Calendar as <strong>{connectedEmail}</strong></span>
          </div>
        )}

        {/* Tabs: Daily (default), Weekly */}
        <div className="flex gap-1 mb-2 border-b border-apple-gray-5/30">
          <button
            type="button"
            onClick={() => setTab("daily")}
            className={`px-4 py-2 text-sm font-medium rounded-t-button focus-ring ${
              tab === "daily"
                ? "bg-background-light dark:bg-background-dark border border-apple-gray-5/20 border-b-transparent -mb-px text-apple-gray-1"
                : "text-apple-gray-2 hover:text-apple-gray-1"
            }`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => setTab("weekly")}
            className={`px-4 py-2 text-sm font-medium rounded-t-button focus-ring ${
              tab === "weekly"
                ? "bg-background-light dark:bg-background-dark border border-apple-gray-5/20 border-b-transparent -mb-px text-apple-gray-1"
                : "text-apple-gray-2 hover:text-apple-gray-1"
            }`}
          >
            Weekly
          </button>
        </div>

        {/* Status filters: show cancelled / dormant */}
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 text-apple-gray-2">
            <Filter className="w-4 h-4" />
            Show:
          </span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCancelled}
              onChange={(e) => setIncludeCancelled(e.target.checked)}
              className="rounded border-apple-gray-5/50 text-apple-blue focus:ring-apple-blue"
            />
            <span className="text-apple-gray-1">Cancelled</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeDormant}
              onChange={(e) => setIncludeDormant(e.target.checked)}
              className="rounded border-apple-gray-5/50 text-apple-blue focus:ring-apple-blue"
            />
            <span className="text-apple-gray-1">Dormant</span>
          </label>
        </div>

        {/* Daily view */}
        {tab === "daily" && (
          <section className="rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 overflow-hidden">
            <div className="px-4 py-3 border-b border-apple-gray-5/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-apple-gray-1" />
                <h2 className="font-semibold text-base">Today — {format(new Date(), "EEEE, MMM d")}</h2>
              </div>
              {isSyncing && (
                <span className="text-xs text-apple-gray-2 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Syncing…
                </span>
              )}
            </div>
            {dailyLoading ? (
              <div className="p-8 text-center text-apple-gray-2 text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : dailyMeetings.length === 0 ? (
              <div className="p-8 text-center text-apple-gray-2 text-sm">
                No meetings today.
                {!googleConnected
                  ? " Connect Google Calendar to see your events, or add one manually."
                  : " You're free! Add one manually if needed."}
              </div>
            ) : (
              <ul className="divide-y divide-apple-gray-5/20">
                {dailyMeetings.map((m) => (
                  <MeetingCard key={`${m.source}-${m.id}`} meeting={m} />
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Weekly view: 7 days */}
        {tab === "weekly" && (
          <section className="rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 overflow-hidden">
            <div className="px-4 py-3 border-b border-apple-gray-5/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-apple-gray-1" />
                <h2 className="font-semibold text-base">7 days</h2>
              </div>
              {isSyncing && (
                <span className="text-xs text-apple-gray-2 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Syncing…
                </span>
              )}
            </div>
            {weekLoading ? (
              <div className="p-8 text-center text-apple-gray-2 text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : (
              <>
                {googleConnected &&
                  sevenDays.every((d) => d.meetings.length === 0) && (
                    <p className="px-4 py-2 text-sm text-apple-gray-2">
                      No meetings this week. Click <strong>Reload</strong> to sync from Google Calendar.
                    </p>
                  )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 p-4 overflow-x-auto">
                {sevenDays.map(({ date, meetings: dayMeetings }) => {
                  const [y, m, d] = date.split("-").map(Number);
                  const dayDate = new Date(y, m - 1, d);
                  return (
                    <div
                      key={date}
                      className="min-w-[180px] rounded-button border border-apple-gray-5/20 bg-surface-light dark:bg-surface-dark p-3 flex flex-col"
                    >
                      <h3 className="text-sm font-medium text-apple-gray-2 mb-2 shrink-0">
                        {format(dayDate, "EEE, MMM d")}
                      </h3>
                      <div className="flex-1 min-h-0 overflow-y-auto">
                        {dayMeetings.length === 0 ? (
                          <p className="text-xs text-apple-gray-2">No meetings</p>
                        ) : (
                          <ul className="space-y-2">
                            {dayMeetings.map((m) => (
                              <MeetingCard key={`${m.source}-${m.id}`} meeting={m} />
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              </>
            )}
          </section>
        )}
      </div>

      <AddMeetingDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
