import { useTheme } from "@/contexts/theme-context";
import { useQuery } from "@tanstack/react-query";
import { Sun, Moon, Monitor } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const API_BASE =
  typeof import.meta.env !== "undefined" && import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
    : typeof import.meta.env !== "undefined" && import.meta.env.DEV
      ? "http://localhost:3001"
      : "";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data: auth } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.auth.me(),
  });

  return (
    <div className="page">
      <div className="page-content">
        <h1 className="text-2xl font-semibold text-[var(--color-label)] tracking-tight mb-8">
          Settings
        </h1>

        <section className="mb-8">
          <h2 className="section-title mb-3">Account</h2>
          {auth?.user ? (
            <div className="card card-elevated p-5">
              <p className="font-medium text-[var(--color-label)]">
                {auth.user.name ?? auth.user.email}
              </p>
              <p className="text-sm text-[var(--color-secondary-label)] mt-0.5">
                {auth.user.email}
              </p>
              <div className="flex gap-2 mt-4">
                <a
                  href={`${API_BASE}/api/auth/google`}
                  className="text-sm text-[var(--color-primary)] font-medium hover:underline"
                >
                  Reconnect Google
                </a>
                <button
                  type="button"
                  onClick={() =>
                    api.auth.logout().then(() => window.location.reload())
                  }
                  className="text-sm text-[var(--color-secondary-label)] hover:text-[var(--color-label)]"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="card card-elevated p-5">
              <p className="text-[var(--color-secondary-label)] mb-3">
                Not signed in
              </p>
              <a
                href={`${API_BASE}/api/auth/google`}
                className="btn btn-primary"
              >
                Sign in with Google
              </a>
            </div>
          )}
        </section>

        <section>
          <h2 className="section-title mb-3">Appearance</h2>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "light" as const, icon: Sun, label: "Light" },
                { value: "dark" as const, icon: Moon, label: "Dark" },
                { value: "system" as const, icon: Monitor, label: "System" },
              ] as const
            ).map(({ value, icon: Icon, label }) => (
              <motion.button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={cn(
                  "btn btn-ghost gap-2",
                  theme === value &&
                    "bg-[var(--color-primary)]/12 text-[var(--color-primary)] border-[var(--color-primary)]/30"
                )}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </motion.button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
