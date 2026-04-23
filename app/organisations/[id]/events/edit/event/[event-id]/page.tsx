import Link from "next/link";
import { notFound } from "next/navigation";

import { EventForm } from "@/app/organisations/[id]/events/edit/event/components/event-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionCookieHeader } from "@/lib/auth/session";
import type { Event as EventItem } from "@/lib/interfaces/events/event";
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

async function getEventById(id: string, eventId: string): Promise<EventItem | null> {
  const endpoints = [
    `https://api.studentcouncil.dk/query/v1/organisations/${id}/events?filter=0`,
    `https://api.studentcouncil.dk/query/v1/organisations/${id}/events?filter=1`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        cache: "no-store",
      });

      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as EventItem[];
      if (!Array.isArray(data)) {
        continue;
      }

      const matchedEvent = data.find((event) => String(event.id) === eventId);
      if (matchedEvent) {
        return matchedEvent;
      }
    } catch {
      // Continue to the next endpoint.
    }
  }

  return null;
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string; "event-id": string }>;
}) {
  const { id, "event-id": eventId } = await params;
  const [organisation, event] = await Promise.all([getOrganisation(id), getEventById(id, eventId)]);

  if (!organisation || !event) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Update details for this event.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/organisations/${id}/events`}>Back to Events</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>
            Update the name, description, date, and time for the event.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <EventForm
            organisationId={String(organisation.id)}
            organisationPathId={id}
            mode="edit"
            eventId={eventId}
            showDeleteButton
            initialValues={{
              name: event.name ?? "",
              description: event.description ?? "",
              time: event.time ?? "",
              date: event.date,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
