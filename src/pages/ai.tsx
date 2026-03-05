import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const actions = [
  {
    id: "plan",
    label: "Plan my day",
    desc: "Get a suggested order for tasks and meetings",
  },
  {
    id: "prep",
    label: "Meeting prep",
    desc: "Brief for your upcoming meetings",
  },
  {
    id: "summary",
    label: "Summarize day",
    desc: "End-of-day summary and follow-ups",
  },
  {
    id: "standup",
    label: "Standup draft",
    desc: "Draft your standup notes",
  },
  {
    id: "followups",
    label: "Suggest follow-ups",
    desc: "AI-suggested follow-up items",
  },
];

export function AiPage() {
  return (
    <div className="page">
      <div className="page-content">
        <motion.div
          className="flex items-center gap-4 mb-8"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/15 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-label)] tracking-tight">
              WorkDay AI
            </h1>
            <p className="text-sm text-[var(--color-secondary-label)] mt-0.5">
              Connect OpenAI in settings to enable
            </p>
          </div>
        </motion.div>

        <ul className="space-y-3">
          {actions.map((a, i) => (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="list-item justify-between"
            >
              <div>
                <p className="font-medium text-[var(--color-label)]">
                  {a.label}
                </p>
                <p className="text-sm text-[var(--color-secondary-label)] mt-0.5">
                  {a.desc}
                </p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm">
                Run
              </button>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
