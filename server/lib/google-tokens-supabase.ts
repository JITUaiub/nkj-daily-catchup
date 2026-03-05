import { supabaseAdmin } from "../supabaseClient.js";

type GoogleAccountRow = {
  id: string;
  user_email: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
};

export async function saveGoogleToken(
  email: string,
  tokens: {
    accessToken: string;
    refreshToken?: string | null;
    expiresAt?: Date | null;
  }
) {
  if (!supabaseAdmin) return;

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("google_accounts")
    .select("id, refresh_token")
    .eq("user_email", email)
    .limit(1);

  if (existingError) throw existingError;

  const row = (existing as { id: string; refresh_token: string | null }[])[0];

  if (row) {
    const { error } = await supabaseAdmin
      .from("google_accounts")
      .update({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken ?? row.refresh_token,
        token_expires_at: tokens.expiresAt
          ? tokens.expiresAt.toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_email", email);
    if (error) throw error;
  } else {
    const { error } = await supabaseAdmin.from("google_accounts").insert({
      id: crypto.randomUUID(),
      user_email: email,
      access_token: tokens.AccessToken,
      refresh_token: tokens.refreshToken ?? null,
      token_expires_at: tokens.expiresAt
        ? tokens.expiresAt.toISOString()
        : null,
    });
    if (error) throw error;
  }
}

export async function getGoogleToken(
  email: string
): Promise<{ accessToken: string; refreshToken: string | null } | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("google_accounts")
    .select("access_token, refresh_token")
    .eq("user_email", email)
    .limit(1);
  if (error) throw error;
  const rows = data as Pick<
    GoogleAccountRow,
    "access_token" | "refresh_token"
  >[];
  if (rows.length === 0) return null;
  return {
    accessToken: rows[0].access_token,
    refreshToken: rows[0].refresh_token,
  };
}

export async function deleteGoogleToken(email: string): Promise<void> {
  if (!supabaseAdmin) return;
  const { error } = await supabaseAdmin
    .from("google_accounts")
    .delete()
    .eq("user_email", email);
  if (error) throw error;
}

