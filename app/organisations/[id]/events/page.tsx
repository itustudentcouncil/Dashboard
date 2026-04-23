import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EventsCard } from "./components/events-card";
import { WeeklyEventsCard } from "./components/weekly-events-card";

import { Event as EventItem } from "@/lib/interfaces/events/event";
import { WeeklyEvent } from "@/lib/interfaces/events/weekly-event";

async function getEvents(id: string, filter: 0 | 1): Promise<EventItem[]> {
  try {
    const response = await fetch(
      `https://api.studentcouncil.dk/query/v1/organisations/${id}/events?filter=${filter}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error(`Events API returned ${response.status} for filter ${filter}`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return [];
  }
}

async function getWeeklyEvents(id: string): Promise<WeeklyEvent[]> {
  try {
    const response = await fetch(
      `https://api.studentcouncil.dk/query/v1/organisations/${id}/weekly-events`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error(`Weekly events API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch weekly events:", error);
    return [];
  }
}

export default async function EventsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [weeklyEvents, upcomingEvents, pastEvents] = await Promise.all([
    getWeeklyEvents(id),
    getEvents(id, 0),
    getEvents(id, 1),
  ]);

  return (
    <div className="flex min-h-screen flex-1 flex-col font-sans">
      <main className="flex w-full flex-1 flex-col md:flex-row">
        <aside className="w-full border-b border-gray-200 px-6 py-6 md:w-105 md:border-b-0 md:border-r dark:border-[rgba(185,114,114,0.25)]">
          <WeeklyEventsCard weeklyEvents={weeklyEvents} organisationId={id} />
        </aside>

        <section className="flex-1 space-y-6 px-6 py-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Upcoming Events</h2>
              <Button asChild size="sm">
                <Link href={`/organisations/${id}/events/edit/event`}>Create Event</Link>
              </Button>
            </div>
            <EventsCard
              title="Upcoming Events"
              events={upcomingEvents}
              organisationId={id}
              hideHeader
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Past Events</h2>
            </div>
            <EventsCard title="Past Events" events={pastEvents} organisationId={id} hideHeader />
          </div>
        </section>
      </main>
    </div>
  );
}
