"use client";

import { useEffect, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberCard } from "./member-card";
import { InvitationOrgCard } from "./invitation-org-card";
import type { Member } from "@/lib/interfaces/accounts/member";
import type { Invite } from "@/lib/interfaces/invites/invite";

type MembersTabsProps = {
  organisationId: string;
  groupedMembers: {
    1: Member[];
    2: Member[];
    3: Member[];
  };
  invites: Invite[];
  canDeleteInvites: boolean;
  isStudentCouncilOrganisation: boolean;
  currentAccountId: string | null;
  currentAuthId: string | null;
  currentAccountEmail: string | null;
  currentMemberPermissionLevel: number | null;
  isGlobalAdministrator: boolean;
};

const PERMISSION_GROUPS = [
  { level: 1 as const, title: "Owner", emptyLabel: "owners" },
  { level: 2 as const, title: "Administrator", emptyLabel: "administrators" },
  { level: 3 as const, title: "Member", emptyLabel: "members" },
];

export function MembersTabs({
  organisationId,
  groupedMembers,
  invites: initialInvites,
  canDeleteInvites,
  isStudentCouncilOrganisation,
  currentAccountId,
  currentAuthId,
  currentAccountEmail,
  currentMemberPermissionLevel,
  isGlobalAdministrator,
}: MembersTabsProps) {
  const [invites, setInvites] = useState(initialInvites);

  useEffect(() => {
    setInvites(initialInvites);
  }, [initialInvites]);

  const handleInviteDeleted = (inviteId: string) => {
    setInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
  };

  return (
    <Tabs defaultValue="members">
      <TabsList variant="line">
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="invites">
          Invites
          {invites.length > 0 ? (
            <span className="ml-1.5 rounded-full bg-red-800 pr-0.8 px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {invites.length}
            </span>
          ) : null}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="members" className="mt-6 space-y-8">
        {PERMISSION_GROUPS.map((group) => {
          const items = groupedMembers[group.level];

          return (
            <section key={group.level} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium">{group.title}</h2>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>

              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed px-4 py-5 text-sm text-muted-foreground">
                  No {group.emptyLabel}.
                </p>
              ) : (
                <div className="space-y-3">
                  {items.map((member) => (
                    <MemberCard
                      key={member.accountId}
                      member={member}
                      organisationPathId={organisationId}
                      isStudentCouncilOrganisation={isStudentCouncilOrganisation}
                      currentAccountId={currentAccountId}
                      currentAuthId={currentAuthId}
                      currentAccountEmail={currentAccountEmail}
                      currentMemberPermissionLevel={currentMemberPermissionLevel}
                      isGlobalAdministrator={isGlobalAdministrator}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </TabsContent>

      <TabsContent value="invites" className="mt-6">
        {invites.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-5 text-sm text-muted-foreground">
            No pending invites.
          </p>
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => (
              <InvitationOrgCard
                key={invite.id}
                organisationId={organisationId}
                invite={invite}
                canDelete={canDeleteInvites}
                onDeleted={handleInviteDeleted}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
