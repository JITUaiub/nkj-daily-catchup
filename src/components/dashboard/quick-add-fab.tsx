"use client";

import { useState } from "react";
import { Plus, CheckSquare, FileText, Clock, Bell } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { useRouter } from "next/navigation";

const quickActions = [
  { label: "Task", icon: CheckSquare, href: "/tasks?add=1" },
  { label: "Note", icon: FileText, href: "/notes?add=1" },
  { label: "Timer", icon: Clock, action: "timer" },
  { label: "Follow-up", icon: Bell, href: "/follow-ups?add=1" },
];

export function QuickAddFAB() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-apple-blue text-white shadow-apple-lg flex items-center justify-center hover:opacity-90 transition-opacity focus-ring z-30"
          aria-label="Quick add"
        >
          <Plus className="w-6 h-6" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          sideOffset={8}
          className="rounded-modal bg-background-light dark:bg-background-dark shadow-apple-lg border border-apple-gray-5/30 p-2 min-w-[180px] animate-spring-in"
        >
          <p className="px-2 py-1.5 text-xs font-medium text-apple-gray-1 uppercase tracking-wide">
            Quick add
          </p>
          {quickActions.map(({ label, icon: Icon, href, action }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (href) router.push(href);
                if (action === "timer") {
                  // Could open timer modal or start timer
                }
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-2.5 rounded-button text-sm text-left hover:bg-black/5 dark:hover:bg-white/5 focus-ring"
            >
              <Icon className="w-4 h-4 text-apple-gray-2" />
              {label}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
