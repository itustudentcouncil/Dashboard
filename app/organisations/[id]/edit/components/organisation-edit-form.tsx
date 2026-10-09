"use client";

import { useState } from "react";
import type { Organisation } from "@/lib/interfaces/organisations/organisation";
import type { QuickLink } from "@/lib/interfaces/organisations/quicklink";
import type { QuickLinkType } from "@/lib/interfaces/organisations/quicklink-type";
import type { Category } from "@/lib/interfaces/organisations/category";
import { OrganisationDetailsFormCard } from "./organisation-details-form";
import { OrganisationImagesFormCard } from "./organisation-images-form";
import {
  OrganisationQuickLinksFormCard,
  type EditableQuickLink,
} from "./organisation-quick-links-form";

type OrganisationEditFormProps = {
  organisation: Organisation;
  categories: Category[];
  quickLinks: QuickLink[];
  linkTypes: QuickLinkType[];
};

type FormStatus = {
  type: "success" | "error";
  message: string;
} | null;

function createEmptyQuickLink(defaultType: QuickLinkType): EditableQuickLink {
  return {
    id: -Date.now(),
    localId: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: "",
    url: "",
    icon: "",
    type: defaultType,
  };
}

export function OrganisationEditForm({ organisation, categories, quickLinks, linkTypes }: OrganisationEditFormProps) {
  const [name, setName] = useState(organisation.name ?? "");
  const [description, setDescription] = useState(organisation.description ?? "");
  const [bannerPath] = useState(organisation.banner ?? "");
  const [iconPath] = useState(organisation.icon ?? "");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    String(organisation.category?.id ?? categories[0]?.id ?? "")
  );

  const defaultLinkType = linkTypes[0] ?? { id: 0, type: "unknown" };

  const [editableQuickLinks, setEditableQuickLinks] = useState<EditableQuickLink[]>(
    quickLinks.map((link, index) => ({ ...link, localId: `${link.id}-${index}` }))
  );
  const [quickLinkIconFiles, setQuickLinkIconFiles] = useState<Record<string, File | null>>({});
  const [dirtyQuickLinkIds, setDirtyQuickLinkIds] = useState<Set<string>>(new Set());
  const [savingQuickLinkIds, setSavingQuickLinkIds] = useState<Set<string>>(new Set());
  const [removingQuickLinkIds, setRemovingQuickLinkIds] = useState<Set<string>>(new Set());
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isSavingImages, setIsSavingImages] = useState(false);
  const [clearImageSelectionToken, setClearImageSelectionToken] = useState(0);
  const [detailsStatus, setDetailsStatus] = useState<FormStatus>(null);
  const [imagesStatus, setImagesStatus] = useState<FormStatus>(null);
  const [quickLinksStatus, setQuickLinksStatus] = useState<FormStatus>(null);

  const bannerPreview = bannerPath ? `https://cdn.studentcouncil.dk/${bannerPath}` : undefined;
  const iconPreview = iconPath ? `https://cdn.studentcouncil.dk/${iconPath}` : undefined;

  const selectedCategory = categories.find((category) => category.id === Number(selectedCategoryId));

  const onQuickLinkChange = (index: number, key: "name" | "url", value: string) => {
    setEditableQuickLinks((prev) => {
      const next = prev.map((link, i) => (i === index ? { ...link, [key]: value } : link));
      const changed = next[index];
      if (changed) {
        setDirtyQuickLinkIds((current) => {
          const updated = new Set(current);
          updated.add(changed.localId);
          return updated;
        });
      }
      return next;
    });
  };

  const onQuickLinkTypeChange = (index: number, typeId: string) => {
    const nextType = linkTypes.find((type) => type.id === Number(typeId));
    if (!nextType) return;

    setEditableQuickLinks((prev) => {
      const next = prev.map((link, i) => (i === index ? { ...link, type: nextType } : link));
      const changed = next[index];
      if (changed) {
        setDirtyQuickLinkIds((current) => {
          const updated = new Set(current);
          updated.add(changed.localId);
          return updated;
        });
      }
      return next;
    });
  };

  const onQuickLinkIconChange = (localId: string, file: File | null) => {
    setQuickLinkIconFiles((prev) => ({ ...prev, [localId]: file }));
    setDirtyQuickLinkIds((current) => {
      const updated = new Set(current);
      updated.add(localId);
      return updated;
    });
  };

  const removeQuickLinkLocally = (index: number) => {
    setEditableQuickLinks((prev) => {
      const toRemove = prev[index];
      if (!toRemove) return prev;

      setQuickLinkIconFiles((current) => {
        const next = { ...current };
        delete next[toRemove.localId];
        return next;
      });

      setDirtyQuickLinkIds((current) => {
        const updated = new Set(current);
        updated.delete(toRemove.localId);
        return updated;
      });

      return prev.filter((_, i) => i !== index);
    });
  };

  const onRemoveQuickLink = async (index: number) => {
    const link = editableQuickLinks[index];
    if (!link) return;

    setQuickLinksStatus(null);
    setRemovingQuickLinkIds((current) => {
      const updated = new Set(current);
      updated.add(link.localId);
      return updated;
    });

    try {
      if (link.id > 0) {
        const response = await fetch(`/api/organisations/${organisation.id}/quick-links/${link.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `Request failed (${response.status})`);
        }
      }

      removeQuickLinkLocally(index);
      setQuickLinksStatus({
        type: "success",
        message: `Quick link \"${link.name || `#${index + 1}`}\" removed.`,
      });
    } catch (error) {
      setQuickLinksStatus({
        type: "error",
        message: `Could not remove quick link: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setRemovingQuickLinkIds((current) => {
        const updated = new Set(current);
        updated.delete(link.localId);
        return updated;
      });
    }
  };

  const onAddQuickLink = () => {
    const newLink = createEmptyQuickLink(defaultLinkType);
    setEditableQuickLinks((prev) => [...prev, newLink]);
    setDirtyQuickLinkIds((current) => {
      const updated = new Set(current);
      updated.add(newLink.localId);
      return updated;
    });
  };

  const onSaveQuickLink = async (index: number) => {
    const link = editableQuickLinks[index];
    if (!link) return;
    if (!link.name.trim() || !link.url.trim()) {
      setQuickLinksStatus({
        type: "error",
        message: "Quick link name and URL are required.",
      });
      return;
    }

    setQuickLinksStatus(null);
    setSavingQuickLinkIds((current) => {
      const updated = new Set(current);
      updated.add(link.localId);
      return updated;
    });

    try {
      const isNewLink = link.id <= 0;
      const response = isNewLink
        ? await (async () => {
            const formData = new FormData();
            formData.append("name", link.name.trim());
            formData.append("link", link.url.trim());
            formData.append("typeId", String(link.type?.id ?? defaultLinkType.id));

            const iconFile = quickLinkIconFiles[link.localId];
            if (iconFile) {
              formData.append("icon", iconFile);
            }

            return fetch(`/api/organisations/${organisation.id}/quick-links`, {
              method: "POST",
              body: formData,
            });
          })()
        : await (async () => {
            const formData = new FormData();
            formData.append("Name", link.name.trim());
            formData.append("Link", link.url.trim());
            formData.append("TypeId", String(link.type?.id ?? defaultLinkType.id));

            const iconFile = quickLinkIconFiles[link.localId];
            if (iconFile) {
              formData.append("Icon", iconFile);
            }

            return fetch(`/api/organisations/${organisation.id}/quick-links/${link.id}`, {
              method: "PATCH",
              body: formData,
            });
          })();

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed (${response.status})`);
      }

      if (isNewLink) {
        let createdLink: { id?: number } | null = null;
        try {
          createdLink = await response.json();
        } catch {
          createdLink = null;
        }

        const createdId = createdLink?.id;
        if (typeof createdId === "number" && createdId > 0) {
          setEditableQuickLinks((prev) =>
            prev.map((item, itemIndex) => (itemIndex === index ? { ...item, id: createdId } : item))
          );
        }
      }

      setQuickLinksStatus({
        type: "success",
        message: `Quick link \"${link.name || `#${index + 1}`}\" saved.`,
      });
      setQuickLinkIconFiles((current) => {
        const next = { ...current };
        delete next[link.localId];
        return next;
      });

      setDirtyQuickLinkIds((current) => {
        const updated = new Set(current);
        updated.delete(link.localId);
        return updated;
      });
    } catch (error) {
      setQuickLinksStatus({
        type: "error",
        message: `Could not save quick link: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setSavingQuickLinkIds((current) => {
        const updated = new Set(current);
        updated.delete(link.localId);
        return updated;
      });
    }
  };

  const saveOrganisation = async (options: { includeBanner: boolean; includeIcon: boolean }) => {
    const formData = new FormData();
    formData.append("Name", name.trim());
    formData.append("Description", description.trim());
    formData.append("CategoryId", String(selectedCategory?.id ?? 0));

    if (options.includeBanner && bannerFile) {
      formData.append("Banner", bannerFile);
    }

    if (options.includeIcon && iconFile) {
      formData.append("Icon", iconFile);
    }

    const response = await fetch(`/api/organisations/${organisation.id}`, {
      method: "PATCH",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed (${response.status})`);
    }
  };

  const onSaveDetails = async () => {
    if (!name.trim()) {
      setDetailsStatus({
        type: "error",
        message: "Organisation name is required.",
      });
      return;
    }

    setIsSavingDetails(true);
    setDetailsStatus(null);
    try {
      await saveOrganisation({ includeBanner: false, includeIcon: false });
      setDetailsStatus({ type: "success", message: "Organisation details saved." });
    } catch (error) {
      setDetailsStatus({
        type: "error",
        message: `Could not save details: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsSavingDetails(false);
    }
  };

  const onSaveImages = async () => {
    setIsSavingImages(true);
    setImagesStatus(null);
    try {
      await saveOrganisation({ includeBanner: true, includeIcon: true });
      setImagesStatus({ type: "success", message: "Organisation images saved." });
      setBannerFile(null);
      setIconFile(null);
      setClearImageSelectionToken((current) => current + 1);
    } catch (error) {
      setImagesStatus({
        type: "error",
        message: `Could not save images: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsSavingImages(false);
    }
  };

  return (
    <form className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Organisation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update organisation details, images, category, and quick links.
        </p>
      </div>

      <OrganisationDetailsFormCard
        name={name}
        description={description}
        selectedCategoryId={selectedCategoryId}
        categories={categories}
        isSaving={isSavingDetails}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        onCategoryChange={setSelectedCategoryId}
        onSaveDetails={onSaveDetails}
        isNameValid={Boolean(name.trim())}
        status={detailsStatus}
      />

      <OrganisationImagesFormCard
        bannerPreview={bannerPreview}
        iconPreview={iconPreview}
        clearImageSelectionToken={clearImageSelectionToken}
        isSaving={isSavingImages}
        onBannerFileChange={setBannerFile}
        onIconFileChange={setIconFile}
        onSaveImages={onSaveImages}
        status={imagesStatus}
      />

      <OrganisationQuickLinksFormCard
        editableQuickLinks={editableQuickLinks}
        linkTypes={linkTypes}
        defaultLinkType={defaultLinkType}
        dirtyQuickLinkIds={dirtyQuickLinkIds}
        onQuickLinkChange={onQuickLinkChange}
        onQuickLinkTypeChange={onQuickLinkTypeChange}
        onQuickLinkIconChange={onQuickLinkIconChange}
        onSaveQuickLink={onSaveQuickLink}
        onRemoveQuickLink={onRemoveQuickLink}
        onAddQuickLink={onAddQuickLink}
        savingQuickLinkIds={savingQuickLinkIds}
        removingQuickLinkIds={removingQuickLinkIds}
        status={quickLinksStatus}
      />
    </form>
  );
}
