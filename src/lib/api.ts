const getApiBase = () => {
  const env = typeof import.meta.env !== "undefined" ? import.meta.env : {};
  if (env.VITE_API_URL) return `${env.VITE_API_URL.replace(/\/$/, "")}/api`;
  if (env.DEV) return "http://localhost:3001/api";
  return "/api";
};
const API = getApiBase();

async function request<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const { json, ...init } = options;
  const headers: HeadersInit = {
    ...(init.headers as Record<string, string>),
    ...(json !== undefined && {
      "Content-Type": "application/json",
    }),
  };
  const body = json !== undefined ? JSON.stringify(json) : init.body;
  const res = await fetch(`${API}${path}`, {
    ...init,
    credentials: "include",
    headers,
    body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) return res.json() as Promise<T>;
  return undefined as T;
}

export const api = {
  auth: {
    me: () => request<{ user: { id: string; email: string; name: string } | null }>("/auth/me"),
    logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  },
  tasks: {
    list: (params?: { projectId?: string; status?: string; dueToday?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.projectId) q.set("projectId", params.projectId);
      if (params?.status) q.set("status", params.status);
      if (params?.dueToday) q.set("dueToday", "true");
      const query = q.toString();
      return request<{ id: string; title: string; description: string | null; projectId: string | null; status: string; priority: string; estimatedMinutes: number | null; dueDate: string | null; sortOrder: number; createdAt: string }[]>(
        `/tasks${query ? `?${query}` : ""}`
      );
    },
    create: (body: { title: string; description?: string; projectId?: string; priority?: string; estimatedMinutes?: number; dueDate?: string }) =>
      request<{ id: string; title: string; description: string | null; projectId: string | null; status: string; priority: string; estimatedMinutes: number | null; dueDate: string | null; sortOrder: number; createdAt: string }>("/tasks", { method: "POST", json: body }),
    updateStatus: (id: string, status: string) =>
      request<Record<string, never>>(`/tasks/${id}/status`, { method: "PATCH", json: { status } }),
    reorder: (taskIds: string[]) =>
      request<Record<string, never>>("/tasks/reorder", { method: "POST", json: { taskIds } }),
  },
  projects: {
    list: () =>
      request<{ id: string; name: string; color: string }[]>("/projects"),
    create: (body: { name: string; color?: string }) =>
      request<{ id: string; name: string; color: string }>("/projects", { method: "POST", json: body }),
  },
  time: {
    getActive: () =>
      request<{ id: string; startedAt: string; taskId: string | null; category: string } | null>("/time/active"),
    start: (body?: { taskId?: string; category?: string }) =>
      request<{ id: string; startedAt: string }>("/time/start", { method: "POST", json: body ?? {} }),
    stop: () =>
      request<Record<string, never>>("/time/stop", { method: "POST" }),
    getToday: () =>
      request<{ byProject: unknown[]; byCategory: { category: string; minutes: number }[]; total: number }>("/time/today"),
  },
  followUps: {
    list: (params?: { dueToday?: boolean; includeCompleted?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.dueToday) q.set("dueToday", "true");
      if (params?.includeCompleted) q.set("includeCompleted", "true");
      const query = q.toString();
      return request<{ id: string; title: string; contextNote: string | null; dueAt: string; completedAt: string | null; priority: string; snoozedUntil: string | null; createdAt: string }[]>(
        `/follow-ups${query ? `?${query}` : ""}`
      );
    },
    create: (body: { title: string; dueAt: string; contextNote?: string; priority?: string }) =>
      request<{ id: string; title: string; contextNote: string | null; dueAt: string; completedAt: string | null; priority: string; snoozedUntil: string | null; createdAt: string }>("/follow-ups", { method: "POST", json: body }),
    complete: (id: string) =>
      request<Record<string, never>>(`/follow-ups/${id}/complete`, { method: "POST" }),
    snooze: (id: string, until: string) =>
      request<Record<string, never>>(`/follow-ups/${id}/snooze`, { method: "POST", json: { until } }),
  },
  notes: {
    getByDate: (date: string) =>
      request<{ id: string; date: string; yesterdaySummary: string | null; todayPlan: string | null; scratchPad: string | null; endOfDayReflection: string | null } | null>(
        `/notes?date=${encodeURIComponent(date)}`
      ),
    upsert: (body: { date: string; yesterdaySummary?: string; todayPlan?: string; scratchPad?: string; endOfDayReflection?: string }) =>
      request<Record<string, never>>("/notes", { method: "PUT", json: body }),
  },
  meetings: {
    getGoogleStatus: () =>
      request<{ googleConnected: boolean; connectedEmail: string | null }>("/meetings/google-status"),
    getTodayWithGoogle: (params?: { includeCancelled?: boolean; includeDormant?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.includeCancelled) q.set("includeCancelled", "true");
      if (params?.includeDormant) q.set("includeDormant", "true");
      const query = q.toString();
      return request<{
        meetings: { id: string; title: string; startAt: string; endAt: string; location: string | null; link: string | null; prepNotes: string | null; takePreparation: string | null; meetingNotes: string | null; actionItems: string | null; source: string; status: string }[];
        googleConnected: boolean;
        connectedEmail: string | null;
      }>(`/meetings/today-with-google${query ? `?${query}` : ""}`);
    },
    getWeekWithGoogle: (params?: { includeCancelled?: boolean; includeDormant?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.includeCancelled) q.set("includeCancelled", "true");
      if (params?.includeDormant) q.set("includeDormant", "true");
      const query = q.toString();
      return request<{
        meetingsByDay: { date: string; meetings: { id: string; title: string; startAt: string; endAt: string; location: string | null; link: string | null; prepNotes: string | null; takePreparation: string | null; meetingNotes: string | null; actionItems: string | null; source: string; status: string }[] }[];
        googleConnected: boolean;
        connectedEmail: string | null;
      }>(`/meetings/week-with-google${query ? `?${query}` : ""}`);
    },
    syncGoogle: () =>
      request<{ synced: boolean }>("/meetings/sync-google", { method: "POST" }),
    create: (body: { title: string; startAt: string; endAt: string; location?: string; link?: string; prepNotes?: string; takePreparation?: string; meetingNotes?: string; actionItems?: string }) =>
      request<{ id: string }>("/meetings", { method: "POST", json: body }),
    update: (id: string, body: { prepNotes?: string; takePreparation?: string; meetingNotes?: string; actionItems?: string }) =>
      request<{ ok: boolean }>(`/meetings/${id}`, { method: "PATCH", json: body }),
    disconnectGoogle: () =>
      request<{ success: boolean }>("/meetings/disconnect-google", { method: "POST" }),
  },
};
