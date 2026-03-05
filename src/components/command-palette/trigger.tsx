import { useEffect } from "react";
import { Search } from "lucide-react";
import { useCommandPalette } from "@/contexts/command-palette-context";

export function CommandPaletteTrigger() {
  const open = useCommandPalette().open;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <button
      type="button"
      onClick={open}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--color-secondary-label)] hover:bg-[var(--color-fill)] hover:text-[var(--color-label)] transition-colors focus-ring"
      title="Command palette (⌘K)"
    >
      <Search className="w-4 h-4" />
      <span className="hidden sm:inline text-xs font-medium">⌘K</span>
    </button>
  );
}
