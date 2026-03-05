import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CheckSquare,
  Clock,
  Calendar,
  Bell,
  ListTodo,
  Video,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDuration } from "@/lib/utils";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export function DashboardPage() {
  const greeting = getGreeting();
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", { dueToday: true }],
    queryFn: () => api.tasks.list({ dueToday: true }),
  });
  const { data: todayData } = useQuery({
    queryKey: ["meetings", "today"],
    queryFn: () => api.meetings.getTodayWithGoogle(),
  });
  const { data: timeToday } = useQuery({
    queryKey: ["time", "today"],
    queryFn: () => api.time.getToday(),
  });
  const { data: activeTimer } = useQuery({
    queryKey: ["time", "active"],
    queryFn: () => api.time.getActive(),
  });
  const { data: followUps = [] } = useQuery({
    queryKey: ["follow-ups", { dueToday: true }],
    queryFn: () => api.followUps.list({ dueToday: true }),
  });

  const meetings = todayData?.meetings ?? [];
  const totalMinutes = timeToday?.total ?? 0;
  const tasksDone = tasks.filter((t) => t.status === "done").length;
  const tasksPlanned = tasks.length;

  return (
    <div className="page">
      <div className="page-content">
        <motion.header
          className="mb-8"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-sm text-[var(--color-secondary-label)] mb-0.5">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
          <h1 className="text-2xl font-semibold text-[var(--color-label)] tracking-tight">
            {greeting}
          </h1>
        </motion.header>

        <motion.section
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {[
            {
              label: "Tasks done",
              value: String(tasksDone),
              icon: CheckSquare,
              color: "text-[var(--color-success)]",
            },
            {
              label: "Planned",
              value: String(tasksPlanned),
              icon: ListTodo,
              color: "text-[var(--color-primary)]",
            },
            {
              label: "Time today",
              value: formatDuration(totalMinutes),
              icon: Clock,
              color: "text-[var(--color-secondary-label)]",
            },
            {
              label: "Meetings",
              value: String(meetings.length),
              icon: Calendar,
              color: "text-[var(--color-secondary-label)]",
            },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={item}
              className="card card-elevated p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <stat.icon
                  className={`w-4 h-4 shrink-0 ${stat.color}`}
                />
                <p className="text-xs font-medium text-[var(--color-secondary-label)] uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
              <p className="text-xl font-semibold text-[var(--color-label)]">
                {stat.value}
              </p>
            </motion.div>
          ))}
        </motion.section>

        {activeTimer && (
          <motion.section
            className="block-highlight mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-xs font-medium text-[var(--color-secondary-label)] uppercase tracking-wider mb-0.5">
              Active timer
            </p>
            <p className="font-medium text-[var(--color-label)]">
              {activeTimer.category} — started{" "}
              {format(new Date(activeTimer.startedAt), "h:mm a")}
            </p>
          </motion.section>
        )}

        <div className="grid gap-8 sm:grid-cols-2">
          <motion.section
            variants={container}
            initial="hidden"
            animate="show"
          >
            <h2 className="section-title flex items-center gap-2">
              <ListTodo className="w-3.5 h-3.5" />
              Today&apos;s tasks
            </h2>
            <ul className="space-y-2">
              {tasks.slice(0, 5).map((t) => (
                <motion.li key={t.id} variants={item} className="list-item">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      t.status === "done"
                        ? "bg-[var(--color-success)]"
                        : "bg-[var(--color-primary)]"
                    }`}
                  />
                  <span
                    className={
                      t.status === "done"
                        ? "line-through text-[var(--color-secondary-label)]"
                        : "text-[var(--color-label)]"
                    }
                  >
                    {t.title}
                  </span>
                </motion.li>
              ))}
              {tasks.length === 0 && (
                <li className="empty-state">
                  No tasks due today. Add some on the Tasks page.
                </li>
              )}
            </ul>
          </motion.section>

          <motion.section
            variants={container}
            initial="hidden"
            animate="show"
          >
            <h2 className="section-title flex items-center gap-2">
              <Video className="w-3.5 h-3.5" />
              Today&apos;s meetings
            </h2>
            <ul className="space-y-2">
              {meetings.slice(0, 5).map((m) => (
                <motion.li key={m.id} variants={item} className="list-item">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-label)] truncate">
                      {m.title}
                    </p>
                    <p className="text-sm text-[var(--color-secondary-label)]">
                      {format(new Date(m.startAt), "h:mm a")} –{" "}
                      {format(new Date(m.endAt), "h:mm a")}
                      {m.source === "google" && " · Google"}
                    </p>
                  </div>
                </motion.li>
              ))}
              {meetings.length === 0 && (
                <li className="empty-state">No meetings today.</li>
              )}
            </ul>
          </motion.section>
        </div>

        {followUps.length > 0 && (
          <motion.section
            className="mt-8"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="section-title flex items-center gap-2">
              <Bell className="w-3.5 h-3.5" />
              Follow-ups due today
            </h2>
            <ul className="space-y-2">
              {followUps.slice(0, 3).map((f) => (
                <li key={f.id} className="list-item">
                  <span className="text-[var(--color-label)]">{f.title}</span>
                </li>
              ))}
            </ul>
          </motion.section>
        )}
      </div>
    </div>
  );
}
