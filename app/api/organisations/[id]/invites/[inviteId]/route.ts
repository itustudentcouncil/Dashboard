import { NextResponse } from "next/server";

import { getCurrentAuthSession, getSessionCookieHeader } from "@/lib/auth/session";
import { getCommandApiAuth } from "@/lib/auth/command-api-csrf";
import type { Organisation } from "@/lib/interfaces/organisations/organisation";

type RouteContext = {
  params: Promise<{ id: string; inviteId: string }>;
};

async function getOrganisation(id: string, cookieHeader: string): Promise<Organisation | null> {
  try {
    const response = await fetch(`https://api.studentcouncil.dk/query/v1/organisations/${id}`, {
      cache: "no-store",
      headers: { Cookie: cookieHeader },
    });
    if (!response.ok) return null;
    return (await response.json()) as Organisation;
  } catch {
    return null;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getCurrentAuthSession();
  if (!session.isAuthenticated || !session.account) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id, inviteId } = await context.params;

  const sessionCookieHeader = await getSessionCookieHeader();
  if (!sessionCookieHeader) {
    return NextResponse.json({ message: "Missing session cookie." }, { status: 401 });
  }

  const organisation = await getOrganisation(id, sessionCookieHeader);
  if (!organisation) {
    return NextResponse.json({ message: "Organisation not found." }, { status: 404 });
  }

  const auth = await getCommandApiAuth();
  if (!auth.ok) {
    return auth.response;
  }

  const { commandApiUrl, cookieHeader, csrfToken } = auth.data;

  const targetUrl = `${commandApiUrl}/command/v1/organisation/${organisation.id}/invites/${inviteId}`;

  const response = await fetch(targetUrl, {
    method: "DELETE",
    headers: {
      Cookie: cookieHeader,
      RequestVerificationToken: csrfToken,
    },
    cache: "no-store",
  });

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
}
