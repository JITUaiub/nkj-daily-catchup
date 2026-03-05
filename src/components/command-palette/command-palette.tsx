import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  CheckSquare,
  ListTodo,
  Bell,
  Clock,
  FileText,
  Calendar,
  FolderKanban,
  Sparkles,
} from "lucide-react";
import { useCommandPalette } from "@/contexts/command-palette-context";
import { cn } from "@/lib/utils";

const actions = [
  { href: "/", label: "Go to My Day", icon: Search },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/action-items", label: "Action Items", icon: ListTodo },
  { href: "/follow-ups", label: "Follow-ups", icon: Bell },
  { href: "/meetings", label: "Meetings", icon: Calendar },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/time", label: "Time Tracker", icon: Clock },
  { href: "/ai", label: "WorkDay AI", icon: Sparkles },
];

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase();
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) || a.href.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % Math.max(filtered.length, 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (i) => (i - 1 + filtered.length) % Math.max(filtered.length, 1)
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = filtered[selectedIndex];
        if (item) {
          navigate(item.href);
          close();
        }
      } else if (e.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, close, navigate]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={close}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        aria-label="Command palette"
        className={cn(
          "fixed left-1/2 top-[18%] -translate-x-1/2 z-50 w-full max-w-xl",
          "bg-[var(--color-card)] rounded-2xl shadow-2xl border border-[var(--color-separator)] overflow-hidden",
          ""
        )}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-separator)]">
          <Search className="w-5 h-5 text-[var(--color-secondary-label)] shrink-0" />
          <input
            type="text"
            placeholder="Search or jump to..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-[0.9375rem] placeholder:text-[var(--color-tertiary-label)]"
            autoFocus
          />
          <kbd className="hidden sm:inline text-[0.6875rem] text-[var(--color-tertiary-label)] px-2 py-1 rounded bg-[var(--color-fill)] font-medium">
            ESC
          </kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <li className="empty-state text-sm">No results found.</li>
          ) : (
            filtered.map((item, i) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(item.href);
                      close();
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors focus-ring",
                      i === selectedIndex
                        ? "bg-[var(--color-primary)]/12 text-[var(--color-primary)]"
                        : "text-[var(--color-label)] hover:bg-[var(--color-fill)]"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0 opacity-80" />
                    {item.label}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </>
  );
}
