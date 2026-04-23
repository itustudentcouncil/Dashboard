"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/forms/image-upload";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QuickLink } from "@/lib/interfaces/organisations/quicklink";
import type { QuickLinkType } from "@/lib/interfaces/organisations/quicklink-type";

export type EditableQuickLink = QuickLink & {
  localId: string;
};

type QuickLinkEditorProps = {
  link: EditableQuickLink;
  index: number;
  defaultLinkType: QuickLinkType;
  linkTypes: QuickLinkType[];
  showSaveButton: boolean;
  isSaving: boolean;
  isRemoving: boolean;
  onQuickLinkChange: (index: number, key: "name" | "url", value: string) => void;
  onQuickLinkTypeChange: (index: number, typeId: string) => void;
  onQuickLinkIconChange: (localId: string, file: File | null) => void;
  onSaveQuickLink: (index: number) => Promise<void> | void;
  onRemoveQuickLink: (index: number) => Promise<void> | void;
};

type OrganisationQuickLinksFormCardProps = {
  editableQuickLinks: EditableQuickLink[];
  linkTypes: QuickLinkType[];
  defaultLinkType: QuickLinkType;
  dirtyQuickLinkIds: Set<string>;
  savingQuickLinkIds: Set<string>;
  removingQuickLinkIds: Set<string>;
  onQuickLinkChange: (index: number, key: "name" | "url", value: string) => void;
  onQuickLinkTypeChange: (index: number, typeId: string) => void;
  onQuickLinkIconChange: (localId: string, file: File | null) => void;
  onSaveQuickLink: (index: number) => Promise<void> | void;
  onRemoveQuickLink: (index: number) => Promise<void> | void;
  onAddQuickLink: () => void;
  status?: {
    type: "success" | "error";
    message: string;
  } | null;
};

function QuickLinkEditor({
  link,
  index,
  defaultLinkType,
  linkTypes,
  showSaveButton,
  isSaving,
  isRemoving,
  onQuickLinkChange,
  onQuickLinkTypeChange,
  onQuickLinkIconChange,
  onSaveQuickLink,
  onRemoveQuickLink,
}: QuickLinkEditorProps) {
  const selectedTypeId = link.type?.id ?? defaultLinkType.id;
  const shouldHideIconUpload = selectedTypeId >= 3 && selectedTypeId <= 9;
  const hasRequiredValues = Boolean(link.name.trim()) && Boolean(link.url.trim());
  const isBusy = isSaving || isRemoving;

  const handleRemove = () => {
    const shouldRemove = window.confirm("Remove this quick link?");
    if (!shouldRemove) {
      return;
    }

    onRemoveQuickLink(index);
  };

  return (
    <div className="rounded-md border border-border p-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <Input
            placeholder="Name"
            value={link.name}
            onChange={(e) => onQuickLinkChange(index, "name", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">URL</label>
          <Input
            placeholder="URL"
            value={link.url}
            onChange={(e) => onQuickLinkChange(index, "url", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Type</label>
          <Select
            value={String(link.type?.id ?? defaultLinkType.id)}
            onValueChange={(value) => onQuickLinkTypeChange(index, value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select link type" />
            </SelectTrigger>
            <SelectContent position="popper" align="start" className="max-h-80 overflow-hidden">
              <SelectGroup className="max-h-72 overflow-y-auto">
                {linkTypes.map((type) => (
                  <SelectItem key={type.id} value={String(type.id)}>
                    {type.type}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        {shouldHideIconUpload ? null : (
          <div className="space-y-2">
            <ImageUpload
              id={`quick-link-icon-${link.localId}`}
              label="Icon"
              initialPreviewUrl={link.icon ? `https://cdn.studentcouncil.dk/${link.icon}` : undefined}
              previewShape="icon"
              onFileChange={(file) => onQuickLinkIconChange(link.localId, file)}
            />
          </div>
        )}
      </div>
      <div className="mt-3 flex justify-end gap-2">
        {showSaveButton ? (
          <Button type="button" size="sm" onClick={() => onSaveQuickLink(index)} disabled={isBusy || !hasRequiredValues}>
            {isSaving ? "Saving..." : "Save Link"}
          </Button>
        ) : null}
        <Button type="button" variant="destructive" size="sm" onClick={handleRemove} disabled={isBusy}>
          <Trash2 className="size-4" />
          {isRemoving ? "Removing..." : "Remove"}
        </Button>
      </div>
    </div>
  );
}

export function OrganisationQuickLinksFormCard({
  editableQuickLinks,
  linkTypes,
  defaultLinkType,
  dirtyQuickLinkIds,
  savingQuickLinkIds,
  removingQuickLinkIds,
  onQuickLinkChange,
  onQuickLinkTypeChange,
  onQuickLinkIconChange,
  onSaveQuickLink,
  onRemoveQuickLink,
  onAddQuickLink,
  status,
}: OrganisationQuickLinksFormCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Links</CardTitle>
        <CardDescription>Manage links displayed for this organisation.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {editableQuickLinks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No quick links yet. Add one below.</p>
        ) : null}

        {editableQuickLinks.map((link, index) => (
          <QuickLinkEditor
            key={`${link.id}-${index}`}
            link={link}
            index={index}
            defaultLinkType={defaultLinkType}
            linkTypes={linkTypes}
            showSaveButton={dirtyQuickLinkIds.has(link.localId)}
            isSaving={savingQuickLinkIds.has(link.localId)}
            isRemoving={removingQuickLinkIds.has(link.localId)}
            onQuickLinkChange={onQuickLinkChange}
            onQuickLinkTypeChange={onQuickLinkTypeChange}
            onQuickLinkIconChange={onQuickLinkIconChange}
            onSaveQuickLink={onSaveQuickLink}
            onRemoveQuickLink={onRemoveQuickLink}
          />
        ))}

        <Button type="button" variant="outline" onClick={onAddQuickLink}>
          <Plus className="size-4" />
          Add Quick Link
        </Button>

        {status ? (
          <p className={`text-sm ${status.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {status.message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
