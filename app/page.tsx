import { OrganisationCard } from "@/components/cards/organisation-card";
import { InvitationCard } from "@/components/cards/invitation-card";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { getCurrentAuthSession, getSessionCookieHeader } from "@/lib/auth/session";
import { AccountOrganisation } from "@/lib/interfaces/accounts/account-organisation";
import { Invite } from "@/lib/interfaces/invites/invite";
import { Plus } from "lucide-react";
import Link from "next/link";

async function getOrganisations(): Promise<AccountOrganisation[]> {
  const sessionCookieHeader = await getSessionCookieHeader();
  try {
    const response = await fetch("https://api.studentcouncil.dk/query/v1/accounts/me/organisations", {
      next: { revalidate: 0 },
      headers: sessionCookieHeader ? { Cookie: sessionCookieHeader } : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch organisations:", error);
    return [];
  }
}

async function getInvites(): Promise<Invite[]> {
  const sessionCookieHeader = await getSessionCookieHeader();
  try {
    const response = await fetch("https://api.studentcouncil.dk/query/v1/accounts/me/invites", {
      next: { revalidate: 0 },
      headers: sessionCookieHeader ? { Cookie: sessionCookieHeader } : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch organisations:", error);
    return [];
  }
}


export default async function Home() {
  const [authSession, organisations, invites] = await Promise.all([
    getCurrentAuthSession(),
    getOrganisations(),
    getInvites()
  ]);
  const { account } = authSession;

  return (
    <div className="h-screen bg-[oklch(0.17_0.03_18)] font-sans flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-end gap-3 px-6 py-3">
        {account?.isGlobalAdministrator && (
          <Button asChild variant="outline">
            <Link href="/create/organisation">
              <Plus />
              <span>Create organisation</span>
            </Link>
          </Button>
        )}
        <UserMenu account={account} />
      </div>

      {/* Main content — fills remaining viewport height, scrolls internally */}
      <main className="flex flex-1 flex-col items-center overflow-hidden px-4 pb-4 md:px-6 md:pb-6">
        <div className="flex w-full flex-1 flex-col overflow-hidden rounded-2xl border border-[oklch(0.31_0.04_18)] bg-[oklch(0.23_0.03_18)] shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
          <div className="flex-1 overflow-y-auto p-6 md:p-8">

            {/* Invites section */}
            <section className="mb-8">
              <div className="mb-3">
                <h2 className="text-xl font-bold tracking-tight">Your Invites</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  When another organisation administrator invites you to join their organisation, the invitation will appear here for you to accept or decline.
                </p>
              </div>
              {invites.length > 0 ? (
                <div className="space-y-3">
                  {invites.map((invite) => (
                    <InvitationCard key={invite.id} invite={invite} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[oklch(0.39_0.04_18)] p-6 text-center text-sm text-muted-foreground">
                  You have no pending invites.
                </div>
              )}
            </section>

            {/* Organisations section */}
            <section>
              <div className="mb-4">
                <h1 className="text-2xl font-bold tracking-tight">Your Organisations</h1>
                <p className="text-sm text-muted-foreground mt-1">Choose an organisation to open its dashboard.</p>
              </div>

              {organisations.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {organisations.map((organisation) => (
                    <OrganisationCard key={organisation.id} organisation={organisation} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[oklch(0.39_0.04_18)] p-8 text-center text-sm text-muted-foreground">
                  No organisations were found for this account.
                </div>
              )}
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
