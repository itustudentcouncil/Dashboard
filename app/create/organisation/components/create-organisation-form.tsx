"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ImageUpload } from "@/components/forms/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/lib/interfaces/organisations/category";

type CreateOrganisationFormProps = {
  categories: Category[];
};

type CreateOrganisationResponse = {
  id?: number | string;
  organisationId?: number | string;
  organizationId?: number | string;
  data?: {
    id?: number | string;
  };
};

function getCreatedOrganisationId(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as CreateOrganisationResponse;

  const rawId = data.id ?? data.organisationId ?? data.organizationId ?? data.data?.id;
  if (typeof rawId === "number" && Number.isFinite(rawId) && rawId > 0) {
    return rawId;
  }

  if (typeof rawId === "string") {
    const parsed = Number(rawId);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

export function CreateOrganisationForm({ categories }: CreateOrganisationFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categories[0] ? String(categories[0].id) : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = useMemo(() => {
    return (
      name.trim().length > 0 &&
      selectedCategoryId.length > 0 &&
      bannerFile instanceof File &&
      iconFile instanceof File
    );
  }, [bannerFile, iconFile, name, selectedCategoryId]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      toast.warning("Please enter an organisation name.");
      return;
    }

    if (!selectedCategoryId) {
      toast.warning("Please select a category.");
      return;
    }

    if (!(bannerFile instanceof File)) {
      toast.warning("Please upload a banner image.");
      return;
    }

    if (!(iconFile instanceof File)) {
      toast.warning("Please upload an icon image.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("Name", name.trim());
      formData.append("Description", description.trim());
      formData.append("CategoryId", selectedCategoryId);
      formData.append("Banner", bannerFile as File);
      formData.append("Icon", iconFile as File);

      const response = await fetch("/api/organisations", {
        method: "POST",
        body: formData,
      });

      const raw = await response.text();
      let payload: unknown = null;

      if (raw) {
        try {
          payload = JSON.parse(raw);
        } catch {
          payload = raw;
        }
      }

      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "message" in payload
            ? String((payload as { message?: unknown }).message ?? "Failed to create organisation")
            : "Failed to create organisation";

        throw new Error(message);
      }

      const createdId = getCreatedOrganisationId(payload);
      if (!createdId) {
        throw new Error("Organisation was created, but no organisation id was returned.");
      }

      toast.success("Organisation created.");
      router.push(`/organisations/${createdId}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create organisation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Organisation</CardTitle>
        <CardDescription>Provide the required details and submit to create a new organisation.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="org-name">
                Name
              </label>
              <Input
                id="org-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Organisation name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent position="popper" align="start" className="max-h-80 overflow-hidden">
                  <SelectGroup className="max-h-72 overflow-y-auto">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="org-description">
              Description
            </label>
            <textarea
              id="org-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              placeholder="Optional description"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <ImageUpload
                id="org-banner-file"
                label="Banner Image"
                previewShape="banner"
                onFileChange={setBannerFile}
              />
            </div>
            <div className="space-y-2">
              <ImageUpload
                id="org-icon-file"
                label="Icon Image"
                previewShape="icon"
                onFileChange={setIconFile}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/">Cancel</Link>
            </Button>
            <Button type="submit" disabled={!isFormValid || isSubmitting || categories.length === 0}>
              {isSubmitting ? "Creating..." : "Create Organisation"}
            </Button>
          </div>

          {categories.length === 0 ? <p className="text-sm text-red-600">No categories are available.</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
