import { z } from "zod";
import { eq, and, asc, desc, gte, lt } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { tasks } from "@/server/db/schema";

type TaskRow = {
  id: string;
  userId: string | null;
  title: string;
  description: string | null;
  projectId: string | null;
  status: "todo" | "in_progress" | "in_review" | "done";
  priority: "P0" | "P1" | "P2" | "P3";
  estimatedMinutes: number | null;
  dueDate: Date | null;
  sortOrder: number | null;
  createdAt: Date;
};

const inMemoryTasks: TaskRow[] = [];

function toTask(row: TaskRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    projectId: row.projectId,
    status: row.status,
    priority: row.priority,
    estimatedMinutes: row.estimatedMinutes,
    dueDate: row.dueDate,
    sortOrder: row.sortOrder ?? 0,
    createdAt: row.createdAt,
  };
}

export const taskRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          projectId: z.string().length(36).optional(),
          status: z.enum(["todo", "in_progress", "in_review", "done"]).optional(),
          dueToday: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (ctx.db) {
        const conditions = [];
        if (input?.projectId) conditions.push(eq(tasks.projectId, input.projectId));
        if (input?.status) conditions.push(eq(tasks.status, input.status));
        if (input?.dueToday) {
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const end = new Date(start);
          end.setDate(end.getDate() + 1);
          conditions.push(gte(tasks.dueDate, start));
          conditions.push(lt(tasks.dueDate, end));
        }
        const rows = await ctx.db
          .select()
          .from(tasks)
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(asc(tasks.sortOrder), desc(tasks.createdAt));
        return rows.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          projectId: r.projectId,
          status: r.status,
          priority: r.priority,
          estimatedMinutes: r.estimatedMinutes,
          dueDate: r.dueDate,
          sortOrder: r.sortOrder ?? 0,
          createdAt: r.createdAt,
        }));
      }
      let list = [...inMemoryTasks];
      if (input?.projectId) list = list.filter((t) => t.projectId === input.projectId);
      if (input?.status) list = list.filter((t) => t.status === input.status);
      if (input?.dueToday && list.length > 0) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        list = list.filter((t) => t.dueDate && t.dueDate >= start && t.dueDate < end);
      }
      return list.map(toTask);
    }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        projectId: z.string().length(36).optional(),
        priority: z.enum(["P0", "P1", "P2", "P3"]).default("P2"),
        estimatedMinutes: z.number().optional(),
        dueDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const now = new Date();
      if (ctx.db) {
        await ctx.db.insert(tasks).values({
          id,
          title: input.title,
          description: input.description ?? null,
          projectId: input.projectId ?? null,
          status: "todo",
          priority: input.priority,
          estimatedMinutes: input.estimatedMinutes ?? null,
          dueDate: input.dueDate ?? null,
        });
        const [row] = await ctx.db.select().from(tasks).where(eq(tasks.id, id));
        return toTask(row!);
      }
      const task: TaskRow = {
        id,
        userId: null,
        title: input.title,
        description: input.description ?? null,
        projectId: input.projectId ?? null,
        status: "todo",
        priority: input.priority,
        estimatedMinutes: input.estimatedMinutes ?? null,
        dueDate: input.dueDate ?? null,
        sortOrder: inMemoryTasks.length,
        createdAt: now,
      };
      inMemoryTasks.push(task);
      return toTask(task);
    }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string().length(36),
        status: z.enum(["todo", "in_progress", "in_review", "done"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.db) {
        await ctx.db.update(tasks).set({ status: input.status }).where(eq(tasks.id, input.id));
        return {};
      }
      const t = inMemoryTasks.find((x) => x.id === input.id);
      if (t) t.status = input.status;
      return {};
    }),

  reorderToday: publicProcedure
    .input(
      z.object({
        taskIds: z.array(z.string().length(36)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.db) {
        for (let i = 0; i < input.taskIds.length; i++) {
          await ctx.db.update(tasks).set({ sortOrder: i }).where(eq(tasks.id, input.taskIds[i]!));
        }
        return {};
      }
      input.taskIds.forEach((id, i) => {
        const t = inMemoryTasks.find((x) => x.id === id);
        if (t) t.sortOrder = i;
      });
      inMemoryTasks.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      return {};
    }),
});
