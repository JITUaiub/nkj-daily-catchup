import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#007AFF");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.projects.list(),
  });

  const createMutation = useMutation({
    mutationFn: () => api.projects.create({ name, color }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setName("");
      setColor("#007AFF");
    },
  });

  return (
    <div className="page">
      <div className="page-content">
        <h1 className="text-2xl font-semibold text-[var(--color-label)] tracking-tight mb-6">
          Projects
        </h1>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input flex-1"
          />
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-11 h-10 rounded-lg border border-[var(--color-separator)] cursor-pointer bg-transparent"
            />
            <button
              type="button"
              onClick={() => name.trim() && createMutation.mutate()}
              className="btn btn-primary shrink-0"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">Loading...</div>
        ) : (
          <ul className="space-y-2">
            {projects.map((p) => (
              <motion.li
                key={p.id}
                layout
                className="list-item"
              >
                <span
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                <span className="font-medium text-[var(--color-label)]">
                  {p.name}
                </span>
              </motion.li>
            ))}
            {projects.length === 0 && (
              <li className="empty-state">No projects yet. Create one above.</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
