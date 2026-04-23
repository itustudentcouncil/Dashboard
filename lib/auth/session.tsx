import "server-only";

import { jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { Account } from "../interfaces/accounts/account";
export interface AuthSession {
  isAuthenticated: boolean;
  account?: Account;
}

function getStringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getSessionCookieName(): string {
  return `${process.env.COOKIE_SESSION_NAME}`;
}

function getSessionSecret(): string | undefined {
  return getStringValue(process.env.SESSION_SECRET);
}

export async function getSessionCookieHeader(): Promise<string | undefined> {
  const cookieName = getStringValue(process.env.COOKIE_SESSION_NAME);
  if (!cookieName) return undefined;

  const cookieStore = await cookies();
  const sessionCookieValue = cookieStore.get(cookieName)?.value;
  if (!sessionCookieValue) return undefined;

  return `${cookieName}=${sessionCookieValue}`;
}

async function fetchAccountFromApi(sessionCookieHeader: string): Promise<Account | null> {
  try {
    const res = await fetch(`https://api.studentcouncil.dk/query/v1/accounts/me`, {
      headers: { Cookie: sessionCookieHeader },
      cache: "no-store",
    })

    console.log("[session] API status:", res.status)
    const text = await res.text()
    console.log("[session] API response:", text)

    if (!res.ok) return null
    return JSON.parse(text) as Account
  } catch (error) {
    console.error("[session] API fetch error:", error)
    return null
  }
}

function extractUserFromPayload(
  payload: JWTPayload,
): Account {
  const authId = getStringValue(payload.sub) ?? "unknown";
  const email = getStringValue(payload.email) ?? "";

  return {
    id: authId,
    authId,
    email,
    username: "",
    profilePath: "",
    isGlobalAdministrator: false,
    createdAt: "",
  };
}

async function verifySessionJwt(
  sessionValue: string,
  secret: string,
): Promise<Account | null> {
  try {
    const { payload } = await jwtVerify(sessionValue, new TextEncoder().encode(secret));
    return extractUserFromPayload(payload);
  } catch {
    return null;
  }
}

export const getCurrentAuthSession = cache(async function getCurrentAuthSession(): Promise<AuthSession> {
  const secret = getSessionSecret();
  const cookieName = getSessionCookieName();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(cookieName);
  const cookieHeader = await getSessionCookieHeader();

  console.log("[session] Cookie name:", cookieName)
  console.log("[session] Cookie present:", !!sessionCookie?.value)
  console.log("[session] Secret present:", !!secret)

  if (sessionCookie?.value && secret) {
    const verified = await verifySessionJwt(sessionCookie.value, secret);
    console.log("[session] JWT verified:", !!verified)
    console.log("[session] Auth ID:", verified?.authId)

    if (!verified) return { isAuthenticated: false };

    console.log("[session] Fetching account from API...")
    const account = cookieHeader ? await fetchAccountFromApi(cookieHeader) : null
    console.log("[session] Account found:", !!account)
    console.log("[session] Account:", JSON.stringify(account))

    return account
      ? { isAuthenticated: true, account }
      : { isAuthenticated: false };
  }

  console.log("[session] Unauthenticated")
  return { isAuthenticated: false };
});