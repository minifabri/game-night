import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "gn_admin";
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 12; // 12h, long enough for the whole party

function requireAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("Missing ADMIN_PASSWORD env var.");
  }
  return password;
}

function tokenFor(password: string): string {
  return createHash("sha256").update(`game-night-admin:${password}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyAdminPassword(candidate: string): boolean {
  return safeEqual(candidate, requireAdminPassword());
}

export async function createAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, tokenFor(requireAdminPassword()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
}

export async function destroyAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const cookieValue = store.get(ADMIN_COOKIE_NAME)?.value;
  if (!cookieValue) return false;
  try {
    return safeEqual(cookieValue, tokenFor(requireAdminPassword()));
  } catch {
    return false;
  }
}
