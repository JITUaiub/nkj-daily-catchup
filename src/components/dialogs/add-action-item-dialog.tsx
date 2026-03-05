import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/modal";

type AddActionItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  projects?: { id: string; name: string; color: string }[];
};

export function AddActionItemDialog({
  open,
  onOpenChange,
  projectId: defaultProjectId,
  projects = [],
}: AddActionItemDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"task" | "follow_up">("task");
  const [projectId, setProjectId] = useState(defaultProjectId ?? "all");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("17:00");
  const [priority, setPriority] = useState<"P0" | "P1" | "P2" | "P3">("P2");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDue = format(tomorrow, "yyyy-MM-dd");

  const createTask = useMutation({
    mutationFn: () =>
      api.tasks.create({
        title: title.trim(),
        projectId: projectId === "all" ? undefined : projectId,
        priority,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["action-items"] });
      reset();
    },
  });

  const createFollowUp = useMutation({
    mutationFn: () => {
      const base = dueDate || defaultDue;
      const dueAt = new Date(`${base}T${dueTime}`);
      return api.followUps.create({
        title: title.trim(),
        dueAt: dueAt.toISOString(),
        priority,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      queryClient.invalidateQueries({ queryKey: ["action-items"] });
      reset();
    },
  });

  const reset = () => {
    setTitle("");
    setType("task");
    setDueDate("");
    setDueTime("17:00");
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (type === "task") {
      createTask.mutate();
    } else {
      createFollowUp.mutate();
    }
  };

  const isPending = createTask.isPending || createFollowUp.isPending;

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="New action item" size="md">
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
            Type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("task")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                type === "task"
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-fill)] text-[var(--color-secondary-label)] hover:text-[var(--color-label)]"
              }`}
            >
              Task
            </button>
            <button
              type="button"
              onClick={() => setType("follow_up")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                type === "follow_up"
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-fill)] text-[var(--color-secondary-label)] hover:text-[var(--color-label)]"
              }`}
            >
              Follow-up
            </button>
          </div>
        </div>
        {type === "task" && (
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
        )}
        {type === "follow_up" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-secondary-label)] mb-1.5">
                Due date
              </label>
              <input
                type="date"
                value={dueDate || defaultDue}
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
        )}
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
            disabled={!title.trim() || isPending}
            className="btn btn-primary"
          >
            {isPending ? "Adding…" : "Add"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
