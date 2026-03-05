import { Router, Request, Response } from "express";
import { getSessionFromRequest, signToken, COOKIE_NAME } from "../auth.js";

const router = Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";
const API_URL = process.env.API_URL ?? "http://localhost:3001";

router.get("/me", (req: Request, res: Response) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({ user: null });
  }
  return res.json({
    user: { id: session.sub, email: session.email, name: session.name },
  });
});

router.get("/google", (req: Request, res: Response) => {
  const redirectUri = `${API_URL}/api/auth/google/callback`;
  const scope =
    "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly openid email profile";
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  const state = (req.query.returnTo as string) || "/";
  url.searchParams.set("state", state);
  res.redirect(url.toString());
});

router.get("/google/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = (req.query.state as string) || "/";
  if (!code) {
    return res.redirect(`${FRONTEND_URL}/?error=no_code`);
  }

  const redirectUri = `${API_URL}/api/auth/google/callback`;
  const body = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("[auth] Token exchange failed:", err);
    return res.redirect(`${FRONTEND_URL}/?error=token_failed`);
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const userRes = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo?alt=json",
    {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    }
  );
  if (!userRes.ok) {
    return res.redirect(`${FRONTEND_URL}/?error=userinfo_failed`);
  }
  const userInfo = (await userRes.json()) as { id: string; email: string; name?: string };
  const email = userInfo.email ?? "";
  const name = userInfo.name ?? email;

  const { saveGoogleToken } = await import("../lib/google-tokens.js");
  const { reactivateMeetingsForCalendarAccount } = await import(
    "../lib/reactivate-calendar-meetings.js"
  );
  try {
    await saveGoogleToken(email, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
    });
    await reactivateMeetingsForCalendarAccount(email);
  } catch (e) {
    console.error("[auth] saveGoogleToken failed:", e);
  }

  const token = signToken({
    sub: userInfo.id,
    email,
    name,
  });

  res
    .cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .redirect(`${FRONTEND_URL}${state.startsWith("/") ? state : "/"}`);
});

router.post("/logout", (_req: Request, res: Response) => {
  res
    .clearCookie(COOKIE_NAME, { path: "/" })
    .status(200)
    .json({ ok: true });
});

export default router;
