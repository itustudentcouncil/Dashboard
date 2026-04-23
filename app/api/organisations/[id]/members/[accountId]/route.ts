import { NextResponse } from "next/server";

import { getCommandApiAuth } from "@/lib/auth/command-api-csrf";
import { getSessionCookieHeader } from "@/lib/auth/session";
import type { Organisation } from "@/lib/interfaces/organisations/organisation";

type RouteContext = {
  params: Promise<{ id: string; accountId: string }>;
};

type UpdateMemberRequest = {
  isPublic: boolean | null;
  permissionLevel: number | null;
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

export async function PATCH(request: Request, context: RouteContext) {
  const sessionCookieHeader = await getSessionCookieHeader();
  if (!sessionCookieHeader) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id, accountId } = await context.params;
  const organisation = await getOrganisation(id, sessionCookieHeader);
  if (!organisation) {
    return NextResponse.json({ message: "Organisation not found." }, { status: 404 });
  }

  const body = (await request.json()) as Partial<UpdateMemberRequest>;
  const patchBody: UpdateMemberRequest = {
    isPublic: body.isPublic ?? null,
    permissionLevel: body.permissionLevel ?? null,
  };

  const auth = await getCommandApiAuth();
  if (!auth.ok) {
    return auth.response;
  }

  const { commandApiUrl, cookieHeader, csrfToken } = auth.data;
  const response = await fetch(
    `${commandApiUrl}/command/v1/organisation/${organisation.id}/members/${accountId}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        Cookie: cookieHeader,
        RequestVerificationToken: csrfToken,
      },
      body: JSON.stringify(patchBody),
      cache: "no-store",
    },
  );

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const sessionCookieHeader = await getSessionCookieHeader();
  if (!sessionCookieHeader) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { id, accountId } = await context.params;
  const organisation = await getOrganisation(id, sessionCookieHeader);
  if (!organisation) {
    return NextResponse.json({ message: "Organisation not found." }, { status: 404 });
  }

  const auth = await getCommandApiAuth();
  if (!auth.ok) {
    return auth.response;
  }

  const { commandApiUrl, cookieHeader, csrfToken } = auth.data;
  const response = await fetch(
    `${commandApiUrl}/command/v1/organisation/${organisation.id}/members/${accountId}`,
    {
      method: "DELETE",
      headers: {
        Cookie: cookieHeader,
        RequestVerificationToken: csrfToken,
      },
      cache: "no-store",
    },
  );

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