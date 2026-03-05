import { useTheme } from "@/contexts/theme-context";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolved, setTheme } = useTheme();
  const isDark = resolved === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "w-10 h-6 rounded-full relative transition-colors duration-200 focus-ring",
        "bg-[var(--color-fill)] hover:bg-[var(--color-separator)]"
      )}
      title={isDark ? "Switch to light" : "Switch to dark"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span
        className={cn(
          "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200",
          isDark && "translate-x-4"
        )}
      />
      <span className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <Sun className="w-3.5 h-3.5 text-[var(--color-secondary-label)] opacity-80" />
        <Moon className="w-3.5 h-3.5 text-[var(--color-secondary-label)] opacity-80" />
      </span>
    </button>
  );
}
