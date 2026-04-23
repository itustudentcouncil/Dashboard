import Link from "next/link";
import { notFound } from "next/navigation";

import { WeeklyEventForm } from "@/app/organisations/[id]/events/edit/weekly-event/components/weekly-event-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionCookieHeader } from "@/lib/auth/session";
import type { WeeklyEvent } from "@/lib/interfaces/events/weekly-event";
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

async function getWeeklyEventById(id: string, eventId: string): Promise<WeeklyEvent | null> {
	try {
		const response = await fetch(
			`https://api.studentcouncil.dk/query/v1/organisations/${id}/weekly-events`,
			{
				cache: "no-store",
			},
		);

		if (!response.ok) {
			return null;
		}

		const data = (await response.json()) as WeeklyEvent[];
		if (!Array.isArray(data)) {
			return null;
		}

		return data.find((event) => String(event.id) === eventId) ?? null;
	} catch {
		return null;
	}
}

export default async function EditWeeklyEventPage({
	params,
}: {
	params: Promise<{ id: string; "event-id": string }>;
}) {
	const { id, "event-id": eventId } = await params;
	const [organisation, event] = await Promise.all([getOrganisation(id), getWeeklyEventById(id, eventId)]);

	if (!organisation || !event) {
		notFound();
	}

	return (
		<div className="mx-auto w-full max-w-3xl space-y-6 p-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Edit Weekly Event</h1>
					<p className="text-sm text-gray-600 dark:text-gray-300">
						Update this recurring weekly event.
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
						Update the name, weekday, and time for this recurring event.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					<WeeklyEventForm
						organisationId={String(organisation.id)}
						organisationPathId={id}
						mode="edit"
						eventId={eventId}
						showDeleteButton
						initialValues={{
							name: event.name ?? "",
							time: event.time ?? "",
							dayOfWeek: event.dayOfWeek,
						}}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
