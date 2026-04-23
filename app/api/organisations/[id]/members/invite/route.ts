import { NextResponse } from "next/server";

import { getCurrentAuthSession, getSessionCookieHeader } from "@/lib/auth/session";
import { getCommandApiAuth } from "@/lib/auth/command-api-csrf";
import { sendInviteEmail } from "@/lib/mailer";
import type { Member } from "@/lib/interfaces/accounts/member";
import type { Invite } from "@/lib/interfaces/invites/invite";
import type { Organisation } from "@/lib/interfaces/organisations/organisation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isItuEmail(value: string): boolean {
  return /^[^\s@]+@itu\.dk$/i.test(value.trim());
}

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

async function getMembers(organisationId: number, cookieHeader: string): Promise<Member[]> {
  try {
    const response = await fetch(
      `https://api.studentcouncil.dk/query/v1/organisations/${organisationId}/members?includePrivate=true`,
      {
        cache: "no-store",
        headers: {
          Cookie: cookieHeader,
        },
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? (data as Member[]) : [];
  } catch {
    return [];
  }
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getCurrentAuthSession();
  if (!session.isAuthenticated || !session.account) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const cookieHeader = await getSessionCookieHeader();
  if (!cookieHeader) {
    return NextResponse.json({ message: "Missing session cookie." }, { status: 401 });
  }

  const { id } = await context.params;
  const organisation = await getOrganisation(id, cookieHeader);
  if (!organisation) {
    return NextResponse.json({ message: "Organisation not found." }, { status: 404 });
  }

  const members = await getMembers(organisation.id, cookieHeader);
  const account = session.account;
  const currentMember = members.find(
    (member) =>
      member.accountId === account.id ||
      member.accountId === account.authId ||
      member.email.toLowerCase() === account.email.toLowerCase(),
  );

  const currentPermissionLevel = account.isGlobalAdministrator
    ? 1
    : (currentMember?.permissionLevel ?? null);

  if (currentPermissionLevel === null || currentPermissionLevel > 2) {
    return NextResponse.json({ message: "You do not have permission to invite members." }, { status: 403 });
  }

  const body = (await request.json()) as {
    email?: string;
    permissionLevel?: number;
    isPublic?: boolean;
  };

  const email = (body.email ?? "").trim().toLowerCase();
  const permissionLevel = Number(body.permissionLevel);
  const isPublic = Boolean(body.isPublic);

  if (!isItuEmail(email)) {
    return NextResponse.json({ message: "Invitation email must be an @itu.dk address." }, { status: 400 });
  }

  // Permission level validation: 
  // - Global admin or owner (level 1): can set 1-3
  // - Admin (level 2): can only set 3
  // - Admin (level 2): cannot invite anyone else
  const allowedPermissionLevels = 
    account.isGlobalAdministrator || currentPermissionLevel === 1 
      ? [1, 2, 3] 
      : currentPermissionLevel === 2
        ? [3]
        : [];

  if (!allowedPermissionLevels.includes(permissionLevel)) {
    return NextResponse.json({ message: "Invalid permission level for your role." }, { status: 400 });
  }

  // Get CSRF token and auth data for COMMAND_API
  const authResult = await getCommandApiAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { commandApiUrl, cookieHeader: commandCookieHeader, csrfToken } = authResult.data;

  try {
    const commandResponse = await fetch(
      `${commandApiUrl}/command/v1/organisation/${organisation.id}/invites`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "RequestVerificationToken": csrfToken,
          Cookie: commandCookieHeader,
        },
        body: JSON.stringify({
          email,
          permissionLevel,
          isPublic,
        }),
      },
    );

    if (!commandResponse.ok) {
      const contentType = commandResponse.headers.get("content-type") ?? "";
      let errorMessage = "Failed to send invite.";

      if (contentType.includes("application/json")) {
        try {
          const errorData = (await commandResponse.json()) as { message?: string };
          errorMessage = errorData.message ?? errorMessage;
        } catch {
          // Use default error message
        }
      }

      return NextResponse.json({ message: errorMessage }, { status: commandResponse.status });
    }

    let createdInvite: Invite | null = null;
    const contentType = commandResponse.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      try {
        createdInvite = (await commandResponse.json()) as Invite;
      } catch {
        createdInvite = null;
      }
    }

    if (!createdInvite?.id) {
      return NextResponse.json({ message: "Invite was created, but invite details were missing." }, { status: 502 });
    }

    await sendInviteEmail(email, createdInvite);

    return NextResponse.json({ message: "Invite has been sent successfully." }, { status: 200 });
  } catch (error) {
    console.error("Error sending invite:", error);
    return NextResponse.json({ message: "Failed to send invite." }, { status: 500 });
  }
}