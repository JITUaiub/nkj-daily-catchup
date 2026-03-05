"use client";

import { useFocusModeStore } from "@/stores/focus-mode";
import { Minimize2 } from "lucide-react";
import * as Switch from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export function FocusModeToggle() {
  const isFocusMode = useFocusModeStore((s) => s.isFocusMode);
  const toggle = useFocusModeStore((s) => s.toggle);

  return (
    <label className="flex items-center gap-2 px-3 py-2 rounded-button bg-background-light dark:bg-background-dark border border-apple-gray-5/30 shadow-apple cursor-pointer">
      <Minimize2 className="w-4 h-4 text-apple-gray-2" />
      <span className="text-sm text-apple-gray-2">Focus mode</span>
      <Switch.Root
        checked={isFocusMode}
        onCheckedChange={toggle}
        className={cn(
          "w-9 h-5 rounded-full bg-apple-gray-4 relative",
          "data-[state=checked]:bg-apple-blue/30",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue"
        )}
      >
        <Switch.Thumb className="block w-4 h-4 rounded-full bg-white shadow transition-transform translate-x-0.5 data-[state=checked]:translate-x-4" />
      </Switch.Root>
    </label>
  );
}
