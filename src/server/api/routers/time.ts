import { z } from "zod";
import { eq, gte } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { timeEntries } from "@/server/db/schema";

type TimeEntryRow = {
  id: string;
  taskId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  category: string;
  note: string | null;
};

const inMemoryEntries: TimeEntryRow[] = [];
let inMemoryActive: { id: string; startedAt: Date; taskId: string | null; category: string } | null = null;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const timeRouter = createTRPCRouter({
  getActive: publicProcedure.query(async ({ ctx }) => {
    if (ctx.db) {
      const rows = await ctx.db
        .select()
        .from(timeEntries)
        .where(eq(timeEntries.endedAt, null as unknown as Date));
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id,
        startedAt: row.startedAt,
        taskId: row.taskId,
        category: row.category,
      };
    }
    return inMemoryActive;
  }),

  start: publicProcedure
    .input(
      z.object({
        taskId: z.string().length(36).optional(),
        category: z.string().default("coding"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const startedAt = new Date();
      if (ctx.db) {
        await ctx.db.insert(timeEntries).values({
          id,
          startedAt,
          taskId: input.taskId ?? null,
          category: input.category,
        });
        return { id, startedAt };
      }
      inMemoryActive = { id, startedAt, taskId: input.taskId ?? null, category: input.category };
      inMemoryEntries.push({
        id,
        taskId: input.taskId ?? null,
        startedAt,
        endedAt: null as unknown as Date,
        category: input.category,
        note: null,
      });
      return { id, startedAt };
    }),

  stop: publicProcedure.mutation(async ({ ctx }) => {
    const now = new Date();
    if (ctx.db) {
      const rows = await ctx.db
        .select()
        .from(timeEntries)
        .where(eq(timeEntries.endedAt, null as unknown as Date));
      const row = rows[0];
      if (row) {
        await ctx.db.update(timeEntries).set({ endedAt: now }).where(eq(timeEntries.id, row.id));
      }
      return {};
    }
    if (inMemoryActive) {
      const entry = inMemoryEntries.find((e) => e.id === inMemoryActive!.id);
      if (entry) entry.endedAt = now;
      inMemoryActive = null;
    }
    return {};
  }),

  getTodaySummary: publicProcedure.query(async ({ ctx }) => {
    const start = startOfToday();
    if (ctx.db) {
      const rows = await ctx.db
        .select()
        .from(timeEntries)
        .where(gte(timeEntries.startedAt, start));
      const byCategory: Record<string, number> = {};
      const now = new Date();
      for (const r of rows) {
        const end = r.endedAt ?? now;
        const min = Math.round((end.getTime() - new Date(r.startedAt).getTime()) / 60000);
        byCategory[r.category] = (byCategory[r.category] ?? 0) + min;
      }
      const byCategoryList = Object.entries(byCategory).map(([category, minutes]) => ({ category, minutes }));
      const total = byCategoryList.reduce((s, r) => s + r.minutes, 0);
      return { byProject: [], byCategory: byCategoryList, total };
    }
    const today = inMemoryEntries.filter((e) => new Date(e.startedAt) >= start);
    const byCategory: Record<string, number> = {};
    for (const e of today) {
      const end = e.endedAt ?? (inMemoryActive?.id === e.id ? new Date() : e.startedAt);
      const min = Math.round((end.getTime() - new Date(e.startedAt).getTime()) / 60000);
      byCategory[e.category] = (byCategory[e.category] ?? 0) + min;
    }
    const byCategoryList = Object.entries(byCategory).map(([category, minutes]) => ({ category, minutes }));
    const total = byCategoryList.reduce((s, r) => s + r.minutes, 0);
    return { byProject: [], byCategory: byCategoryList, total };
  }),
});
