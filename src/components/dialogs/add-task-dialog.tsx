import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/modal";

type AddTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  projects?: { id: string; name: string; color: string }[];
};

export function AddTaskDialog({
  open,
  onOpenChange,
  projectId: defaultProjectId,
  projects = [],
}: AddTaskDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"P0" | "P1" | "P2" | "P3">("P2");
  const [projectId, setProjectId] = useState(defaultProjectId ?? "all");

  const create = useMutation({
    mutationFn: () =>
      api.tasks.create({
        title: title.trim(),
        description: description.trim() || undefined,
        projectId: projectId === "all" ? undefined : projectId,
        priority,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["action-items"] });
      setTitle("");
      setDescription("");
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    create.mutate();
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="New task" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-secondary-label)] mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
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
            placeholder="Add more context..."
            className="input resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-secondary-label)] mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "P0" | "P1" | "P2" | "P3")}
              className="input"
            >
              <option value="P0">P0 — Critical</option>
              <option value="P1">P1 — High</option>
              <option value="P2">P2 — Medium</option>
              <option value="P3">P3 — Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-secondary-label)] mb-1.5">
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="input"
            >
              <option value="all">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="btn btn-ghost"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || create.isPending}
            className="btn btn-primary"
          >
            {create.isPending ? "Adding…" : "Add task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
