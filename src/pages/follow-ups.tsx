import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Check } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { AddFollowUpDialog } from "@/components/dialogs/add-follow-up-dialog";

export function FollowUpsPage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["follow-ups"],
    queryFn: () => api.followUps.list({ includeCompleted: false }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.followUps.complete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] }),
  });

  return (
    <div className="page">
      <div className="page-content-wide">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-label)] tracking-tight">
              Follow-ups
            </h1>
            <p className="mt-1 text-sm text-[var(--color-secondary-label)]">
              Reminders and due items. Add follow-ups to stay on top of commitments.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {isLoading ? (
          <div className="empty-state rounded-xl border border-[var(--color-separator)] bg-[var(--color-card)]">
            Loading…
          </div>
        ) : list.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="empty-state rounded-xl border-2 border-dashed border-[var(--color-separator)] bg-[var(--color-background-elevated)]/50 py-16"
          >
            <p className="mb-4">No follow-ups. Add one to get started.</p>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" /> Add follow-up
            </button>
          </motion.div>
        ) : (
          <ul className="space-y-2">
            {list.map((f) => (
              <motion.li
                key={f.id}
                layout
                className="list-item group rounded-xl"
              >
                <button
                  type="button"
                  onClick={() => completeMutation.mutate(f.id)}
                  className="w-9 h-9 rounded-xl border border-[var(--color-separator)] flex items-center justify-center text-[var(--color-secondary-label)] hover:bg-[var(--color-fill)] hover:text-[var(--color-success)] hover:border-[var(--color-success)]/40 transition-colors focus-ring shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--color-label)]">
                    {f.title}
                  </p>
                  <p className="text-sm text-[var(--color-secondary-label)]">
                    Due {format(new Date(f.dueAt), "MMM d, h:mm a")} · {f.priority}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      <AddFollowUpDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
