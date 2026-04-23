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

  const name = incomingFormData.get("name");
  const link = incomingFormData.get("link");
  const typeId = incomingFormData.get("typeId");
  const icon = incomingFormData.get("icon");

  if (typeof name === "string") forwardFormData.set("name", name);
  if (typeof link === "string") forwardFormData.set("link", link);
  if (typeof typeId === "string") forwardFormData.set("typeId", typeId);
  if (icon instanceof File && icon.size > 0) forwardFormData.set("icon", icon);

  const targetUrl = `${commandApiUrl}/command/v1/organisation/${id}/quick-links`;

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
