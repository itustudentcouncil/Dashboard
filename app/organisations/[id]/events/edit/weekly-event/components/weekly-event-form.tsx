"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Timepicker } from "timepicker-ui-react";
import styles from "./weekly-event-form.module.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS_OF_WEEK = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "7", label: "Sunday" },
];

type WeeklyEventFormProps = {
  organisationId: string;
  organisationPathId: string;
  mode?: "create" | "edit";
  eventId?: string;
  initialValues?: {
    name: string;
    time: string;
    dayOfWeek: number;
  };
  showDeleteButton?: boolean;
};

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

export function WeeklyEventForm({
  organisationId,
  organisationPathId,
  mode = "create",
  eventId,
  initialValues,
  showDeleteButton = false,
}: WeeklyEventFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialValues?.name ?? "");
  const [dayOfWeek, setDayOfWeek] = useState(String(initialValues?.dayOfWeek ?? 1));
  const [timeValue, setTimeValue] = useState(initialValues?.time ? toTimepickerDisplayValue(initialValues.time) : "");
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
      toast.error("Missing weekly event ID for delete.");
      return;
    }

    const shouldDelete = window.confirm("Delete this weekly event? This action cannot be undone.");
    if (!shouldDelete) {
      return;
    }

    const deleteWeeklyEventPromise = async () => {
      const response = await fetch(`/api/organisations/${organisationId}/weekly-events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await getErrorMessage(response, "Failed to delete weekly event.");
        throw new Error(message);
      }

      return "Weekly event has been deleted.";
    };

    try {
      setIsDeleting(true);

      await toast.promise(deleteWeeklyEventPromise(), {
        loading: "Deleting weekly event...",
        success: (message) => {
          router.push(`/organisations/${organisationPathId}/events`);
          router.refresh();
          return message;
        },
        error: (error) => error.message || "Failed to delete weekly event.",
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

    if (!name.trim() || !rawTimeValue) {
      toast.warning("Please enter an event name and time.");
      return;
    }

    if (mode === "edit" && !eventId) {
      toast.error("Missing weekly event ID for update.");
      return;
    }

    if (!normalizedTimeValue) {
      toast.error("Please select a valid time.");
      return;
    }

    const submitWeeklyEventPromise = async () => {
      const endpoint =
        mode === "edit"
          ? `/api/organisations/${organisationId}/weekly-events/${eventId}`
          : `/api/organisations/${organisationId}/weekly-events`;

      const response = await fetch(endpoint, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          time: normalizedTimeValue,
          dayOfWeek: Number(dayOfWeek),
        }),
      });

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          mode === "edit" ? "Failed to update weekly event." : "Failed to create weekly event.",
        );
        throw new Error(message);
      }

      return mode === "edit" ? "Weekly event has been updated." : "Weekly event has been created.";
    };

    try {
      setIsSubmitting(true);

      await toast.promise(submitWeeklyEventPromise(), {
        loading: mode === "edit" ? "Saving weekly event..." : "Creating weekly event...",
        success: (message) => {
          router.push(`/organisations/${organisationPathId}/events`);
          router.refresh();
          return message;
        },
        error:
          (error) =>
            error.message ||
            (mode === "edit" ? "Failed to update weekly event." : "Failed to create weekly event."),
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
        <label className="text-sm font-medium" htmlFor="weekly-event-name">
          Event Name
        </label>
        <Input
          id="weekly-event-name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g Board game night"
          autoComplete="off"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="weekly-event-time">
            Time
          </label>
          <Timepicker
            id="weekly-event-time"
            name="time"
            placeholder="Select time"
            options={timepickerOptions}
            disabled={isSubmitting || isDeleting}
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

        <div className="space-y-2">
          <label className="text-sm font-medium">Day of Week</label>
          <Select name="dayOfWeek" value={dayOfWeek} onValueChange={setDayOfWeek}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a weekday" />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              <SelectGroup>
                {DAYS_OF_WEEK.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
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
            {isDeleting ? "Deleting..." : "Delete Weekly Event"}
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={isSubmitting || isDeleting}>
          {isSubmitting
            ? mode === "edit"
              ? "Saving..."
              : "Creating..."
            : mode === "edit"
              ? "Save Changes"
              : "Create Weekly Event"}
        </Button>
      </div>
    </form>
  );
}
