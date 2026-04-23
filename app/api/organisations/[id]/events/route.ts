import { NextResponse } from "next/server";

import { getCommandApiAuth } from "@/lib/auth/command-api-csrf";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type CreateEventPayload = {
  name: string;
  description: string;
  time: string;
  date: string;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

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

  const rawPayload = (incoming ?? {}) as Partial<CreateEventPayload>;
  const payload: CreateEventPayload = {
    name: typeof rawPayload.name === "string" ? rawPayload.name.trim() : "",
    description: typeof rawPayload.description === "string" ? rawPayload.description.trim() : "",
    time: typeof rawPayload.time === "string" ? rawPayload.time.trim() : "",
    date: typeof rawPayload.date === "string" ? rawPayload.date.trim() : "",
  };

  if (!payload.name || !payload.time || !payload.date) {
    return NextResponse.json(
      { message: "Name, time, and date are required" },
      { status: 400 },
    );
  }

  const targetUrl = `${commandApiUrl}/command/v1/organisation/${id}/events`;

  const response = await fetch(targetUrl, {
    method: "POST",
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
