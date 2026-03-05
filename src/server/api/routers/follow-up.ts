import { z } from "zod";
import { eq } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { followUps } from "@/server/db/schema";

type FollowUpRow = {
  id: string;
  title: string;
  contextNote: string | null;
  dueAt: Date;
  completedAt: Date | null;
  priority: "P0" | "P1" | "P2" | "P3";
  snoozedUntil: Date | null;
  createdAt: Date;
};

const inMemoryList: FollowUpRow[] = [];

function toFollowUp(r: FollowUpRow) {
  return {
    id: r.id,
    title: r.title,
    contextNote: r.contextNote,
    dueAt: r.dueAt,
    completedAt: r.completedAt,
    priority: r.priority,
    snoozedUntil: r.snoozedUntil,
    createdAt: r.createdAt,
  };
}

function isDueToday(d: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  return d >= today && d <= end;
}

export const followUpRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          dueToday: z.boolean().optional(),
          includeCompleted: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (ctx.db) {
        let q = ctx.db.select().from(followUps).orderBy(followUps.dueAt);
        const rows = await q;
        let list = rows.map((r) => ({
          id: r.id,
          title: r.title,
          contextNote: r.contextNote,
          dueAt: r.dueAt,
          completedAt: r.completedAt,
          priority: r.priority,
          snoozedUntil: r.snoozedUntil,
          createdAt: r.createdAt,
        }));
        if (input?.dueToday) list = list.filter((r) => isDueToday(r.dueAt));
        if (!input?.includeCompleted) list = list.filter((r) => !r.completedAt);
        return list;
      }
      let list = inMemoryList.map(toFollowUp);
      if (input?.dueToday) list = list.filter((r) => isDueToday(r.dueAt));
      if (!input?.includeCompleted) list = list.filter((r) => !r.completedAt);
      return list;
    }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        dueAt: z.date(),
        contextNote: z.string().optional(),
        priority: z.enum(["P0", "P1", "P2", "P3"]).default("P2"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const now = new Date();
      if (ctx.db) {
        await ctx.db.insert(followUps).values({
          id,
          title: input.title,
          dueAt: input.dueAt,
          contextNote: input.contextNote ?? null,
          priority: input.priority,
        });
        const [row] = await ctx.db.select().from(followUps).where(eq(followUps.id, id));
        return toFollowUp(row!);
      }
      const row: FollowUpRow = {
        id,
        title: input.title,
        contextNote: input.contextNote ?? null,
        dueAt: input.dueAt,
        completedAt: null,
        priority: input.priority,
        snoozedUntil: null,
        createdAt: now,
      };
      inMemoryList.push(row);
      return toFollowUp(row);
    }),

  complete: publicProcedure
    .input(z.object({ id: z.string().length(36) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.db) {
        await ctx.db
          .update(followUps)
          .set({ completedAt: new Date() })
          .where(eq(followUps.id, input.id));
        return {};
      }
      const r = inMemoryList.find((x) => x.id === input.id);
      if (r) r.completedAt = new Date();
      return {};
    }),

  snooze: publicProcedure
    .input(
      z.object({
        id: z.string().length(36),
        until: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.db) {
        await ctx.db
          .update(followUps)
          .set({ snoozedUntil: input.until })
          .where(eq(followUps.id, input.id));
        return {};
      }
      const r = inMemoryList.find((x) => x.id === input.id);
      if (r) r.snoozedUntil = input.until;
      return {};
    }),
});
