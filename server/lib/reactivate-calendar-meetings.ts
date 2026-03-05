import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { meetings } from "../db/schema.js";

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
