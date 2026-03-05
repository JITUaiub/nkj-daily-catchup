"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { trpc } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";

type AddTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddTaskDialog({ open, onOpenChange }: AddTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"P0" | "P1" | "P2" | "P3">("P2");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");

  const utils = trpc.useUtils();
  const create = trpc.task.create.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
      setTitle("");
      setDescription("");
      setEstimatedMinutes("");
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    create.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined,
    });
  };

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
          <Dialog.Title className="text-lg font-semibold mb-4">New task</Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="task-title" className="block text-sm font-medium text-apple-gray-2 mb-1">
                Title
              </label>
              <input
                id="task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-3 py-2 rounded-button bg-surface-light dark:bg-surface-dark border border-apple-gray-5/30 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="task-desc" className="block text-sm font-medium text-apple-gray-2 mb-1">
                Description (optional)
              </label>
              <textarea
                id="task-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-button bg-surface-light dark:bg-surface-dark border border-apple-gray-5/30 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="task-priority" className="block text-sm font-medium text-apple-gray-2 mb-1">
                  Priority
                </label>
                <select
                  id="task-priority"
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
              <div>
                <label htmlFor="task-est" className="block text-sm font-medium text-apple-gray-2 mb-1">
                  Est. (min)
                </label>
                <input
                  id="task-est"
                  type="number"
                  min={0}
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  placeholder="30"
                  className="w-full px-3 py-2 rounded-button bg-surface-light dark:bg-surface-dark border border-apple-gray-5/30 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button type="button" className="px-4 py-2 rounded-button text-sm text-apple-gray-2 hover:bg-black/5 dark:hover:bg-white/5">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={!title.trim() || create.isPending}
                className="px-4 py-2 rounded-button bg-apple-blue text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {create.isPending ? "Adding…" : "Add task"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
