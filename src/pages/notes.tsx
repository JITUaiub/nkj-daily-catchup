import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, ListTodo } from "lucide-react";
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

  const promoteMutation = useMutation({
    mutationFn: () =>
      api.actionItems.promoteFromNotes({
        todayPlanText: todayPlan,
        date,
      }),
    onSuccess: (res) => {
      if (res.created > 0) {
        queryClient.invalidateQueries({ queryKey: ["action-items"] });
        queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      }
    },
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
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-label)] tracking-tight">
              Notes
            </h1>
            <p className="mt-1 text-sm text-[var(--color-secondary-label)]">
              Daily notes, plans, and reflections. Create action items from today&apos;s plan.
            </p>
          </div>
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
          <div className="empty-state rounded-xl border border-[var(--color-separator)] bg-[var(--color-card)]">
            Loading…
          </div>
        ) : (
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="card card-elevated p-4 rounded-xl space-y-2">
              <label className="section-title block">
                Yesterday summary
              </label>
              <textarea
                value={yesterdaySummary}
                onChange={(e) => setYesterdaySummary(e.target.value)}
                onBlur={handleSave}
                rows={2}
                className="input resize-none rounded-xl"
              />
            </div>
            <div className="card card-elevated p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="section-title block">
                  Today&apos;s plan
                </label>
                <button
                  type="button"
                  onClick={() => promoteMutation.mutate()}
                  disabled={!todayPlan.trim() || promoteMutation.isPending}
                  className="btn btn-ghost btn-xs inline-flex items-center gap-1"
                >
                  {promoteMutation.isPending ? (
                    "Creating…"
                  ) : (
                    <>
                      <ListTodo className="w-3.5 h-3.5" />
                      Create action items
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={todayPlan}
                onChange={(e) => setTodayPlan(e.target.value)}
                onBlur={handleSave}
                rows={3}
                className="input resize-none rounded-xl"
                placeholder="One item per line. Use &quot;Create action items&quot; to add to your list."
              />
            </div>
            <div className="card card-elevated p-4 rounded-xl space-y-2">
              <label className="section-title block">
                Scratch pad
              </label>
              <textarea
                value={scratchPad}
                onChange={(e) => setScratchPad(e.target.value)}
                onBlur={handleSave}
                rows={5}
                className="input resize-none rounded-xl"
              />
            </div>
            <div className="card card-elevated p-4 rounded-xl space-y-2">
              <label className="section-title block">
                End of day reflection
              </label>
              <textarea
                value={endOfDayReflection}
                onChange={(e) => setEndOfDayReflection(e.target.value)}
                onBlur={handleSave}
                rows={3}
                className="input resize-none rounded-xl"
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
