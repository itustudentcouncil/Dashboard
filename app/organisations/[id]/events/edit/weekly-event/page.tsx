import Link from "next/link";
import "timepicker-ui/main.css";
import "timepicker-ui/theme-dark.css";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyEventForm } from "@/app/organisations/[id]/events/edit/weekly-event/components/weekly-event-form";
import { getSessionCookieHeader } from "@/lib/auth/session";
import type { Organisation } from "@/lib/interfaces/organisations/organisation";

async function getOrganisation(id: string): Promise<Organisation | null> {
	const sessionCookieHeader = await getSessionCookieHeader();

	try {
		const response = await fetch(`https://api.studentcouncil.dk/query/v1/organisations/${id}`, {
			next: { revalidate: 0 },
			headers: sessionCookieHeader ? { Cookie: sessionCookieHeader } : undefined,
			cache: "no-store",
		});

		if (!response.ok) {
			return null;
		}

		return (await response.json()) as Organisation;
	} catch {
		return null;
	}
}

export default async function NewWeeklyEventPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const organisation = await getOrganisation(id);

	if (!organisation) {
		notFound();
	}

	return (
		<div className="mx-auto w-full max-w-3xl space-y-6 p-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Create Weekly Event</h1>
					<p className="text-sm text-gray-600 dark:text-gray-300">
						Set up a recurring weekly event for this organisation.
					</p>
				</div>
				<Button asChild variant="outline">
					<Link href={`/organisations/${id}/events`}>Back to Events</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Weekly Event Details</CardTitle>
					<CardDescription>
						Choose a name, the weekday, and the time for the recurring event.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					<WeeklyEventForm organisationId={String(organisation.id)} organisationPathId={id} />
				</CardContent>
			</Card>
		</div>
	);
}
