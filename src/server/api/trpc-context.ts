import { getServerSession } from "next-auth";
import { db } from "@/server/db";
import { authOptions } from "@/server/auth";

export type CreateTRPCContextOptions = { req: Request; resHeaders: Headers };

export async function createTRPCContext(_opts: CreateTRPCContextOptions) {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    // stale OAuth cookies or missing config — treat as unauthenticated
    session = null;
  }
  return { db, session };
}
