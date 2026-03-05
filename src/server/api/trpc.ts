import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Session } from "next-auth";
import { db } from "@/server/db";

const t = initTRPC.context<{ db: typeof db; session: Session | null }>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
