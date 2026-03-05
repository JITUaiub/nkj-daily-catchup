import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Play, Square } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { formatDuration } from "@/lib/utils";

export function TimePage() {
  const queryClient = useQueryClient();

  const { data: active } = useQuery({
    queryKey: ["time", "active"],
    queryFn: () => api.time.getActive(),
  });
  const { data: today } = useQuery({
    queryKey: ["time", "today"],
    queryFn: () => api.time.getToday(),
  });

  const startMutation = useMutation({
    mutationFn: () => api.time.start(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["time"] }),
  });
  const stopMutation = useMutation({
    mutationFn: () => api.time.stop(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["time"] }),
  });

  const totalMinutes = today?.total ?? 0;
  const byCategory = today?.byCategory ?? [];

  return (
    <div className="page">
      <div className="page-content">
        <motion.h1
          className="text-2xl font-semibold text-[var(--color-label)] tracking-tight mb-6"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Time
        </motion.h1>

        {active ? (
          <motion.div
            className="block-highlight p-6 mb-8"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="text-xs font-medium text-[var(--color-secondary-label)] uppercase tracking-wider mb-0.5">
              Active since {format(new Date(active.startedAt), "h:mm a")}
            </p>
            <p className="text-xl font-semibold text-[var(--color-label)] mb-4">
              {active.category}
            </p>
            <button
              type="button"
              onClick={() => stopMutation.mutate()}
              className="btn btn-danger"
            >
              <Square className="w-4 h-4" /> Stop
            </button>
          </motion.div>
        ) : (
          <motion.div
            className="card card-elevated p-6 mb-8"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              type="button"
              onClick={() => startMutation.mutate()}
              className="btn btn-success text-base px-6 py-3"
            >
              <Play className="w-5 h-5" /> Start timer
            </button>
          </motion.div>
        )}

        <section>
          <h2 className="section-title">Today</h2>
          <p className="text-3xl font-semibold text-[var(--color-label)] mb-6">
            {formatDuration(totalMinutes)}
          </p>
          <ul className="space-y-2">
            {byCategory.map(({ category, minutes }) => (
              <li key={category} className="list-item">
                <span className="font-medium text-[var(--color-label)]">
                  {category}
                </span>
                <span className="text-[var(--color-secondary-label)] ml-auto">
                  {formatDuration(minutes)}
                </span>
              </li>
            ))}
            {byCategory.length === 0 && (
              <li className="empty-state">No time logged today.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
