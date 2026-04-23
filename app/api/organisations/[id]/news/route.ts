import { NextResponse } from "next/server";

import { getCommandApiAuth } from "@/lib/auth/command-api-csrf";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const auth = await getCommandApiAuth();
  if (!auth.ok) {
    return auth.response;
  }

  const { commandApiUrl, cookieHeader, csrfToken } = auth.data;

  const incomingFormData = await request.formData();
  const forwardFormData = new FormData();

  const title = incomingFormData.get("Title");
  const description = incomingFormData.get("Description");
  const article = incomingFormData.get("Article");
  const isPublished = incomingFormData.get("IsPublished");
  const banner = incomingFormData.get("Banner");

  if (typeof title === "string") {
    const value = title.trim();
    if (!value) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }
    forwardFormData.set("Title", value);
  }

  if (typeof description === "string") {
    forwardFormData.set("Description", description.trim());
  }

  if (article instanceof File && article.size > 0) {
    forwardFormData.set("Article", article);
  }

  if (typeof isPublished === "string") {
    forwardFormData.set("IsPublished", isPublished);
  }

  if (banner instanceof File && banner.size > 0) {
    forwardFormData.set("Banner", banner);
  }

  const targetUrl = `${commandApiUrl}/command/v1/organisation/${id}/news/`;

  const response = await fetch(targetUrl, {
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
