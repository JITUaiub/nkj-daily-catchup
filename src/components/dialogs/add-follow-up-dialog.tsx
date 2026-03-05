import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/modal";

type AddFollowUpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddFollowUpDialog({ open, onOpenChange }: AddFollowUpDialogProps) {
  const queryClient = useQueryClient();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [title, setTitle] = useState("");
  const [contextNote, setContextNote] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("12:00");
  const [priority, setPriority] = useState<"P0" | "P1" | "P2" | "P3">("P2");

  const create = useMutation({
    mutationFn: () => {
      const base = dueDate || format(tomorrow, "yyyy-MM-dd");
      const dueAt = new Date(`${base}T${dueTime}`);
      return api.followUps.create({
        title: title.trim(),
        dueAt: dueAt.toISOString(),
        contextNote: contextNote.trim() || undefined,
        priority,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      queryClient.invalidateQueries({ queryKey: ["action-items"] });
      setTitle("");
      setContextNote("");
      setDueDate("");
      setDueTime("12:00");
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    create.mutate();
  };

  const defaultDate = format(tomorrow, "yyyy-MM-dd");

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="New follow-up" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-secondary-label)] mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Send API spec to Sarah"
            className="input"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-secondary-label)] mb-1.5">
            Context (optional)
          </label>
          <textarea
            value={contextNote}
            onChange={(e) => setContextNote(e.target.value)}
            rows={2}
            placeholder="Add context..."
            className="input resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-secondary-label)] mb-1.5">
              Due date
            </label>
            <input
              type="date"
              value={dueDate || defaultDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-secondary-label)] mb-1.5">
              Time
            </label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="input"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-secondary-label)] mb-1.5">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as "P0" | "P1" | "P2" | "P3")}
            className="input"
          >
            <option value="P0">P0</option>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => onOpenChange(false)} className="btn btn-ghost">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || create.isPending}
            className="btn btn-primary"
          >
            {create.isPending ? "Adding…" : "Add"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
