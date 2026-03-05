import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

const COLORS = ["#007AFF", "#34C759", "#FF9500", "#FF3B30", "#AF52DE", "#5AC8FA"];

type AddProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddProjectDialog({ open, onOpenChange }: AddProjectDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#007AFF");
  const [description, setDescription] = useState("");

  const create = useMutation({
    mutationFn: () =>
      api.projects.create({
        name: name.trim(),
        color,
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setName("");
      setColor("#007AFF");
      setDescription("");
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate();
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="New project" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-secondary-label)] mb-1.5">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Web App"
            className="input"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-secondary-label)] mb-1.5">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Project scope, goals..."
            className="input resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-secondary-label)] mb-2">
            Color
          </label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "w-9 h-9 rounded-full border-2 transition-all hover:scale-110",
                  color === c
                    ? "border-[var(--color-label)] scale-110"
                    : "border-transparent opacity-70 hover:opacity-100"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => onOpenChange(false)} className="btn btn-ghost">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || create.isPending}
            className="btn btn-primary"
          >
            {create.isPending ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
