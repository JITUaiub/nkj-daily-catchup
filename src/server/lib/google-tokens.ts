import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { googleAccounts } from "@/server/db/schema";

// In-memory fallback when DB is not available
const inMemoryTokens = new Map<string, { accessToken: string; refreshToken: string | null }>();

export async function saveGoogleToken(
  email: string,
  tokens: { accessToken: string; refreshToken?: string | null; expiresAt?: Date | null }
) {
  if (db) {
    const existing = await db
      .select({ id: googleAccounts.id, refreshToken: googleAccounts.refreshToken })
      .from(googleAccounts)
      .where(eq(googleAccounts.userEmail, email))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(googleAccounts)
        .set({
          accessToken: tokens.accessToken,
          // keep existing refresh token if a new one wasn't issued
          refreshToken: tokens.refreshToken ?? existing[0].refreshToken,
          tokenExpiresAt: tokens.expiresAt ?? null,
          updatedAt: new Date(),
        })
        .where(eq(googleAccounts.userEmail, email));
    } else {
      await db.insert(googleAccounts).values({
        id: crypto.randomUUID(),
        userEmail: email,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? null,
        tokenExpiresAt: tokens.expiresAt ?? null,
      });
    }
  } else {
    inMemoryTokens.set(email, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? null,
    });
  }
}

export async function getGoogleToken(
  email: string
): Promise<{ accessToken: string; refreshToken: string | null } | null> {
  if (db) {
    const rows = await db
      .select({
        accessToken: googleAccounts.accessToken,
        refreshToken: googleAccounts.refreshToken,
      })
      .from(googleAccounts)
      .where(eq(googleAccounts.userEmail, email))
      .limit(1);

    if (rows.length === 0) return null;
    return { accessToken: rows[0].accessToken, refreshToken: rows[0].refreshToken };
  }
  return inMemoryTokens.get(email) ?? null;
}

export async function deleteGoogleToken(email: string): Promise<void> {
  if (db) {
    await db.delete(googleAccounts).where(eq(googleAccounts.userEmail, email));
  } else {
    inMemoryTokens.delete(email);
  }
}
