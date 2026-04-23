import { NextResponse } from "next/server";

import { getCommandApiAuth } from "@/lib/auth/command-api-csrf";

type RouteContext = {
  params: Promise<{ id: string; eventId: string }>;
};

type UpdateEventPayload = {
  name: string;
  description: string;
  time: string | null;
  date: string | null;
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

  const rawPayload = (incoming ?? {}) as Partial<UpdateEventPayload>;
  const payload: UpdateEventPayload = {
    name: typeof rawPayload.name === "string" ? rawPayload.name.trim() : "",
    description: typeof rawPayload.description === "string" ? rawPayload.description.trim() : "",
    time: rawPayload.time === null ? null : typeof rawPayload.time === "string" ? rawPayload.time.trim() : null,
    date: rawPayload.date === null ? null : typeof rawPayload.date === "string" ? rawPayload.date.trim() : null,
  };

  const targetUrl = `${commandApiUrl}/command/v1/organisation/${id}/events/${eventId}`;

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
  const targetUrl = `${commandApiUrl}/command/v1/organisation/${id}/events/${eventId}`;

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
