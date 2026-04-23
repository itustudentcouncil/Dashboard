import { NextResponse } from "next/server";

import { getCommandApiAuth } from "@/lib/auth/command-api-csrf";

export async function POST(request: Request) {
  const auth = await getCommandApiAuth();
  if (!auth.ok) {
    return auth.response;
  }

  const { commandApiUrl, cookieHeader, csrfToken } = auth.data;

  const incomingFormData = await request.formData();
  const forwardFormData = new FormData();

  const title = incomingFormData.get("Title");
  const banner = incomingFormData.get("Banner");
  const content = incomingFormData.get("Content");
  const startDate = incomingFormData.get("StartDate");
  const endDate = incomingFormData.get("EndDate");
  const isOngoing = incomingFormData.get("IsOngoing");

  if (typeof title === "string") {
    const value = title.trim();
    if (!value) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }
    forwardFormData.set("Title", value);
  }

  if (banner instanceof File && banner.size > 0) {
    forwardFormData.set("Banner", banner);
  }

  if (content instanceof File && content.size > 0) {
    forwardFormData.set("Content", content);
  }

  if (typeof startDate === "string" && startDate.trim()) {
    forwardFormData.set("StartDate", startDate);
  }

  if (typeof isOngoing === "string") {
    forwardFormData.set("IsOngoing", isOngoing);
  }

  // For ongoing projects, EndDate should be null on the backend; omit the field.
  if (typeof endDate === "string" && endDate.trim()) {
    forwardFormData.set("EndDate", endDate);
  }

  const response = await fetch(`${commandApiUrl}/command/v1/projects`, {
    method: "POST",
    headers: {
      Cookie: cookieHeader,
      RequestVerificationToken: csrfToken,
    },
    body: forwardFormData,
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
