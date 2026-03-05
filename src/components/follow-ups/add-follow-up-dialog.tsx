"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { trpc } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";

type AddFollowUpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddFollowUpDialog({ open, onOpenChange }: AddFollowUpDialogProps) {
  const [title, setTitle] = useState("");
  const [contextNote, setContextNote] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("12:00");
  const [priority, setPriority] = useState<"P0" | "P1" | "P2" | "P3">("P2");

  const utils = trpc.useUtils();
  const create = trpc.followUp.create.useMutation({
    onSuccess: () => {
      utils.followUp.list.invalidate();
      setTitle("");
      setContextNote("");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDueDate(tomorrow.toISOString().slice(0, 10));
      setDueTime("12:00");
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const due = new Date(`${dueDate}T${dueTime}`);
    if (isNaN(due.getTime())) return;
    create.mutate({
      title: title.trim(),
      dueAt: due,
      contextNote: contextNote.trim() || undefined,
      priority,
    });
  };

  const defaultDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md",
            "bg-background-light dark:bg-background-dark rounded-modal shadow-apple-lg",
            "border border-apple-gray-5/30 p-6 animate-spring-in"
          )}
        >
          <Dialog.Title className="text-lg font-semibold mb-4">New follow-up</Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-apple-gray-2 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Send API spec to Sarah"
                className="w-full px-3 py-2 rounded-button bg-surface-light dark:bg-surface-dark border border-apple-gray-5/30 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-apple-gray-2 mb-1">Context (optional)</label>
              <textarea
                value={contextNote}
                onChange={(e) => setContextNote(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-button bg-surface-light dark:bg-surface-dark border border-apple-gray-5/30 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-apple-gray-2 mb-1">Due date</label>
                <input
                  type="date"
                  value={dueDate || defaultDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-button bg-surface-light dark:bg-surface-dark border border-apple-gray-5/30 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-apple-gray-2 mb-1">Time</label>
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-button bg-surface-light dark:bg-surface-dark border border-apple-gray-5/30 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-apple-gray-2 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "P0" | "P1" | "P2" | "P3")}
                className="w-full px-3 py-2 rounded-button bg-surface-light dark:bg-surface-dark border border-apple-gray-5/30 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
              >
                <option value="P0">P0</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
                <option value="P3">P3</option>
              </select>
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
