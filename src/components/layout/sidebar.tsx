import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Bell,
  FileText,
  Calendar,
  FolderKanban,
  Sparkles,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPaletteTrigger } from "@/components/command-palette/trigger";

const navItems = [
  { href: "/", label: "My Day", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/time", label: "Time", icon: Clock },
  { href: "/follow-ups", label: "Follow-ups", icon: Bell },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/meetings", label: "Meetings", icon: Calendar },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/ai", label: "WorkDay AI", icon: Sparkles },
];

export function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <aside className="w-[260px] shrink-0 flex flex-col bg-[var(--color-surface)] border-r border-[var(--color-separator)]">
      <div className="p-5 border-b border-[var(--color-separator)]">
        <Link
          to="/"
          className="flex items-center gap-3 focus-ring rounded-lg p-1 -m-1"
        >
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            W
          </div>
          <div>
            <span className="font-semibold text-[1.0625rem] text-[var(--color-label)]">
              WorkDay
            </span>
            <p className="text-[0.6875rem] text-[var(--color-secondary-label)] leading-tight">
              Your daily hub
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href !== "/" && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  to={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 focus-ring",
                    isActive
                      ? "bg-[var(--color-primary)]/12 text-[var(--color-primary)]"
                      : "text-[var(--color-secondary-label)] hover:bg-[var(--color-fill)] hover:text-[var(--color-label)]"
                  )}
                >
                  <Icon
                    className={cn("w-5 h-5 shrink-0", isActive && "opacity-90")}
                  />
                  <span className="flex-1">{label}</span>
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 transition-opacity",
                      isActive ? "opacity-100" : "opacity-0"
                    )}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-[var(--color-separator)] flex items-center gap-2">
        <CommandPaletteTrigger />
        <Link
          to="/settings"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--color-secondary-label)] hover:bg-[var(--color-fill)] hover:text-[var(--color-label)] transition-colors focus-ring"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <ThemeToggle />
      </div>
    </aside>
  );
}
