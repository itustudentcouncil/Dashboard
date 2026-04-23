import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { WeeklyEvent } from "@/lib/interfaces/events/weekly-event";

interface WeeklyEventsCardProps {
  weeklyEvents: WeeklyEvent[];
  organisationId: string;
}

const DAYS_OF_WEEK = [
  { id: 1, name: "Monday" },
  { id: 2, name: "Tuesday" },
  { id: 3, name: "Wednesday" },
  { id: 4, name: "Thursday" },
  { id: 5, name: "Friday" },
  { id: 6, name: "Saturday" },
  { id: 7, name: "Sunday" },
];

export function WeeklyEventsCard({ weeklyEvents, organisationId }: WeeklyEventsCardProps) {

  const eventsByDay = DAYS_OF_WEEK.map((day) => ({
    ...day,
    events: weeklyEvents.filter((event) => event.dayOfWeek === day.id),
  }));

  const today = new Date();
  const currentDayOfWeek = today.getDay() === 0 ? 7 : today.getDay();

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Weekly Events</h2>
        <Button asChild size="sm">
          <Link href={`/organisations/${organisationId}/events/edit/weekly-event`}>Add</Link>
        </Button>
      </div>

      {weeklyEvents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
          No weekly events yet. Click Add to create one.
        </div>
      ) : null}

      {eventsByDay.map((day) => {
        if (day.events.length === 0) {
          return null;
        }

        return (
          <div
            key={day.id}
            className={`overflow-hidden rounded-lg border ${
              day.id === currentDayOfWeek
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-gray-200 bg-white dark:border-[rgba(185,114,114,0.35)] dark:bg-[rgba(40,23,25,0.9)]"
            }`}
          >
            <div
              className={`border-b px-4 py-2 ${
                day.id === currentDayOfWeek
                  ? "border-primary/20 bg-primary/10"
                  : "border-gray-200 bg-gray-50 dark:border-[rgba(185,114,114,0.25)] dark:bg-[rgba(50,28,31,0.6)]"
              }`}
            >
              <h3
                className={`text-sm font-bold ${
                  day.id === currentDayOfWeek
                    ? "text-primary"
                    : "text-gray-900 dark:text-gray-100"
                }`}
              >
                {day.name} {day.id === currentDayOfWeek ? "(Today)" : ""}
              </h3>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-[rgba(185,114,114,0.25)]">
              {day.events.map((event) => (
                <div
                  key={event.id}
                  className="space-y-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-[rgba(50,28,31,0.4)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-bold text-gray-900 dark:text-gray-100">
                        {event.name}
                      </p>

                      {event.organisation ? (
                        <div className="mt-1.5 flex items-center gap-2">
                          {event.organisation.icon ? (
                            <div className="relative h-7 w-7 overflow-hidden rounded-full border border-gray-200 dark:border-[rgba(185,114,114,0.5)]">
                              <Image
                                src={`https://cdn.studentcouncil.dk/${event.organisation.icon}`}
                                alt={event.organisation.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : null}
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {event.organisation.name}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="shrink-0 text-right mr-1.5">
                      <p className="text-sm font-medium text-primary">
                        {event.time.split(":").slice(0, 2).join(":")}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/organisations/${organisationId}/events/edit/weekly-event/${event.id}`}>
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
