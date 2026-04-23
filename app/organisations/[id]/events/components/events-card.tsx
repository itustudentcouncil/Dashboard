"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Event as EventItem } from "@/lib/interfaces/events/event";

interface EventsCardProps {
  title: string;
  events: EventItem[];
  organisationId: string;
  showCreateButton?: boolean;
  hideHeader?: boolean;
}

function formatEventDate(dateValue: string): string {
  const parsed = new Date(dateValue);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(parsed);
  }

  return dateValue.split("T")[0] ?? dateValue;
}

function formatEventTime(timeValue: string): string {
  const rawTime = timeValue.includes("T") ? (timeValue.split("T")[1] ?? timeValue) : timeValue;
  const normalized = rawTime.split(".")[0]?.replace("Z", "") ?? rawTime;
  const parts = normalized.split(":");

  if (parts.length >= 2) {
    const hours = parts[0]?.padStart(2, "0") ?? "00";
    const minutes = parts[1]?.padStart(2, "0") ?? "00";
    return `${hours}:${minutes}`;
  }

  return timeValue;
}

export function EventsCard({
  title,
  events,
  organisationId,
  showCreateButton = false,
  hideHeader = false,
}: EventsCardProps) {
  const router = useRouter();

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-[rgba(185,114,114,0.35)] dark:bg-[rgba(40,23,25,0.9)]">
      {!hideHeader ? (
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-[rgba(185,114,114,0.25)] dark:bg-[rgba(50,28,31,0.6)]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          {showCreateButton ? (
            <Button asChild size="sm">
              <Link href={`/organisations/${organisationId}/events/edit/event`}>Create Event</Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      {events.length === 0 ? (
        <div className="px-4 py-6 text-sm text-gray-600 dark:text-gray-300">No events available.</div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-[rgba(185,114,114,0.25)]">
          {events.map((event) => (
            <article
              key={event.id}
              className="space-y-1 px-4 py-4 cursor-pointer transition-all duration-150 hover:bg-gray-50 dark:hover:bg-[rgba(50,28,31,0.4)] active:scale-[0.99] active:brightness-95"
              onClick={() => router.push(`/organisations/${organisationId}/events/edit/event/${event.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{event.name}</p>
                <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/organisations/${organisationId}/events/edit/event/${event.id}`}>Edit</Link>
                  </Button>
                </div>
              </div>
              <p className="text-base font-medium text-gray-700 dark:text-gray-200">
                {formatEventDate(event.date)} at {formatEventTime(event.time)}
              </p>
              {event.description ? (
                <p className="line-clamp-2 text-sm text-gray-700 dark:text-gray-200">{event.description}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
