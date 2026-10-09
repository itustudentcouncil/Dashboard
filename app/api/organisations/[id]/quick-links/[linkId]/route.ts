import { NextResponse } from "next/server";
import { getCommandApiAuth } from "@/lib/auth/command-api-csrf";

type RouteContext = {
  params: Promise<{ id: string; linkId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id, linkId } = await context.params;
  const auth = await getCommandApiAuth();
  if (!auth.ok) {
    return auth.response;
  }

  const { commandApiUrl, cookieHeader, csrfToken } = auth.data;

  const incomingFormData = await request.formData();
  const forwardFormData = new FormData();

  const name = incomingFormData.get("Name");
  const link = incomingFormData.get("Link");
  const typeId = incomingFormData.get("TypeId");
  const icon = incomingFormData.get("Icon");

  if (typeof name === "string") forwardFormData.set("Name", name);
  if (typeof link === "string") forwardFormData.set("Link", link);
  if (typeof typeId === "string") forwardFormData.set("TypeId", typeId);
  if (icon instanceof File && icon.size > 0) forwardFormData.set("Icon", icon);

  const targetUrl = `${commandApiUrl}/command/v1/organisation/${id}/quick-links/${linkId}`;

  const response = await fetch(targetUrl, {
    method: "PATCH",
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

export async function DELETE(_request: Request, context: RouteContext) {
  const { id, linkId } = await context.params;
  const auth = await getCommandApiAuth();
  if (!auth.ok) {
    return auth.response;
  }

  const { commandApiUrl, cookieHeader, csrfToken } = auth.data;

  const targetUrl = `${commandApiUrl}/command/v1/organisation/${id}/quick-links/${linkId}`;

  const response = await fetch(targetUrl, {
    method: "DELETE",
    headers: {
      Cookie: cookieHeader,
      RequestVerificationToken: csrfToken,
    },
    cache: "no-store",
  });

  // 204 No Content — return immediately with no body
  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
}
