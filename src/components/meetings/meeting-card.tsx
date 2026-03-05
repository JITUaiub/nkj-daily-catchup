"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Video, Link2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/react";

type Meeting = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  location: string | null;
  link: string | null;
  prepNotes: string | null;
  takePreparation: string | null;
  meetingNotes: string | null;
  actionItems: string | null;
  source: "manual" | "google";
  status?: string;
};

export function MeetingCard({ meeting }: { meeting: Meeting }) {
  const [expanded, setExpanded] = useState(false);
  const [takePreparation, setTakePreparation] = useState(meeting.takePreparation ?? "");
  const [meetingNotes, setMeetingNotes] = useState(meeting.meetingNotes ?? "");
  const [actionItems, setActionItems] = useState(meeting.actionItems ?? "");

  useEffect(() => {
    setTakePreparation(meeting.takePreparation ?? "");
    setMeetingNotes(meeting.meetingNotes ?? "");
    setActionItems(meeting.actionItems ?? "");
  }, [meeting.id, meeting.takePreparation, meeting.meetingNotes, meeting.actionItems]);

  const utils = trpc.useUtils();
  const update = trpc.meeting.update.useMutation({
    onSuccess: () => {
      utils.meeting.getTodayWithGoogle.invalidate();
      utils.meeting.getWeekWithGoogle.invalidate();
    },
  });

  const hasDetails =
    (meeting.prepNotes ?? "") !== "" ||
    (meeting.takePreparation ?? "") !== "" ||
    (meeting.meetingNotes ?? "") !== "" ||
    (meeting.actionItems ?? "") !== "" ||
    meeting.link;

  const save = (field: "takePreparation" | "meetingNotes" | "actionItems", value: string) => {
    update.mutate({ id: meeting.id, [field]: value || undefined });
  };

  const isCancelled = meeting.status === "cancelled";
  const isDormant = meeting.status === "dormant";

  return (
    <li
      className={`flex items-start gap-3 px-4 py-3 ${isCancelled || isDormant ? "opacity-75" : ""}`}
    >
      <div
        className={`w-10 h-10 rounded-button flex items-center justify-center shrink-0 mt-0.5 ${
          meeting.source === "google" ? "bg-green-50 dark:bg-green-900/20" : "bg-apple-blue/10"
        } ${isCancelled ? "bg-red-50 dark:bg-red-900/20" : ""} ${isDormant ? "bg-amber-50 dark:bg-amber-900/20" : ""}`}
      >
        <Video
          className={`w-5 h-5 ${meeting.source === "google" ? "text-green-600 dark:text-green-400" : "text-apple-blue"} ${isCancelled ? "text-red-600 dark:text-red-400" : ""} ${isDormant ? "text-amber-600 dark:text-amber-400" : ""}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium flex items-center gap-2 flex-wrap">
          {meeting.title}
          {meeting.source === "google" && (
            <span className="text-xs font-normal text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
              Google
            </span>
          )}
          {isCancelled && (
            <span className="text-xs font-normal text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
              Cancelled
            </span>
          )}
          {isDormant && (
            <span className="text-xs font-normal text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
              Dormant
            </span>
          )}
        </p>
        <p className="text-xs text-apple-gray-1 mt-0.5">
          {format(new Date(meeting.startAt), "h:mm a")} – {format(new Date(meeting.endAt), "h:mm a")}
          {meeting.location && ` · ${meeting.location}`}
        </p>
        {meeting.prepNotes && (
          <p className="text-sm text-apple-gray-2 mt-1">{meeting.prepNotes}</p>
        )}
        {meeting.link && (
          <a
            href={meeting.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-apple-blue hover:underline mt-1 inline-flex items-center gap-1"
          >
            <Link2 className="w-3 h-3" /> Open in Google Calendar
          </a>
        )}

        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 flex items-center gap-1 text-xs text-apple-gray-2 hover:text-apple-gray-1"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? "Hide" : "Preparation & notes"}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3 pt-3 border-t border-apple-gray-5/20">
            <div>
              <label className="block text-xs font-medium text-apple-gray-2 mb-1">
                Take preparation (where)
              </label>
              <textarea
                value={takePreparation}
                onChange={(e) => setTakePreparation(e.target.value)}
                onBlur={() => {
                  if (takePreparation !== (meeting.takePreparation ?? "")) save("takePreparation", takePreparation);
                }}
                rows={2}
                placeholder="Where you'll take preparation…"
                className="w-full px-3 py-2 rounded-button bg-surface-light dark:bg-surface-dark border border-apple-gray-5/30 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-apple-gray-2 mb-1">
                Meeting notes & action items
              </label>
              <textarea
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                onBlur={() => {
                  if (meetingNotes !== (meeting.meetingNotes ?? "")) save("meetingNotes", meetingNotes);
                }}
                rows={3}
                placeholder="Notes and action items…"
                className="w-full px-3 py-2 rounded-button bg-surface-light dark:bg-surface-dark border border-apple-gray-5/30 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue resize-none mb-2"
              />
              <textarea
                value={actionItems}
                onChange={(e) => setActionItems(e.target.value)}
                onBlur={() => {
                  if (actionItems !== (meeting.actionItems ?? "")) save("actionItems", actionItems);
                }}
                rows={2}
                placeholder="Action items (one per line)"
                className="w-full px-3 py-2 rounded-button bg-surface-light dark:bg-surface-dark border border-apple-gray-5/30 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue resize-none"
              />
              {update.isPending && (
                <span className="text-xs text-apple-gray-2 flex items-center gap-1 mt-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
