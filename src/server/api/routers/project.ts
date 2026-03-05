import { z } from "zod";
import { eq } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { projects } from "@/server/db/schema";

const inMemoryProjects: { id: string; name: string; color: string }[] = [];

export const projectRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    if (ctx.db) {
      const rows = await ctx.db.select().from(projects).orderBy(projects.name);
      return rows.map((r) => ({ id: r.id, name: r.name, color: r.color }));
    }
    return inMemoryProjects.map((p) => ({ id: p.id, name: p.name, color: p.color }));
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        color: z.string().default("#007AFF"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      if (ctx.db) {
        await ctx.db.insert(projects).values({
          id,
          name: input.name,
          color: input.color,
        });
        return { id, name: input.name, color: input.color };
      }
      inMemoryProjects.push({ id, name: input.name, color: input.color });
      return { id, name: input.name, color: input.color };
    }),
});
