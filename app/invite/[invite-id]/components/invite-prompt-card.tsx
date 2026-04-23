"use client";

import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Invite } from "@/lib/interfaces/invites/invite";
import type { Organisation } from "@/lib/interfaces/organisations/organisation";

type InvitePromptCardProps = {
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

async function getErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
	const contentType = response.headers.get("content-type") ?? "";

	if (contentType.includes("application/json")) {
		try {
			const data = (await response.json()) as { message?: string };
			if (data?.message) {
				return data.message;
			}
		} catch {
			return fallbackMessage;
		}
	}

	try {
		const text = await response.text();
		return text || fallbackMessage;
	} catch {
		return fallbackMessage;
	}
}

export function InvitePromptCard({ invite }: InvitePromptCardProps) {
	const router = useRouter();

	const inviterName = invite.inviter.username || invite.inviter.email;
	const inviterInitial = inviterName.charAt(0).toUpperCase();
	const inviteCreatedAt = new Date(invite.createdAt);
	const inviteAgeLabel = Number.isNaN(inviteCreatedAt.getTime())
		? null
		: formatDistanceToNow(inviteCreatedAt);
	const inviterImageSrc = invite.inviter.profilePath
		? `https://cdn.studentcouncil.dk/${invite.inviter.profilePath}`
		: undefined;

	const handleAccept = async () => {
		const acceptPromise = async () => {
			const response = await fetch(`/api/invites/${invite.id}/accept`, {
				method: "POST",
			});

			if (!response.ok) {
				const message = await getErrorMessage(response, "Failed to accept invite.");
				throw new Error(message);
			}

			const organisation = (await response.json()) as Organisation;
			const routeOrgId = organisation.slug || String(organisation.id);
			return `/organisations/${routeOrgId}`;
		};

		await toast.promise(acceptPromise(), {
			loading: "Accepting invite...",
			success: (targetPath) => {
				router.push(targetPath);
				router.refresh();
				return "Invite accepted.";
			},
			error: (error) => error.message || "Failed to accept invite.",
		});
	};

	const handleReject = async () => {
		const rejectPromise = async () => {
			const response = await fetch(`/api/invites/${invite.id}/reject`, {
				method: "POST",
			});

			if (!response.ok) {
				const message = await getErrorMessage(response, "Failed to reject invite.");
				throw new Error(message);
			}
		};

		await toast.promise(rejectPromise(), {
			loading: "Rejecting invite...",
			success: () => {
				router.push("/");
				router.refresh();
				return "Invite rejected.";
			},
			error: (error) => error.message || "Failed to reject invite.",
		});
	};

	return (
		<section className="w-full max-w-3xl rounded-2xl border border-[oklch(0.31_0.04_18)] bg-[oklch(0.23_0.03_18)] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
			<p className="text-sm text-muted-foreground">Invitation to join</p>
			<h1 className="mt-1 text-2xl font-bold tracking-tight">{invite.organisation.name}</h1>

			<div className="mt-5 rounded-xl border border-[rgba(185,114,114,0.25)] bg-[rgba(40,23,25,0.9)] px-5 py-4">
				<div className="flex items-center gap-4">
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
								<h2 className="truncate text-lg font-semibold leading-tight text-foreground md:text-xl">
									{invite.organisation.name}
								</h2>
								<div className="flex flex-wrap items-center gap-2">
									<p className="text-sm text-muted-foreground">
										You are invited as a{" "}
										<span className="font-semibold text-foreground">
											{invite.isPublic ? "Public" : "Private"} {getPermissionLabel(invite.permissionLevel)}
										</span>
										.
									</p>
									{inviteAgeLabel ? (
										<p className="text-xs text-muted-foreground">Sent {inviteAgeLabel} ago</p>
									) : null}
								</div>
							</div>

							<div className="flex min-w-0 items-center gap-3 md:max-w-xs">
								<Avatar className="h-10 w-10 shrink-0 rounded-full border border-[rgba(185,114,114,0.3)]">
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
						</div>
					</div>
				</div>
			</div>

			<div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<Button type="button" variant="outline" className="min-w-36" onClick={() => void handleReject()}>
					Reject
				</Button>
				<Button type="button" className="min-w-36" onClick={() => void handleAccept()}>
					Accept
				</Button>
			</div>
		</section>
	);
}
