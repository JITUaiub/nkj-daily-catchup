import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Users } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { AddProjectDialog } from "@/components/dialogs/add-project-dialog";

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: projects = [], isLoading, isError, error } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.projects.list(),
  });

  const totalAllocatedHours = (project: (typeof projects)[number]) =>
    project.resources.reduce((sum, r) => sum + (r.allocationHours ?? 0), 0);

  return (
    <div className="page">
      <div className="page-content-wide">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-label)] tracking-tight">
              Projects
            </h1>
            <p className="mt-1 text-sm text-[var(--color-secondary-label)]">
              Plan work by project. Define your team and allocate hours for context.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" /> New project
          </button>
        </div>

        {isError ? (
          <div className="empty-state rounded-xl border border-[var(--color-separator)] bg-[var(--color-card)]">
            <p className="mb-2">
              Couldn&apos;t load projects{" "}
              <span className="text-[var(--color-secondary-label)]">
                ({(error as Error).message})
              </span>
              .
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["projects"] })}
            >
              Try again
            </button>
          </div>
        ) : isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="card card-elevated p-4 animate-pulse space-y-3 rounded-xl">
                <div className="h-4 w-32 bg-[var(--color-separator)]/40 rounded-lg" />
                <div className="h-3 w-full bg-[var(--color-separator)]/30 rounded-lg" />
                <div className="h-3 w-2/3 bg-[var(--color-separator)]/30 rounded-lg" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="empty-state rounded-xl border-2 border-dashed border-[var(--color-separator)] bg-[var(--color-background-elevated)]/50 py-16"
          >
            <p className="mb-4">No projects yet. Create one to organize your tasks.</p>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" /> New project
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const totalHours = totalAllocatedHours(p);
              return (
                <Link key={p.id} to={`/projects/${p.id}`}>
                <motion.div
                  layout
                  className="card card-elevated p-4 flex flex-col gap-3 rounded-xl hover:border-[var(--color-primary)]/20 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="w-10 h-10 rounded-xl shrink-0 border border-[var(--color-background)] shadow-sm"
                      style={{ backgroundColor: `${p.color}30` }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--color-label)] truncate">
                        {p.name}
                      </p>
                      {p.description && (
                        <p className="mt-1 text-xs text-[var(--color-secondary-label)] line-clamp-2">
                          {p.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-1 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-medium text-[var(--color-secondary-label)] uppercase tracking-wide">
                        Capacity
                      </p>
                      <p className="text-[11px] text-[var(--color-secondary-label)]">
                        {totalHours}h allocated
                      </p>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-background-elevated)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-[width]"
                        style={{
                          width: `${Math.max(6, Math.min(100, totalHours))}%`,
                          backgroundColor: p.color,
                        }}
                      />
                    </div>
                  </div>

                  {p.resources.length > 0 && (
                    <div className="mt-1 space-y-1">
                      <p className="text-[11px] font-medium text-[var(--color-secondary-label)] uppercase tracking-wide flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Team
                      </p>
                      <ul className="space-y-0.5">
                        {p.resources.slice(0, 3).map((r) => (
                          <li
                            key={r.id ?? `${p.id}-${r.name}`}
                            className="flex items-center justify-between gap-2 text-[11px] text-[var(--color-secondary-label)]"
                          >
                            <span className="truncate">
                              <span className="font-medium text-[var(--color-label)]">
                                {r.name}
                              </span>
                              {r.designation && ` — ${r.designation}`}
                            </span>
                            <span className="shrink-0">{r.allocationHours}h</span>
                          </li>
                        ))}
                        {p.resources.length > 3 && (
                          <li className="text-[10px] text-[var(--color-secondary-label)] italic">
                            +{p.resources.length - 3} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <AddProjectDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
