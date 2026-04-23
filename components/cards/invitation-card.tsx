import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import * as motion from "motion/react-client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Invite } from "@/lib/interfaces/invites/invite";

type InvitationCardProps = {
	invite: Invite;
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

export function InvitationCard({ invite }: InvitationCardProps) {
	const inviterName = invite.inviter.username || invite.inviter.email;
	const inviterInitial = inviterName.charAt(0).toUpperCase();
	const inviteCreatedAt = new Date(invite.createdAt);
	const inviteAgeLabel = Number.isNaN(inviteCreatedAt.getTime())
		? null
		: formatDistanceToNow(inviteCreatedAt);
	const inviterImageSrc = invite.inviter.profilePath
		? `https://cdn.studentcouncil.dk/${invite.inviter.profilePath}`
		: undefined;

	return (
		<Link href={`/invite/${invite.id}`} className="block">
			<motion.div
				className="group rounded-xl border border-[rgba(185,114,114,0.25)] bg-[rgba(40,23,25,0.9)] px-5 py-4 hover:border-[rgba(185,114,114,0.5)]"
				whileHover={{ scale: 1.02, y: -2 }}
				whileTap={{ scale: 0.98 }}
				transition={{ duration: 0.15, ease: "easeOut" }}
			>
			<div className="flex items-start gap-4">
				<div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[rgba(185,114,114,0.3)]">
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
							<h3 className="truncate text-lg font-semibold leading-tight text-foreground md:text-xl">
								{invite.organisation.name}
							</h3>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<p className="text-sm text-muted-foreground">
									You have been invited as a{" "}
									<span className="font-semibold text-foreground">
										{invite.isPublic ? "Public" : "Private"} {getPermissionLabel(invite.permissionLevel)}
									</span>
									.
								</p>
								{inviteAgeLabel ? (
									<p className="text-xs text-muted-foreground">Invited {inviteAgeLabel} ago</p>
								) : null}
							</div>
						</div>

						<div className="flex min-w-0 items-center gap-4 md:justify-end">
							<div className="flex min-w-0 items-center gap-3 md:max-w-xs">
								<Avatar className="h-10 w-10 shrink-0 rounded-full border border-[rgba(185,114,114,0.3)]">
									<AvatarImage src={inviterImageSrc} alt={inviterName} />
									<AvatarFallback>{inviterInitial || "?"}</AvatarFallback>
								</Avatar>

								<div className="min-w-0">
									<p className="truncate text-xs text-muted-foreground">
										<span className="uppercase tracking-wide">INVITED BY</span>{" "}
										<span className="font-semibold text-foreground normal-case tracking-normal">{inviterName}</span>
									</p>
									<p className="truncate text-xs text-muted-foreground">{invite.inviter.email}</p>
								</div>
							</div>

							<Button asChild size="default">
								<span>View Invite</span>
							</Button>
						</div>
					</div>
				</div>
			</div>
			</motion.div>
		</Link>
	);
}
