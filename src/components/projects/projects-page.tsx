"use client";

import { useState } from "react";
import { FolderKanban, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc/react";
import { AddProjectDialog } from "./add-project-dialog";

export function ProjectsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const { data: list, isLoading } = trpc.project.list.useQuery();

  const projects = list ?? [];

  return (
    <div className="min-h-full bg-surface-light dark:bg-surface-dark">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <header className="flex items-center justify-between mb-8">
          <h1 className="font-display font-semibold text-2xl">Projects</h1>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-button bg-apple-blue text-white text-sm font-medium hover:opacity-90 focus-ring"
          >
            <Plus className="w-4 h-4" /> New project
          </button>
        </header>

        {isLoading ? (
          <div className="rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 p-8 text-center text-apple-gray-2 text-sm">
            Loading…
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 p-12 text-center">
            <FolderKanban className="w-12 h-12 text-apple-gray-5 mx-auto mb-4" />
            <p className="text-apple-gray-2 mb-2">No projects yet</p>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="text-apple-blue font-medium hover:underline"
            >
              Create one
            </button>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {projects.map((p) => (
              <li
                key={p.id}
                className="rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 p-4 flex items-center gap-3"
              >
                <div
                  className="w-10 h-10 rounded-button shrink-0"
                  style={{ backgroundColor: `${p.color}20` }}
                />
                <span className="font-medium">{p.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <AddProjectDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
