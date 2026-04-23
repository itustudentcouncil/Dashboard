"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/forms/image-upload";

type OrganisationImagesFormCardProps = {
  bannerPreview?: string;
  iconPreview?: string;
  clearImageSelectionToken: number;
  isSaving: boolean;
  onBannerFileChange: (file: File | null) => void;
  onIconFileChange: (file: File | null) => void;
  onSaveImages: () => void;
  status?: {
    type: "success" | "error";
    message: string;
  } | null;
};

export function OrganisationImagesFormCard({
  bannerPreview,
  iconPreview,
  clearImageSelectionToken,
  isSaving,
  onBannerFileChange,
  onIconFileChange,
  onSaveImages,
  status,
}: OrganisationImagesFormCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Images</CardTitle>
        <CardDescription>Upload new banner and icon images.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <ImageUpload
              key={`banner-${clearImageSelectionToken}`}
              id="org-banner-file"
              label="Banner Image"
              initialPreviewUrl={bannerPreview}
              previewShape="banner"
              onFileChange={onBannerFileChange}
            />
          </div>

          <div className="space-y-2">
            <ImageUpload
              key={`icon-${clearImageSelectionToken}`}
              id="org-icon-file"
              label="Icon Image"
              initialPreviewUrl={iconPreview}
              previewShape="icon"
              onFileChange={onIconFileChange}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={onSaveImages} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Images"}
          </Button>
        </div>

        {status ? (
          <p className={`text-sm ${status.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {status.message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
