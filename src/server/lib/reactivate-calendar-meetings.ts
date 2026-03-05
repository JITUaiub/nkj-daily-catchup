import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { meetings } from "@/server/db/schema";

/** When user reconnects the same Google account, set DORMANT meetings back to active. */
export async function reactivateMeetingsForCalendarAccount(email: string): Promise<void> {
  if (!db) return;
  await db
    .update(meetings)
    .set({ status: "active", updatedAt: new Date() })
    .where(
      and(
        eq(meetings.source, "google"),
        eq(meetings.calendarAccountEmail, email),
        eq(meetings.status, "dormant")
      )
    );
}
