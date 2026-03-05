"use client";

import { useState, useMemo, useEffect } from "react";
import { format, addDays, subDays } from "date-fns";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { key: "yesterdaySummary" as const, label: "Yesterday's summary" },
  { key: "todayPlan" as const, label: "Today's plan" },
  { key: "scratchPad" as const, label: "Scratch pad" },
  { key: "endOfDayReflection" as const, label: "End of day reflection" },
];

export function NotesPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [local, setLocal] = useState<Record<string, string>>({});

  const dateKey = selectedDate.toISOString().slice(0, 10);
  const dateForQuery = useMemo(() => new Date(dateKey), [dateKey]);
  useEffect(() => setLocal({}), [dateKey]);
  const { data: note, isLoading } = trpc.note.getByDate.useQuery(
    { date: dateForQuery },
    { keepPreviousData: true }
  );
  const utils = trpc.useUtils();
  const upsert = trpc.note.upsert.useMutation({
    onSuccess: () => utils.note.getByDate.invalidate({ date: dateForQuery }),
  });

  const values = {
    yesterdaySummary: local.yesterdaySummary ?? note?.yesterdaySummary ?? "",
    todayPlan: local.todayPlan ?? note?.todayPlan ?? "",
    scratchPad: local.scratchPad ?? note?.scratchPad ?? "",
    endOfDayReflection: local.endOfDayReflection ?? note?.endOfDayReflection ?? "",
  };

  const setValue = (key: string, value: string) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    upsert.mutate({
      date: selectedDate,
      yesterdaySummary: values.yesterdaySummary || undefined,
      todayPlan: values.todayPlan || undefined,
      scratchPad: values.scratchPad || undefined,
      endOfDayReflection: values.endOfDayReflection || undefined,
    });
    setLocal({});
  };

  const goPrev = () => setSelectedDate((d) => subDays(d, 1));
  const goNext = () => setSelectedDate((d) => addDays(d, 1));
  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="min-h-full bg-surface-light dark:bg-surface-dark">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <header className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h1 className="font-display font-semibold text-2xl">Daily notes</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="p-2 rounded-button hover:bg-black/5 dark:hover:bg-white/5 focus-ring"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span
              className={cn(
                "min-w-[140px] text-center font-medium",
                isToday && "text-apple-blue"
              )}
            >
              {format(selectedDate, "EEEE, MMM d")}
            </span>
            <button
              type="button"
              onClick={goNext}
              className="p-2 rounded-button hover:bg-black/5 dark:hover:bg-white/5 focus-ring"
              aria-label="Next day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 p-8 text-center text-apple-gray-2 text-sm">
            Loading…
          </div>
        ) : (
          <div className="rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 overflow-hidden">
            {SECTIONS.map(({ key, label }) => (
              <div key={key} className="border-b border-apple-gray-5/20 last:border-b-0">
                <label className="block px-4 pt-3 pb-1 text-xs font-medium text-apple-gray-1 uppercase tracking-wide">
                  {label}
                </label>
                <textarea
                  value={values[key]}
                  onChange={(e) => setValue(key, e.target.value)}
                  onBlur={handleSave}
                  rows={key === "scratchPad" ? 6 : 3}
                  placeholder={`Add ${label.toLowerCase()}…`}
                  className="w-full px-4 pb-3 bg-transparent text-sm resize-none focus:outline-none focus:ring-0 placeholder:text-apple-gray-5"
                />
              </div>
            ))}
            <div className="px-4 py-3 bg-surface-light dark:bg-surface-dark border-t border-apple-gray-5/20">
              <button
                type="button"
                onClick={handleSave}
                disabled={upsert.isPending}
                className="px-4 py-2 rounded-button bg-apple-blue text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {upsert.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
