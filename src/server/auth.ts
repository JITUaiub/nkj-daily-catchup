import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { saveGoogleToken } from "@/server/lib/google-tokens";
import { reactivateMeetingsForCalendarAccount } from "@/server/lib/reactivate-calendar-meetings";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly openid email profile",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // First sign-in: account is present, save credentials to DB
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpiresAt = account.expires_at;
        // Prefer email from user object (first sign-in), else keep existing token email
        const email = user?.email ?? (token.email as string | undefined);
        if (email) {
          try {
            await saveGoogleToken(email, {
              accessToken: account.access_token,
              refreshToken: account.refresh_token ?? null,
              expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
            });
            await reactivateMeetingsForCalendarAccount(email);
          } catch (e) {
            console.error("[NextAuth] Failed to save Google token:", e);
          }
        }
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Decode in case the URL was stored URL-encoded in a cookie
      let decoded = url;
      try { decoded = decodeURIComponent(url); } catch { /* leave as-is */ }

      // Allowed origins: the NextAuth server itself + the configured frontend URL
      const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "";
      const allowedOrigins = [baseUrl, frontendUrl].filter(Boolean);

      if (decoded.startsWith("/")) return `${baseUrl}${decoded}`;
      try {
        const origin = new URL(decoded).origin;
        if (allowedOrigins.some((o) => origin === o)) return decoded;
      } catch { /* not a valid absolute URL */ }
      return frontendUrl || baseUrl;
    },
    async session({ session, token }) {
      (session as { accessToken?: string }).accessToken = token.accessToken as string | undefined;
      if (!session.user) session.user = { name: null, email: null, image: null };
      session.user.email = (token.email as string | undefined) ?? session.user.email;
      session.user.name = (token.name as string | undefined) ?? session.user.name;
      return session;
    },
  },
  pages: {
    signIn: "/api/auth/signin",
    error: "/api/auth/error",
  },
  // Use custom cookie names so stale next-auth.* cookies don't block sign-in
  cookies: {
    sessionToken: {
      name: "workday.session-token",
      options: { httpOnly: true, sameSite: "lax" as const, path: "/", secure: false },
    },
    callbackUrl: {
      name: "workday.callback-url",
      options: { httpOnly: true, sameSite: "lax" as const, path: "/", secure: false },
    },
    csrfToken: {
      name: "workday.csrf-token",
      options: { httpOnly: true, sameSite: "lax" as const, path: "/", secure: false },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthOptions;

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}
