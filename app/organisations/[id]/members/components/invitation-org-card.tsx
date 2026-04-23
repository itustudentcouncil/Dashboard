"use client";

import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Invite } from "@/lib/interfaces/invites/invite";

type InvitationOrgCardProps = {
  organisationId: string;
  invite: Invite;
  onDeleted?: (inviteId: string) => void;
  canDelete?: boolean;
};

function getPermissionLabel(permissionLevel: number): string {
  switch (permissionLevel) {
    case 1:
      return "Owner";
    case 2:
      return "Administrator";
    case 3:
      return "Member";
    default:
      return "Unknown";
  }
}

export function InvitationOrgCard({ organisationId, invite, onDeleted, canDelete }: InvitationOrgCardProps) {
  const inviterName = invite.inviter.username || invite.inviter.email;
  const inviterInitial = inviterName.charAt(0).toUpperCase();
  const inviteCreatedAt = new Date(invite.createdAt);
  const inviteAgeLabel = Number.isNaN(inviteCreatedAt.getTime())
    ? null
    : formatDistanceToNow(inviteCreatedAt);
  const inviterImageSrc = invite.inviter.profilePath
    ? `https://cdn.studentcouncil.dk/${invite.inviter.profilePath}`
    : undefined;

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel the invite sent to ${invite.invitedEmail}?`,
    );
    if (!confirmed) return;

    const deletePromise = async () => {
      const response = await fetch(
        `/api/organisations/${organisationId}/invites/${invite.id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type") ?? "";
        let message = "Failed to cancel invite.";

        if (contentType.includes("application/json")) {
          try {
            const data = (await response.json()) as { message?: string };
            message = data.message ?? message;
          } catch {
            // Use default message
          }
        }

        throw new Error(message);
      }
    };

    void toast.promise(deletePromise(), {
      loading: "Cancelling invite...",
      success: () => {
        onDeleted?.(invite.id);
        return "Invite cancelled.";
      },
      error: (error) => (error as Error).message || "Failed to cancel invite.",
    });
  };

  return (
    <div className="rounded-xl border px-5 py-4">
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border">
          <Image
            src={`https://cdn.studentcouncil.dk/${invite.organisation.icon}`}
            alt={`${invite.organisation.name} icon`}
            fill
            className="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 space-y-1.5">
              <h3 className="truncate text-base font-semibold leading-tight text-foreground">
                {invite.invitedEmail}
              </h3>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  Invited as a{" "}
                  <span className="font-semibold text-foreground">
                    {invite.isPublic ? "Public" : "Private"} {getPermissionLabel(invite.permissionLevel)}
                  </span>
                </p>
                {inviteAgeLabel ? (
                  <p className="text-xs text-muted-foreground">Sent {inviteAgeLabel} ago</p>
                ) : null}
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-4 md:justify-end">
              <div className="flex min-w-0 items-center gap-3 md:max-w-xs">
                <Avatar className="h-10 w-10 shrink-0 rounded-full border">
                  <AvatarImage src={inviterImageSrc} alt={inviterName} />
                  <AvatarFallback>{inviterInitial || "?"}</AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="uppercase tracking-wide">SENT BY</span>{" "}
                    <span className="font-semibold text-foreground normal-case tracking-normal">{inviterName}</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{invite.inviter.email}</p>
                </div>
              </div>

              {canDelete ? (
                <Button type="button" variant="destructive" size="default" onClick={handleDelete}>
                  Cancel Invite
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
