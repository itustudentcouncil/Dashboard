"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Member } from "@/lib/interfaces/accounts/member";

type MemberCardProps = {
	member: Member;
	organisationPathId: string;
	isStudentCouncilOrganisation: boolean;
	currentAccountId: string | null;
	currentAuthId: string | null;
	currentAccountEmail: string | null;
	currentMemberPermissionLevel: number | null;
	isGlobalAdministrator: boolean;
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
			return "Member";
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

export function MemberCard({
	member,
	organisationPathId,
	isStudentCouncilOrganisation,
	currentAccountId,
	currentAuthId,
	currentAccountEmail,
	currentMemberPermissionLevel,
	isGlobalAdministrator,
}: MemberCardProps) {
	const router = useRouter();
	const [selectedVisibility, setSelectedVisibility] = useState(member.isPublic ? "public" : "private");
	const [selectedPermission, setSelectedPermission] = useState(String(member.permissionLevel));
	const [isSaving, setIsSaving] = useState(false);

	const isOwnCard = useMemo(() => {
		if (currentAccountId && member.accountId === currentAccountId) return true;
		if (currentAuthId && member.accountId === currentAuthId) return true;
		if (currentAccountEmail && member.email.toLowerCase() === currentAccountEmail.toLowerCase()) return true;
		return false;
	}, [currentAccountEmail, currentAccountId, currentAuthId, member.accountId, member.email]);

	const canEditPermission = useMemo(() => {
		if (!isStudentCouncilOrganisation && isGlobalAdministrator) return true;
		return currentMemberPermissionLevel === 1;
	}, [currentMemberPermissionLevel, isGlobalAdministrator, isStudentCouncilOrganisation]);

	const canEditVisibility = useMemo(() => {
		if (!isStudentCouncilOrganisation && isGlobalAdministrator) return true;

		switch (currentMemberPermissionLevel) {
			case 1:
				return true;
			case 2:
				return isOwnCard || member.permissionLevel === 3;
			case 3:
				return isOwnCard;
			default:
				return false;
		}
	}, [currentMemberPermissionLevel, isGlobalAdministrator, isOwnCard, isStudentCouncilOrganisation, member.permissionLevel]);

	const canRemoveMember = useMemo(() => {
		if (!isStudentCouncilOrganisation && isGlobalAdministrator) {
			return !isOwnCard;
		}

		switch (currentMemberPermissionLevel) {
			case 1:
				return !isOwnCard;
			case 2:
				return member.permissionLevel === 3;
			case 3:
				return false;
			default:
				return false;
		}
	}, [currentMemberPermissionLevel, isGlobalAdministrator, isOwnCard, isStudentCouncilOrganisation, member.permissionLevel]);

	const initialVisibility = member.isPublic ? "public" : "private";
	const initialPermission = String(member.permissionLevel);
	const visibilityChanged = canEditVisibility && selectedVisibility !== initialVisibility;
	const permissionChanged = canEditPermission && selectedPermission !== initialPermission;
	const hasChanges = visibilityChanged || permissionChanged;

	const handleSave = async () => {
		if (!hasChanges) {
			return;
		}

		const savePromise = async () => {
			const response = await fetch(`/api/organisations/${organisationPathId}/members/${member.accountId}`, {
				method: "PATCH",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					isPublic: visibilityChanged ? selectedVisibility === "public" : null,
					permissionLevel: permissionChanged ? Number(selectedPermission) : null,
				}),
			});

			if (!response.ok) {
				const message = await getErrorMessage(response, "Failed to update member.");
				throw new Error(message);
			}
		};

		setIsSaving(true);
		try {
			await toast.promise(savePromise(), {
				loading: "Saving member changes...",
				success: () => {
					router.refresh();
					return "Member updated.";
				},
				error: (error) => error.message || "Failed to update member.",
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleRemoveMember = async () => {
		if (!canRemoveMember) {
			return;
		}

		const confirmed = window.confirm(`Remove ${member.name} from this organisation?`);
		if (!confirmed) {
			return;
		}

		const removePromise = async () => {
			const response = await fetch(`/api/organisations/${organisationPathId}/members/${member.accountId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const message = await getErrorMessage(response, "Failed to remove member.");
				throw new Error(message);
			}
		};

		await toast.promise(removePromise(), {
			loading: "Removing member...",
			success: () => {
				router.refresh();
				return "Member removed.";
			},
			error: (error) => error.message || "Failed to remove member.",
		});
	};

	const initials = member.name
		.split(" ")
		.filter(Boolean)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	const profileImageSrc = member.profilePath
		? `https://cdn.studentcouncil.dk/${member.profilePath}`
		: undefined;

	return (
		<Card className="py-0">
			<CardContent className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_180px_180px_auto] md:items-center">
				<div className="flex min-w-0 items-center gap-3">
					<Avatar className="h-10 w-10 rounded-full">
						<AvatarImage src={profileImageSrc} alt={member.name} />
						<AvatarFallback>{initials || "?"}</AvatarFallback>
					</Avatar>

					<div className="min-w-0">
						<p className="truncate text-sm font-medium">{member.name}</p>
						<p className="truncate text-xs text-muted-foreground">{member.email}</p>
					</div>
				</div>

				<div className="space-y-1">
					<p className="text-xs text-muted-foreground">Visibility</p>
					{canEditVisibility ? (
						<Select value={selectedVisibility} onValueChange={setSelectedVisibility}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select visibility" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="public">Public</SelectItem>
								<SelectItem value="private">Private</SelectItem>
							</SelectContent>
						</Select>
					) : (
						<p className="text-sm">{member.isPublic ? "Public" : "Private"}</p>
					)}
				</div>

				<div className="space-y-1">
					<p className="text-xs text-muted-foreground">Permission</p>
					{canEditPermission ? (
						<Select value={selectedPermission} onValueChange={setSelectedPermission}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder={getPermissionLabel(member.permissionLevel)} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="1">Owner</SelectItem>
								<SelectItem value="2">Administrator</SelectItem>
								<SelectItem value="3">Member</SelectItem>
							</SelectContent>
						</Select>
					) : (
						<p className="text-sm">{getPermissionLabel(member.permissionLevel)}</p>
					)}
				</div>

				<div className="flex flex-wrap items-end justify-end gap-2 md:justify-start md:self-end mb-0.5">
					{canRemoveMember ? (
						<Button type="button" size="sm" variant="destructive" onClick={() => void handleRemoveMember()}>
							Remove
						</Button>
					) : null}
					{hasChanges ? (
						<Button type="button" size="sm" disabled={isSaving} onClick={() => void handleSave()}>
							{isSaving ? "Saving..." : "Save"}
						</Button>
					) : null}
				</div>
			</CardContent>
		</Card>
	);
}
