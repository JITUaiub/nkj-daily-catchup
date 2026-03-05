import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Check } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

export function FollowUpsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["follow-ups"],
    queryFn: () => api.followUps.list({ includeCompleted: false }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.followUps.create({
        title,
        dueAt: new Date(dueAt).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      setTitle("");
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.followUps.complete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] }),
  });

  return (
    <div className="page">
      <div className="page-content">
        <h1 className="text-2xl font-semibold text-[var(--color-label)] tracking-tight mb-6">
          Follow-ups
        </h1>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input flex-1"
          />
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="input sm:w-auto min-w-[180px]"
          />
          <button
            type="button"
            onClick={() => title.trim() && createMutation.mutate()}
            className="btn btn-primary shrink-0"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {isLoading ? (
          <div className="empty-state">Loading...</div>
        ) : (
          <ul className="space-y-2">
            {list.map((f) => (
              <motion.li
                key={f.id}
                layout
                className="list-item group"
              >
                <button
                  type="button"
                  onClick={() => completeMutation.mutate(f.id)}
                  className="w-8 h-8 rounded-lg border border-[var(--color-separator)] flex items-center justify-center text-[var(--color-secondary-label)] hover:bg-[var(--color-fill)] hover:text-[var(--color-success)] hover:border-[var(--color-success)]/40 transition-colors focus-ring shrink-0"
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
            {list.length === 0 && (
              <li className="empty-state">No follow-ups. Add one above.</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
