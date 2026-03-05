import { supabaseAdmin } from "../supabaseClient.js";

export async function reactivateMeetingsForCalendarAccount(
  email: string
): Promise<void> {
  if (!supabaseAdmin) return;
  await supabaseAdmin
    .from("meetings")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("source", "google")
    .eq("calendar_account_email", email)
    .eq("status", "dormant");
}
