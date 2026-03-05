"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { trpc } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";

type AddMeetingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddMeetingDialog({ open, onOpenChange }: AddMeetingDialogProps) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");
  const [prepNotes, setPrepNotes] = useState("");

  const utils = trpc.useUtils();
  const create = trpc.meeting.create.useMutation({
    onSuccess: () => {
      utils.meeting.getToday.invalidate();
      utils.meeting.getTodayWithGoogle.invalidate();
      utils.meeting.getWeekWithGoogle.invalidate();
      setTitle("");
      const today = new Date().toISOString().slice(0, 10);
      setStartDate(today);
      setStartTime("10:00");
      setEndTime("11:00");
      setLocation("");
      setLink("");
      setPrepNotes("");
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const date = startDate || new Date().toISOString().slice(0, 10);
    const startAt = new Date(`${date}T${startTime}`);
    const endAt = new Date(`${date}T${endTime}`);
    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) return;
    create.mutate({
      title: title.trim(),
      startAt,
      endAt,
      location: location.trim() || undefined,
      link: link.trim() || undefined,
      prepNotes: prepNotes.trim() || undefined,
    });
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md max-h-[90vh] overflow-y-auto",
            "bg-background-light dark:bg-background-dark rounded-modal shadow-apple-lg",
            "border border-apple-gray-5/30 p-6 animate-spring-in"
          )}
        >
          <Dialog.Title className="text-lg font-semibold mb-4">Add meeting</Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-apple-gray-2 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sprint Planning"
                className="w-full px-3 py-2 rounded-button bg-surface-light dark:bg-surface-dark border border-apple-gray-5/30 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-apple-gray-2 mb-1">Date</label>
                <input
                  type="date"
                  value={startDate || today}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-button bg-surface-light dark:bg-surface-dark border border-apple-gray-5/30 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-apple-gray-2 mb-1">Start</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-button bg-surface-light dark:bg-surface-dark border border-apple-gray-5/30 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-apple-gray-2 mb-1">End</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-button bg-surface-light dark:bg-surface-dark border border-apple-gray-5/30 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-apple-gray-2 mb-1">Location / link</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Room or Zoom link"
                className="w-full px-3 py-2 rounded-button bg-surface-light dark:bg-surface-dark border border-apple-gray-5/30 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-apple-gray-2 mb-1">Prep notes</label>
              <textarea
                value={prepNotes}
                onChange={(e) => setPrepNotes(e.target.value)}
                rows={2}
                placeholder="Talking points, questions…"
                className="w-full px-3 py-2 rounded-button bg-surface-light dark:bg-surface-dark border border-apple-gray-5/30 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button type="button" className="px-4 py-2 rounded-button text-sm text-apple-gray-2 hover:bg-black/5">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={!title.trim() || create.isPending}
                className="px-4 py-2 rounded-button bg-apple-blue text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {create.isPending ? "Adding…" : "Add"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
