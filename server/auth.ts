import jwt from "jsonwebtoken";
import { Request } from "express";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const COOKIE_NAME = "workday.session-token";

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
};

export function signToken(payload: Omit<SessionPayload, "iat" | "exp">): string {
  return jwt.sign(
    { sub: payload.sub, email: payload.email, name: payload.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(req: Request): SessionPayload | null {
  const token =
    req.cookies?.[COOKIE_NAME] ??
    req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  return verifyToken(token);
}

export { COOKIE_NAME };
