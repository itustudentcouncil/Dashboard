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

  const name = incomingFormData.get("Name");
  const description = incomingFormData.get("Description");
  const categoryId = incomingFormData.get("CategoryId");
  const banner = incomingFormData.get("Banner");
  const icon = incomingFormData.get("Icon");

  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedCategoryId =
    typeof categoryId === "string"
      ? Number(categoryId)
      : typeof categoryId === "number"
        ? categoryId
        : NaN;

  if (!normalizedName) {
    return NextResponse.json({ message: "name is required" }, { status: 400 });
  }

  if (!Number.isInteger(normalizedCategoryId) || normalizedCategoryId <= 0) {
    return NextResponse.json({ message: "categoryId must be a positive integer" }, { status: 400 });
  }

  if (!(banner instanceof File) || banner.size <= 0) {
    return NextResponse.json({ message: "banner is required" }, { status: 400 });
  }

  if (!(icon instanceof File) || icon.size <= 0) {
    return NextResponse.json({ message: "icon is required" }, { status: 400 });
  }

  forwardFormData.set("Name", normalizedName);
  forwardFormData.set("CategoryId", String(normalizedCategoryId));
  forwardFormData.set("Description", typeof description === "string" ? description.trim() : "");
  forwardFormData.set("Banner", banner);
  forwardFormData.set("Icon", icon);

  const response = await fetch(`${commandApiUrl}/command/v1/organisations`, {
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
