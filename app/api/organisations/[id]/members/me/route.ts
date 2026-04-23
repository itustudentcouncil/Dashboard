import { NextResponse } from "next/server";

import { getCommandApiAuth } from "@/lib/auth/command-api-csrf";
import { getCurrentAuthSession, getSessionCookieHeader } from "@/lib/auth/session";
import type { Member } from "@/lib/interfaces/accounts/member";
import type { Organisation } from "@/lib/interfaces/organisations/organisation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getOrganisation(id: string, cookieHeader: string): Promise<Organisation | null> {
  try {
    const response = await fetch(`https://api.studentcouncil.dk/query/v1/organisations/${id}`, {
      cache: "no-store",
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Organisation;
  } catch {
    return null;
  }
}

async function getMembers(id: number, cookieHeader: string): Promise<Member[]> {
  try {
    const response = await fetch(`https://api.studentcouncil.dk/query/v1/organisations/${id}/members?includePrivate=true`, {
      cache: "no-store",
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? (data as Member[]) : [];
  } catch {
    return [];
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getCurrentAuthSession();
  if (!session.isAuthenticated || !session.account) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const sessionCookieHeader = await getSessionCookieHeader();
  if (!sessionCookieHeader) {
    return NextResponse.json({ message: "Missing session cookie." }, { status: 401 });
  }

  const { id } = await context.params;
  const organisation = await getOrganisation(id, sessionCookieHeader);
  if (!organisation) {
    return NextResponse.json({ message: "Organisation not found." }, { status: 404 });
  }

  if (organisation.id === 9) {
    return NextResponse.json({ message: "You cannot leave the Student Council organisation from here." }, { status: 403 });
  }

  if (session.account.isGlobalAdministrator) {
    return NextResponse.json({ message: "Global administrators cannot use the leave organisation action." }, { status: 403 });
  }

  const members = await getMembers(organisation.id, sessionCookieHeader);
  const currentMember = members.find(
    (member) =>
      member.accountId === session.account?.id ||
      member.accountId === session.account?.authId ||
      member.email.toLowerCase() === session.account?.email.toLowerCase(),
  );

  if (!currentMember) {
    return NextResponse.json({ message: "Membership not found." }, { status: 404 });
  }

  const auth = await getCommandApiAuth();
  if (!auth.ok) {
    return auth.response;
  }

  const { commandApiUrl, cookieHeader, csrfToken } = auth.data;
  const response = await fetch(`${commandApiUrl}/command/v1/organisation/${organisation.id}/members/${currentMember.accountId}`, {
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