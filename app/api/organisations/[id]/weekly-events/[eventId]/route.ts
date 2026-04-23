import { NextResponse } from "next/server";

import { getCommandApiAuth } from "@/lib/auth/command-api-csrf";

type RouteContext = {
  params: Promise<{ id: string; eventId: string }>;
};

type UpdateWeeklyEventPayload = {
  name: string;
  time: string;
  dayOfWeek: number;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id, eventId } = await context.params;

  const auth = await getCommandApiAuth();
  if (!auth.ok) {
    return auth.response;
  }

  const { commandApiUrl, cookieHeader, csrfToken } = auth.data;

  let incoming: unknown;
  try {
    incoming = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
  }

  const rawPayload = (incoming ?? {}) as Partial<UpdateWeeklyEventPayload>;
  const payload: UpdateWeeklyEventPayload = {
    name: typeof rawPayload.name === "string" ? rawPayload.name.trim() : "",
    time: typeof rawPayload.time === "string" ? rawPayload.time.trim() : "",
    dayOfWeek: Number(rawPayload.dayOfWeek ?? 0),
  };

  if (!payload.name || !payload.time || payload.dayOfWeek < 1 || payload.dayOfWeek > 7) {
    return NextResponse.json(
      { message: "Name, time, and a valid day of week are required" },
      { status: 400 },
    );
  }

  const targetUrl = `${commandApiUrl}/command/v1/organisation/${id}/weekly-events/${eventId}`;

  const response = await fetch(targetUrl, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      Cookie: cookieHeader,
      RequestVerificationToken: csrfToken,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id, eventId } = await context.params;

  const auth = await getCommandApiAuth();
  if (!auth.ok) {
    return auth.response;
  }

  const { commandApiUrl, cookieHeader, csrfToken } = auth.data;
  const targetUrl = `${commandApiUrl}/command/v1/organisation/${id}/weekly-events/${eventId}`;

  const response = await fetch(targetUrl, {
    method: "DELETE",
    headers: {
      Cookie: cookieHeader,
      RequestVerificationToken: csrfToken,
    },
    cache: "no-store",
  });

  const contentLength = response.headers.get("content-length");
  const hasBody = contentLength !== "0";

  if (!hasBody || response.status === 204) {
    return new NextResponse(null, {
      status: response.status,
    });
  }

  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "text/plain",
    },
  });
}
