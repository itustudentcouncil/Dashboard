import "server-only";

import { NextResponse } from "next/server";
import { getSessionCookieHeader } from "@/lib/auth/session";

export type CommandApiAuthData = {
  commandApiUrl: string;
  cookieHeader: string;
  csrfToken: string;
};

export type CommandApiAuthResult =
  | { ok: true; data: CommandApiAuthData }
  | { ok: false; response: NextResponse };

function getSetCookieHeaders(headers: Headers): string[] {
  const headerStore = headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headerStore.getSetCookie === "function") {
    return headerStore.getSetCookie();
  }

  const setCookieHeader = headers.get("set-cookie");
  return setCookieHeader ? [setCookieHeader] : [];
}

function mergeCookieHeader(baseCookieHeader: string, extraCookiePairs: string[]): string {
  const cookieMap = new Map<string, string>();

  for (const cookiePart of baseCookieHeader.split(/;\s*/)) {
    if (!cookiePart) continue;

    const separatorIndex = cookiePart.indexOf("=");
    if (separatorIndex <= 0) continue;

    const name = cookiePart.slice(0, separatorIndex).trim();
    cookieMap.set(name, cookiePart);
  }

  for (const cookiePair of extraCookiePairs) {
    const separatorIndex = cookiePair.indexOf("=");
    if (separatorIndex <= 0) continue;

    const name = cookiePair.slice(0, separatorIndex).trim();
    cookieMap.set(name, cookiePair);
  }

  return Array.from(cookieMap.values()).join("; ");
}

export async function getCommandApiAuth(): Promise<CommandApiAuthResult> {
  const sessionCookieHeader = await getSessionCookieHeader();
  if (!sessionCookieHeader) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Unauthenticated" }, { status: 401 }),
    };
  }

  const csrfTokenResponse = await fetch(`${process.env.COMMAND_API_URL}/command/v1/form/token`, {
    method: "GET",
    headers: {
      Cookie: sessionCookieHeader,
    },
    cache: "no-store",
  });

  const csrfToken = (await csrfTokenResponse.text()).trim();

  if (!csrfTokenResponse.ok || !csrfToken) {
    return {
      ok: false,
      response: new NextResponse(csrfToken || JSON.stringify({ message: "Failed to get CSRF token" }), {
        status: csrfTokenResponse.ok ? 500 : csrfTokenResponse.status,
        headers: {
          "content-type": csrfTokenResponse.headers.get("content-type") ?? "application/json",
        },
      }),
    };
  }

  const antiforgeryCookiePairs = getSetCookieHeaders(csrfTokenResponse.headers)
    .map((setCookieValue) => setCookieValue.split(";", 1)[0]?.trim())
    .filter((cookiePair): cookiePair is string => Boolean(cookiePair));

    const commandApiUrl = process.env.COMMAND_API_URL ?? "https://api.studentcouncil.dk";
  return {
    ok: true,
    data: {
      commandApiUrl,
      cookieHeader: mergeCookieHeader(sessionCookieHeader, antiforgeryCookiePairs),
      csrfToken,
    },
  };
}
