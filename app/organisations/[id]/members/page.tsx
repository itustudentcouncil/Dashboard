import { InviteMemberDialog } from "./components/invite-member-dialog";
import { LeaveOrganisationButton } from "./components/leave-organisation-button";
import { MembersTabs } from "./components/members-tabs";
import { Member } from "@/lib/interfaces/accounts/member";
import { Organisation } from "@/lib/interfaces/organisations/organisation";
import { getCurrentAuthSession, getSessionCookieHeader } from "@/lib/auth/session";
import { Invite } from "@/lib/interfaces/invites/invite";

async function getOrganisation(id: string, sessionCookieHeader?: string): Promise<Organisation | null> {
  try {
    const response = await fetch(`https://api.studentcouncil.dk/query/v1/organisations/${id}`, {
      cache: "no-store",
      headers: sessionCookieHeader ? { Cookie: sessionCookieHeader } : undefined,
    });

    if (!response.ok) {
      console.error(`Organisation API returned ${response.status}`);
      return null;
    }

    return (await response.json()) as Organisation;
  } catch (error) {
    console.error("Failed to fetch organisation:", error);
    return null;
  }
}

async function getMembers(id: string, sessionCookieHeader?: string): Promise<Member[]> {
    try {
        const response = await fetch(`https://api.studentcouncil.dk/query/v1/organisations/${id}/members?includePrivate=true`, {
      cache: "no-store",
      headers: sessionCookieHeader ? { Cookie: sessionCookieHeader } : undefined,
        });

        if (!response.ok) {
            console.error(`API returned ${response.status}`);
            return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Failed to fetch members:", error);
        return [];
    }
}

async function getInvites(id: string, sessionCookieHeader?: string): Promise<Invite[]> {
  try {
    const response = await fetch(`https://api.studentcouncil.dk/query/v1/organisations/${id}/invites`, {
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

export default async function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authSession = await getCurrentAuthSession();
  const sessionCookieHeader = await getSessionCookieHeader();
  const organisation = await getOrganisation(id, sessionCookieHeader);
  const members = organisation ? await getMembers(String(organisation.id), sessionCookieHeader) : [];
  const invites = organisation ? await getInvites(id, sessionCookieHeader) : [];
  const currentAccount = authSession.account;
  const currentMember = currentAccount
    ? members.find(
      (member) =>
        member.accountId === currentAccount.id ||
        member.accountId === currentAccount.authId ||
        member.email.toLowerCase() === currentAccount.email.toLowerCase(),
    )
    : undefined;

  const currentPermissionLevel = currentAccount?.isGlobalAdministrator
    ? 1
    : (currentMember?.permissionLevel ?? null);

  const groupedMembers = {
    1: members.filter((member) => member.permissionLevel === 1),
    2: members.filter((member) => member.permissionLevel === 2),
    3: members.filter((member) => member.permissionLevel === 3),
  };

  const canDeleteInvites = currentPermissionLevel !== null && currentPermissionLevel <= 2;
  const canLeaveOrganisation = Boolean(organisation && currentMember);
  const isStudentCouncilOrganisation = organisation?.id === 9;

  return (
    <div className="flex flex-1 flex-col items-center font-sans">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
            <p className="text-sm text-muted-foreground">Manage member visibility and permissions.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canLeaveOrganisation ? (
              <LeaveOrganisationButton
                organisationPathId={id}
                organisationName={organisation?.name ?? "this organisation"}
                currentMemberAccountId={currentMember?.accountId ?? ""}
              />
            ) : null}

            <InviteMemberDialog 
              organisationPathId={id} 
              currentPermissionLevel={currentPermissionLevel}
              isGlobalAdministrator={currentAccount?.isGlobalAdministrator}
            />
          </div>
        </div>

        <MembersTabs
          organisationId={id}
          groupedMembers={groupedMembers}
          invites={invites}
          canDeleteInvites={canDeleteInvites}
          isStudentCouncilOrganisation={isStudentCouncilOrganisation}
          currentAccountId={currentAccount?.id ?? null}
          currentAuthId={currentAccount?.authId ?? null}
          currentAccountEmail={currentAccount?.email ?? null}
          currentMemberPermissionLevel={currentMember?.permissionLevel ?? null}
          isGlobalAdministrator={Boolean(currentAccount?.isGlobalAdministrator)}
        />

        <section className="space-y-3 rounded-xl border bg-card p-4 text-sm ring-1 ring-foreground/10">
          <h2 className="text-base font-medium">FAQ</h2>

          <div className="space-y-4 text-muted-foreground">
            {isStudentCouncilOrganisation ? (
              <p className="rounded-lg border border-dashed px-3 py-2 text-sm text-foreground">
                The Student Council organisation has different rules than stated in the FAQ below.
              </p>
            ) : null}

            <div className="space-y-1">
              <p className="font-medium text-foreground">Members</p>
              <ul className="list-disc space-y-0.5 pl-4">
                <li>Edit organisation details, images, links, events, and news.</li>
                <li>Manage their own visibility.</li>
                <li>Leave the organisation themselves, but cannot remove other members.</li>
              </ul>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">Administrators</p>
              <ul className="list-disc space-y-0.5 pl-4">
                <li>Everything members can do.</li>
                <li>Invite new members (member permission level only).</li>
                <li>Cancel pending member invites.</li>
                <li>Manage visibility for all members.</li>
                <li>Remove members and themselves, but not other administrators or owners.</li>
                <li>Cannot change permission levels.</li>
              </ul>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">Owners</p>
              <ul className="list-disc space-y-0.5 pl-4">
                <li>Everything administrators can do.</li>
                <li>Invite new members, administrators, and owners.</li>
                <li>Cancel any pending invite regardless of permission level.</li>
                <li>Manage visibility and permission levels for all members, including other owners.</li>
                <li>Remove members, administrators, owners, and themselves.</li>
                <li>Cannot delete the organisation.</li>
              </ul>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-foreground">Global Administrators</p>
              <ul className="list-disc space-y-0.5 pl-4">
                <li>Can invite, remove, and update any member, administrator, or owner.</li>
                <li>Can manage visibility and permission levels across the organisation.</li>
                <li>Can delete the organisation.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}