import { create } from "zustand";

interface FocusModeState {
  isFocusMode: boolean;
  toggle: () => void;
}

export const useFocusModeStore = create<FocusModeState>((set) => ({
  isFocusMode: false,
  toggle: () => set((s) => ({ isFocusMode: !s.isFocusMode })),
}));
