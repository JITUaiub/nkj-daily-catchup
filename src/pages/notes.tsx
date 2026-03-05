import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

export function NotesPage() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd")
  );
  const [todayPlan, setTodayPlan] = useState("");
  const [scratchPad, setScratchPad] = useState("");
  const [yesterdaySummary, setYesterdaySummary] = useState("");
  const [endOfDayReflection, setEndOfDayReflection] = useState("");

  const { data: note, isLoading } = useQuery({
    queryKey: ["notes", date],
    queryFn: () => api.notes.getByDate(date),
  });

  const upsertMutation = useMutation({
    mutationFn: (payload: {
      date: string;
      todayPlan?: string;
      scratchPad?: string;
      yesterdaySummary?: string;
      endOfDayReflection?: string;
    }) => api.notes.upsert(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notes", date] }),
  });

  const handleSave = () => {
    upsertMutation.mutate({
      date,
      todayPlan: todayPlan || undefined,
      scratchPad: scratchPad || undefined,
      yesterdaySummary: yesterdaySummary || undefined,
      endOfDayReflection: endOfDayReflection || undefined,
    });
  };

  const prevDay = () =>
    setDate(format(subDays(new Date(date), 1), "yyyy-MM-dd"));
  const nextDay = () =>
    setDate(format(addDays(new Date(date), 1), "yyyy-MM-dd"));

  useEffect(() => {
    if (note) {
      setTodayPlan(note.todayPlan ?? "");
      setScratchPad(note.scratchPad ?? "");
      setYesterdaySummary(note.yesterdaySummary ?? "");
      setEndOfDayReflection(note.endOfDayReflection ?? "");
    } else {
      setTodayPlan("");
      setScratchPad("");
      setYesterdaySummary("");
      setEndOfDayReflection("");
    }
  }, [note, date]);

  const isToday = date === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="page">
      <div className="page-content">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-semibold text-[var(--color-label)] tracking-tight">
            Notes
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevDay}
              className="btn btn-ghost btn-sm p-2"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium text-[var(--color-label)] min-w-[140px] text-center">
              {format(new Date(date), "EEE, MMM d")}
            </span>
            <button
              type="button"
              onClick={nextDay}
              className="btn btn-ghost btn-sm p-2"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">Loading...</div>
        ) : (
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div>
              <label className="section-title block mb-2">
                Yesterday summary
              </label>
              <textarea
                value={yesterdaySummary}
                onChange={(e) => setYesterdaySummary(e.target.value)}
                onBlur={handleSave}
                rows={2}
                className="input resize-none"
              />
            </div>
            <div>
              <label className="section-title block mb-2">
                Today&apos;s plan
              </label>
              <textarea
                value={todayPlan}
                onChange={(e) => setTodayPlan(e.target.value)}
                onBlur={handleSave}
                rows={3}
                className="input resize-none"
              />
            </div>
            <div>
              <label className="section-title block mb-2">
                Scratch pad
              </label>
              <textarea
                value={scratchPad}
                onChange={(e) => setScratchPad(e.target.value)}
                onBlur={handleSave}
                rows={5}
                className="input resize-none"
              />
            </div>
            <div>
              <label className="section-title block mb-2">
                End of day reflection
              </label>
              <textarea
                value={endOfDayReflection}
                onChange={(e) => setEndOfDayReflection(e.target.value)}
                onBlur={handleSave}
                rows={3}
                className="input resize-none"
              />
            </div>
            {isToday && (
              <button
                type="button"
                onClick={handleSave}
                className="btn btn-primary"
              >
                Save
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
