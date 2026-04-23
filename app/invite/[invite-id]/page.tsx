import Unauthorized from "@/app/unauthorized";
import { InvitePromptCard } from "@/app/invite/[invite-id]/components/invite-prompt-card";
import { getCurrentAuthSession, getSessionCookieHeader } from "@/lib/auth/session";
import { Invite } from "@/lib/interfaces/invites/invite";
import { redirect } from "next/navigation";

type InvitePageProps = {
  params: Promise<{ "invite-id": string }>;
};

async function getInvite(id: string): Promise<Invite | null> {
  const sessionCookieHeader = await getSessionCookieHeader();

  if (!sessionCookieHeader) {
    return null;
  }

  try {
    const response = await fetch(`https://api.studentcouncil.dk/query/v1/invites/${id}`, {
      next: { revalidate: 0 },
      headers: { Cookie: sessionCookieHeader },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Invite;
  } catch {
    return null;
  }
}

export default async function InvitePage({ params }: InvitePageProps) {
  const [{ "invite-id": inviteId }, authSession] = await Promise.all([
    params,
    getCurrentAuthSession(),
  ]);

  if (!authSession.isAuthenticated || !authSession.account) {
    const inviteRedirect = `https://dashboard.studentcouncil.dk/invite/${inviteId}`;
    const loginUrl = `https://login.studentcouncil.dk/login?redirect=${encodeURIComponent(inviteRedirect)}`;
    redirect(loginUrl);
  }

  const invite = await getInvite(inviteId);
  if (!invite) {
    return <Unauthorized />;
  }

  if (invite.invitedEmail.toLowerCase() !== authSession.account.email.toLowerCase()) {
    return <Unauthorized />;
  }

  return (
    <main className="min-h-screen bg-[oklch(0.17_0.03_18)] text-foreground flex items-center justify-center px-6 py-10">
      <InvitePromptCard invite={invite} />
    </main>
  );
}
