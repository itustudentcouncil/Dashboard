"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";
import { toast } from "sonner";
import { Timepicker } from "timepicker-ui-react";
import "timepicker-ui/main.css";
import "timepicker-ui/theme-dark.css";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import styles from "@/app/organisations/[id]/events/edit/weekly-event/components/weekly-event-form.module.css";

type EventFormProps = {
  organisationId: string;
  organisationPathId: string;
  mode?: "create" | "edit";
  eventId?: string;
  initialValues?: {
    name: string;
    description: string;
    time: string;
    date: string;
  };
  showDeleteButton?: boolean;
};

const MAX_DESCRIPTION_LENGTH = 500;

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

    return fallbackMessage;
  }

  try {
    const text = await response.text();
    return text || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

function toTimeSpanString(rawValue: string): string | null {
  const value = rawValue.trim();

  const twelveHourMatch = value.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (twelveHourMatch) {
    const [, rawHours, rawMinutes, meridiem] = twelveHourMatch;
    const parsedHours = Number(rawHours);
    const parsedMinutes = Number(rawMinutes);

    if (
      Number.isNaN(parsedHours) ||
      Number.isNaN(parsedMinutes) ||
      parsedHours < 1 ||
      parsedHours > 12 ||
      parsedMinutes < 0 ||
      parsedMinutes > 59
    ) {
      return null;
    }

    let normalizedHours = parsedHours % 12;
    if (meridiem.toUpperCase() === "PM") {
      normalizedHours += 12;
    }

    return `${String(normalizedHours).padStart(2, "0")}:${String(parsedMinutes).padStart(2, "0")}:00`;
  }

  const twentyFourHourMatch = value.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (twentyFourHourMatch) {
    const [, rawHours, rawMinutes, rawSeconds] = twentyFourHourMatch;
    const parsedHours = Number(rawHours);
    const parsedMinutes = Number(rawMinutes);
    const parsedSeconds = Number(rawSeconds ?? "00");

    if (
      Number.isNaN(parsedHours) ||
      Number.isNaN(parsedMinutes) ||
      Number.isNaN(parsedSeconds) ||
      parsedHours < 0 ||
      parsedHours > 23 ||
      parsedMinutes < 0 ||
      parsedMinutes > 59 ||
      parsedSeconds < 0 ||
      parsedSeconds > 59
    ) {
      return null;
    }

    return `${rawHours}:${rawMinutes}:${String(parsedSeconds).padStart(2, "0")}`;
  }

  return null;
}

function toInitialTimeValue(rawTimeValue: string): string {
  const rawTime = rawTimeValue.includes("T") ? (rawTimeValue.split("T")[1] ?? rawTimeValue) : rawTimeValue;
  const normalized = rawTime.split(".")[0]?.replace("Z", "") ?? rawTime;
  const parts = normalized.split(":");

  if (parts.length >= 2) {
    const hours = parts[0]?.padStart(2, "0") ?? "00";
    const minutes = parts[1]?.padStart(2, "0") ?? "00";
    return `${hours}:${minutes}`;
  }

  return "";
}

function toTimepickerDisplayValue(rawTimeValue: string): string {
  const normalizedValue = toInitialTimeValue(rawTimeValue);
  const [rawHours, rawMinutes] = normalizedValue.split(":");
  const parsedHours = Number(rawHours);
  const parsedMinutes = Number(rawMinutes);

  if (
    Number.isNaN(parsedHours) ||
    Number.isNaN(parsedMinutes) ||
    parsedHours < 0 ||
    parsedHours > 23 ||
    parsedMinutes < 0 ||
    parsedMinutes > 59
  ) {
    return "";
  }

  const period = parsedHours >= 12 ? "PM" : "AM";
  const twelveHour = parsedHours % 12 || 12;
  return `${String(twelveHour).padStart(2, "0")}:${String(parsedMinutes).padStart(2, "0")} ${period}`;
}

function toTimepickerEventValue(eventData: { hour?: string; minutes?: string; type?: string }): string {
  if (!eventData.hour || !eventData.minutes) {
    return "";
  }

  const period = eventData.type ? ` ${eventData.type.toUpperCase()}` : "";
  return `${eventData.hour}:${eventData.minutes}${period}`;
}

function toComparableTimeSpanValue(rawTimeValue: string): string | null {
  const rawTime = rawTimeValue.includes("T") ? (rawTimeValue.split("T")[1] ?? rawTimeValue) : rawTimeValue;
  const normalized = rawTime.split(".")[0]?.replace("Z", "") ?? rawTime;
  return toTimeSpanString(normalized);
}

function toDateOnlyIso(rawDateValue: string): string | null {
  const parsed = new Date(rawDateValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())).toISOString();
}

export function EventForm({
  organisationId,
  organisationPathId,
  mode = "create",
  eventId,
  initialValues,
  showDeleteButton = false,
}: EventFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [timeValue, setTimeValue] = useState(initialValues?.time ? toTimepickerDisplayValue(initialValues.time) : "");
  const [date, setDate] = useState<Date | undefined>(() => {
    if (!initialValues?.date) {
      return undefined;
    }

    const parsed = new Date(initialValues.date);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const timepickerOptions = useMemo(
    () => ({
      clock: { type: "12h" as const, autoSwitchToMinutes: true },
      ui: { theme: "dark" as const },
    }),
    []
  );

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTimeValue(event.target.value);
  };

  const handleTimeInput = (event: React.FormEvent<HTMLInputElement>) => {
    setTimeValue(event.currentTarget.value);
  };

  const handleDelete = async () => {
    if (mode !== "edit" || !eventId) {
      toast.error("Missing event ID for delete.");
      return;
    }

    const shouldDelete = window.confirm("Delete this event? This action cannot be undone.");
    if (!shouldDelete) {
      return;
    }

    const deleteEventPromise = async () => {
      const response = await fetch(`/api/organisations/${organisationId}/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await getErrorMessage(response, "Failed to delete event.");
        throw new Error(message);
      }

      return "Event has been deleted.";
    };

    try {
      setIsDeleting(true);

      await toast.promise(deleteEventPromise(), {
        loading: "Deleting event...",
        success: (message) => {
          router.push(`/organisations/${organisationPathId}/events`);
          router.refresh();
          return message;
        },
        error: (error) => error.message || "Failed to delete event.",
      });
    } catch {
      // Error toast is handled by toast.promise.
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const formTimeValue = String(formData.get("time") ?? "").trim();
    const rawTimeValue = (timeValue || formTimeValue).trim();
    const normalizedTimeValue = toTimeSpanString(rawTimeValue);

    if (!name.trim()) {
      toast.warning("Please enter an event name.");
      return;
    }

    if (!date) {
      toast.warning("Please select a date.");
      return;
    }

    if (!rawTimeValue) {
      toast.warning("Please select a time.");
      return;
    }

    if (!normalizedTimeValue) {
      toast.error("Please select a valid time.");
      return;
    }

    if (mode === "edit" && !eventId) {
      toast.error("Missing event ID for update.");
      return;
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      toast.error(`Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`);
      return;
    }

    // Build the combined datetime for future validation, and separate date/time for the API.
    // `time` is an ASP.NET TimeSpan (HH:MM:SS), `date` is a RFC 3339 date-time at midnight UTC.
    const [hours, minutes, seconds] = normalizedTimeValue.split(":").map(Number);
    const dateTime = new Date(date);
    dateTime.setHours(hours ?? 0, minutes ?? 0, seconds ?? 0, 0);

    // Date at midnight UTC — time is sent separately as a TimeSpan
    const dateOnly = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const isoDate = dateOnly.toISOString();

    const initialComparableTime = initialValues?.time ? toComparableTimeSpanValue(initialValues.time) : null;
    const initialComparableDate = initialValues?.date ? toDateOnlyIso(initialValues.date) : null;
    const hasUnchangedDateTimeInEditMode =
      mode === "edit" &&
      initialComparableTime === normalizedTimeValue &&
      initialComparableDate === isoDate;

    const payloadTime: string | null = hasUnchangedDateTimeInEditMode ? null : normalizedTimeValue;
    const payloadDate: string | null = hasUnchangedDateTimeInEditMode ? null : isoDate;

    if (dateTime <= new Date() && !hasUnchangedDateTimeInEditMode) {
      toast.error("The event date and time must be in the future.");
      return;
    }

    const submitEventPromise = async () => {
      const endpoint =
        mode === "edit"
          ? `/api/organisations/${organisationId}/events/${eventId}`
          : `/api/organisations/${organisationId}/events`;

      const response = await fetch(endpoint, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          time: payloadTime,
          date: payloadDate,
        }),
      });

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          mode === "edit" ? "Failed to update event." : "Failed to create event.",
        );
        throw new Error(message);
      }

      return mode === "edit" ? "Event has been updated." : "Event has been created.";
    };

    try {
      setIsSubmitting(true);

      await toast.promise(submitEventPromise(), {
        loading: mode === "edit" ? "Saving event..." : "Creating event...",
        success: (message) => {
          router.push(`/organisations/${organisationPathId}/events`);
          router.refresh();
          return message;
        },
        error: (error) => error.message || (mode === "edit" ? "Failed to update event." : "Failed to create event."),
      });
    } catch {
      // Error toast is handled by toast.promise.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="event-name">
          Event Name
        </label>
        <Input
          id="event-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Annual General Meeting"
          autoComplete="off"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="event-description">
          Description
        </label>
        <textarea
          id="event-description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Describe the event..."
          maxLength={MAX_DESCRIPTION_LENGTH}
          disabled={isSubmitting}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm disabled:opacity-50"
        />
        <p className="text-right text-xs text-muted-foreground">
          {description.length}/{MAX_DESCRIPTION_LENGTH}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date</label>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                data-empty={!date}
                className="w-full justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
              >
                {date ? format(date, "PPP") : <span>Pick a date</span>}
                <ChevronDownIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  setDatePickerOpen(false);
                }}
                defaultMonth={date}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="event-time">
            Time
          </label>
          <Timepicker
            id="event-time"
            name="time"
            placeholder="Select time"
            options={timepickerOptions}
            disabled={isSubmitting}
            defaultValue={timeValue}
            onChange={handleTimeChange}
            onInput={handleTimeInput}
            onConfirm={(eventData) => {
              setTimeValue(toTimepickerEventValue(eventData));
            }}
            onUpdate={(eventData) => {
              const nextValue = toTimepickerEventValue(eventData);
              if (nextValue) {
                setTimeValue(nextValue);
              }
            }}
            onClear={() => setTimeValue("")}
            className={`${styles.timepickerTheme} h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30`}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        {showDeleteButton ? (
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting || isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? "Deleting..." : "Delete Event"}
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={isSubmitting || isDeleting}>
          {isSubmitting ? (mode === "edit" ? "Saving..." : "Creating...") : mode === "edit" ? "Save Changes" : "Create Event"}
        </Button>
      </div>
    </form>
  );
}
