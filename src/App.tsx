import { Routes, Route } from "react-router-dom";
import { CommandPaletteProvider } from "@/contexts/command-palette-context";
import { Sidebar } from "@/components/layout/sidebar";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { DashboardPage } from "@/pages/dashboard";
import { ActionItemsPage } from "@/pages/action-items";
import { TasksPage } from "@/pages/tasks";
import { FollowUpsPage } from "@/pages/follow-ups";
import { NotesPage } from "@/pages/notes";
import { MeetingsPage } from "@/pages/meetings";
import { ProjectsPage } from "@/pages/projects";
import { ProjectDetailPage } from "@/pages/project-detail";
import { AiPage } from "@/pages/ai";
import { SettingsPage } from "@/pages/settings";

export function App() {
  return (
    <CommandPaletteProvider>
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <Sidebar />
      <main className="flex-1 overflow-auto min-h-0">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/action-items" element={<ActionItemsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/follow-ups" element={<FollowUpsPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/meetings" element={<MeetingsPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/ai" element={<AiPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <CommandPalette />
    </div>
    </CommandPaletteProvider>
  );
}
