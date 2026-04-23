import { NextResponse } from "next/server";
import { getCommandApiAuth } from "@/lib/auth/command-api-csrf";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function toClientResponse(response: Response, bodyText: string) {
  // HTTP 204/205/304 must not include a response body.
  if (response.status === 204 || response.status === 205 || response.status === 304) {
    return new NextResponse(null, {
      status: response.status,
    });
  }

  return new NextResponse(bodyText, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const auth = await getCommandApiAuth();
  if (!auth.ok) {
    return auth.response;
  }

  const { commandApiUrl, cookieHeader, csrfToken } = auth.data;

  const incomingFormData = await request.formData();
  const forwardFormData = new FormData();
  const name = incomingFormData.get("Name");
  const description = incomingFormData.get("Description");
  const categoryId = incomingFormData.get("CategoryId");
  const banner = incomingFormData.get("Banner");
  const icon = incomingFormData.get("Icon");

  if (typeof name === "string") forwardFormData.set("Name", name);
  if (typeof description === "string") forwardFormData.set("Description", description);
  if (typeof categoryId === "string") forwardFormData.set("CategoryId", categoryId);
  if (banner instanceof File && banner.size > 0) forwardFormData.set("Banner", banner);
  if (icon instanceof File && icon.size > 0) forwardFormData.set("Icon", icon);

  const url = `${commandApiUrl}/command/v1/organisations/${id}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Cookie: cookieHeader,
      RequestVerificationToken: csrfToken,
    },
    body: forwardFormData,
    cache: "no-store",
  });

  const text = await response.text();
  return toClientResponse(response, text);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const auth = await getCommandApiAuth();
  if (!auth.ok) {
    return auth.response;
  }

  const { commandApiUrl, cookieHeader, csrfToken } = auth.data;

  const response = await fetch(`${commandApiUrl}/command/v1/organisation/${id}`, {
    method: "DELETE",
    headers: {
      Cookie: cookieHeader,
      RequestVerificationToken: csrfToken,
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    // Backward compatible fallback for environments using plural route naming.
    const fallbackResponse = await fetch(`${commandApiUrl}/command/v1/organisations/${id}`, {
      method: "DELETE",
      headers: {
        Cookie: cookieHeader,
        RequestVerificationToken: csrfToken,
      },
      cache: "no-store",
    });

    const fallbackText = await fallbackResponse.text();
    return toClientResponse(fallbackResponse, fallbackText);
  }

  const text = await response.text();
  return toClientResponse(response, text);
}
