"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

const ACTIONS = [
  { id: "plan", label: "Plan my day", desc: "Suggest an optimal schedule from your tasks and meetings." },
  { id: "meeting", label: "Prepare for meeting", desc: "Generate prep notes and questions." },
  { id: "summarize", label: "Summarize my day", desc: "End-of-day summary for standup or journal." },
  { id: "standup", label: "Draft standup update", desc: "Yesterday / Today / Blockers format." },
  { id: "followups", label: "Suggest follow-ups", desc: "Scan notes and extract action items." },
];

const MOCK_RESPONSES: Record<string, string> = {
  plan: "**Suggested order:**\n1. 9:00–9:30 — Review PR #234 (Auth)\n2. 9:30–10:00 — Sprint Planning prep\n3. 10:00–11:00 — Sprint Planning\n4. 11:00–12:00 — Fix login redirect (focus block)\n5. 14:00–14:30 — 1:1 with Sarah\n6. 14:30–16:00 — API docs + follow-ups",
  meeting: "**Sprint Planning — Prep**\n• Review sprint goals and capacity.\n• Questions: What’s the top priority? Any blockers from last sprint?\n• Link: [Auth PR #234] — mention if it’s in scope.",
  summarize: "**Today:** Reviewed Auth PR #234, attended Sprint Planning and 1:1 with Sarah. Progress on login redirect; API docs next. Blockers: waiting on design for checkout.",
  standup: "**Yesterday:** Reviewed PR #230, fixed login redirect bug.\n**Today:** Sprint planning, 1:1 with Sarah, API docs.\n**Blockers:** Waiting on design for checkout flow.",
  followups: "• Send API spec to Sarah (from 1:1)\n• Review design feedback (Design review)\n• Follow up on deployment window",
};

export function AIPage() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const runAction = (id: string) => {
    setLoadingId(id);
    setResult(null);
    setTimeout(() => {
      setResult(MOCK_RESPONSES[id] ?? "No response for this action.");
      setLoadingId(null);
    }, 1200);
  };

  return (
    <div className="min-h-full bg-surface-light dark:bg-surface-dark">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <header className="mb-8">
          <h1 className="font-display font-semibold text-2xl flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-apple-blue" />
            WorkDay AI
          </h1>
          <p className="text-apple-gray-2 text-sm mt-1">
            Connect OpenAI in settings to enable real AI. For now, try the actions below (mock responses).
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => runAction(action.id)}
              disabled={loadingId !== null}
              className="rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 p-4 text-left hover:border-apple-blue/30 transition-colors focus-ring disabled:opacity-60"
            >
              <div className="flex items-center gap-2">
                {loadingId === action.id ? (
                  <Loader2 className="w-5 h-5 animate-spin text-apple-blue" />
                ) : (
                  <Sparkles className="w-5 h-5 text-apple-blue" />
                )}
                <span className="font-medium">{action.label}</span>
              </div>
              <p className="text-sm text-apple-gray-2 mt-1">{action.desc}</p>
            </button>
          ))}
        </div>

        {result && (
          <div className="mt-8 rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 p-6">
            <h2 className="text-sm font-medium text-apple-gray-2 mb-2">Result</h2>
            <pre className="text-sm whitespace-pre-wrap font-sans text-black dark:text-white">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
