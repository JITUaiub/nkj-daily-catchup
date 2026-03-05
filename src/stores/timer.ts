import { create } from "zustand";

interface TimerState {
  isRunning: boolean;
  elapsedMinutes: number;
  currentTaskTitle: string | null;
  start: (taskTitle?: string) => void;
  stop: () => void;
  tick: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => {
  let interval: ReturnType<typeof setInterval> | null = null;

  return {
    isRunning: false,
    elapsedMinutes: 0,
    currentTaskTitle: null,

    start: (taskTitle) => {
      if (get().isRunning) return;
      set({ isRunning: true, currentTaskTitle: taskTitle ?? null, elapsedMinutes: 0 });
      interval = setInterval(() => {
        set((s) => ({ elapsedMinutes: s.elapsedMinutes + 1 }));
      }, 60_000); // increment every real minute
    },

    stop: () => {
      if (interval) clearInterval(interval);
      interval = null;
      set({ isRunning: false });
    },

    tick: () => set((s) => ({ elapsedMinutes: s.elapsedMinutes + 1 })),
  };
});
