"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { trpc } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";

const COLORS = ["#007AFF", "#34C759", "#FF9500", "#FF3B30", "#AF52DE", "#5AC8FA"];

type AddProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddProjectDialog({ open, onOpenChange }: AddProjectDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#007AFF");

  const utils = trpc.useUtils();
  const create = trpc.project.create.useMutation({
    onSuccess: () => {
      utils.project.list.invalidate();
      setName("");
      setColor("#007AFF");
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate({ name: name.trim(), color });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm",
            "bg-background-light dark:bg-background-dark rounded-modal shadow-apple-lg",
            "border border-apple-gray-5/30 p-6 animate-spring-in"
          )}
        >
          <Dialog.Title className="text-lg font-semibold mb-4">New project</Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-apple-gray-2 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Web App"
                className="w-full px-3 py-2 rounded-button bg-surface-light dark:bg-surface-dark border border-apple-gray-5/30 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-apple-gray-2 mb-2">Color</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform",
                      color === c ? "border-black dark:border-white scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button type="button" className="px-4 py-2 rounded-button text-sm text-apple-gray-2 hover:bg-black/5">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={!name.trim() || create.isPending}
                className="px-4 py-2 rounded-button bg-apple-blue text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {create.isPending ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
