import { z } from "zod";
import { eq } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { dailyNotes } from "@/server/db/schema";

function toDateKey(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

const inMemoryNotes = new Map<number, { date: Date; yesterdaySummary: string | null; todayPlan: string | null; scratchPad: string | null; endOfDayReflection: string | null }>();

export const noteRouter = createTRPCRouter({
  getByDate: publicProcedure
    .input(z.object({ date: z.date() }))
    .query(async ({ ctx, input }) => {
      const date = new Date(input.date);
      date.setHours(0, 0, 0, 0);
      if (ctx.db) {
        const start = new Date(date);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        const rows = await ctx.db
          .select()
          .from(dailyNotes)
          .where(eq(dailyNotes.date, start));
        const row = rows[0];
        if (!row) return null;
        return {
          id: row.id,
          date: row.date,
          yesterdaySummary: row.yesterdaySummary,
          todayPlan: row.todayPlan,
          scratchPad: row.scratchPad,
          endOfDayReflection: row.endOfDayReflection,
        };
      }
      const key = toDateKey(date);
      const n = inMemoryNotes.get(key);
      if (!n) return null;
      return {
        id: key.toString(),
        date,
        yesterdaySummary: n.yesterdaySummary,
        todayPlan: n.todayPlan,
        scratchPad: n.scratchPad,
        endOfDayReflection: n.endOfDayReflection,
      };
    }),

  upsert: publicProcedure
    .input(
      z.object({
        date: z.date(),
        yesterdaySummary: z.string().optional(),
        todayPlan: z.string().optional(),
        scratchPad: z.string().optional(),
        endOfDayReflection: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const date = new Date(input.date);
      date.setHours(0, 0, 0, 0);
      if (ctx.db) {
        const existing = await ctx.db
          .select()
          .from(dailyNotes)
          .where(eq(dailyNotes.date, date));
        const id = existing[0]?.id ?? crypto.randomUUID();
        const payload = {
          yesterdaySummary: input.yesterdaySummary ?? null,
          todayPlan: input.todayPlan ?? null,
          scratchPad: input.scratchPad ?? null,
          endOfDayReflection: input.endOfDayReflection ?? null,
        };
        if (existing[0]) {
          await ctx.db.update(dailyNotes).set(payload).where(eq(dailyNotes.id, id));
        } else {
          await ctx.db.insert(dailyNotes).values({
            id,
            date,
            ...payload,
          });
        }
        return {};
      }
      const key = toDateKey(date);
      inMemoryNotes.set(key, {
        date,
        yesterdaySummary: input.yesterdaySummary ?? null,
        todayPlan: input.todayPlan ?? null,
        scratchPad: input.scratchPad ?? null,
        endOfDayReflection: input.endOfDayReflection ?? null,
      });
      return {};
    }),
});
