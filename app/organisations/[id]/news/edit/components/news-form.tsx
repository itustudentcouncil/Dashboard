"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ImageUpload } from "@/components/forms/image-upload";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { MdxEditorPanel } from "@/app/organisations/[id]/news/edit/components/mdx-editor-panel";

const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 500;

type NewsFormProps = {
  organisationId: string;
  organisationPathId: string;
  mode?: "create" | "edit";
  newsId?: string;
  initialValues?: {
    title: string;
    description: string;
    content: string;
    isPublished: boolean;
    bannerPath?: string;
  };
};

async function getErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const data = (await response.json()) as { message?: string };
      return data?.message || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }

  try {
    const text = await response.text();
    return text || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export function NewsForm({
  organisationId,
  organisationPathId,
  mode = "create",
  newsId,
  initialValues,
}: NewsFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [content, setContent] = useState(initialValues?.content ?? "");
  const [isPublished, setIsPublished] = useState(initialValues?.isPublished ?? false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const initialBannerPreviewUrl = useMemo(() => {
    if (!initialValues?.bannerPath) {
      return undefined;
    }

    return `https://cdn.studentcouncil.dk/${initialValues.bannerPath}`;
  }, [initialValues?.bannerPath]);

  const submit = async (publishChoice: boolean) => {
    if (!title.trim()) {
      toast.warning("Please enter a title.");
      return;
    }

    if (title.trim().length > TITLE_MAX_LENGTH) {
      toast.error(`Title cannot exceed ${TITLE_MAX_LENGTH} characters.`);
      return;
    }

    if (description.length > DESCRIPTION_MAX_LENGTH) {
      toast.error(`Description cannot exceed ${DESCRIPTION_MAX_LENGTH} characters.`);
      return;
    }

    if (!content.trim()) {
      toast.warning("Please provide article content.");
      return;
    }

    if (mode === "edit" && !newsId) {
      toast.error("Missing news ID for update.");
      return;
    }

    const formData = new FormData();
    formData.set("Title", title.trim());
    formData.set("Description", description.trim());
    formData.set("Article", new File([content], "article.mdx", { type: "text/markdown" }));
    formData.set("IsPublished", String(publishChoice));

    if (bannerFile) {
      formData.set("Banner", bannerFile);
    }

    const endpoint = mode === "edit"
      ? `/api/organisations/${organisationId}/news/${newsId}`
      : `/api/organisations/${organisationId}/news`;

    const method = mode === "edit" ? "PATCH" : "POST";

    const submitPromise = async () => {
      const response = await fetch(endpoint, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          mode === "edit" ? "Failed to update article." : "Failed to create article.",
        );
        throw new Error(message);
      }

      return mode === "edit" ? "Article updated." : publishChoice ? "Article published." : "Draft saved.";
    };

    try {
      setIsSubmitting(true);
      await toast.promise(submitPromise(), {
        loading: mode === "edit" ? "Saving article..." : publishChoice ? "Publishing article..." : "Saving draft...",
        success: (message) => {
          router.push(`/organisations/${organisationPathId}/news`);
          router.refresh();
          return message;
        },
        error: (error) => error.message || (mode === "edit" ? "Failed to update article." : "Failed to create article."),
      });
    } catch {
      // Error toast is handled by toast.promise.
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteArticle = async () => {
    if (!newsId) return;
    if (!confirm("Are you sure you want to delete this article? This cannot be undone.")) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/organisations/${organisationId}/news/${newsId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await getErrorMessage(response, "Failed to delete article.");
        toast.error(message);
        return;
      }

      toast.success("Article deleted.");
      router.push(`/organisations/${organisationPathId}/news`);
      router.refresh();
    } catch {
      toast.error("Failed to delete article.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (mode === "edit") {
          void submit(isPublished);
        }
      }}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="news-title">Title</label>
        <Input
          id="news-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={TITLE_MAX_LENGTH}
          disabled={isSubmitting}
          placeholder="Article title"
        />
        <p className="text-right text-xs text-muted-foreground">{title.length}/{TITLE_MAX_LENGTH}</p>
      </div>

      <div className="grid w-full items-stretch gap-4 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="news-description">Description</label>
          <textarea
            id="news-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={DESCRIPTION_MAX_LENGTH}
            disabled={isSubmitting}
            className="h-full min-h-60 flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm disabled:opacity-50"
            placeholder="Short summary shown in cards"
          />
          <p className="text-right text-xs text-muted-foreground">{description.length}/{DESCRIPTION_MAX_LENGTH}</p>
        </div>
        <div className="h-full min-h-0">
          <ImageUpload
            id="news-banner"
            label="Banner Image"
            onFileChange={setBannerFile}
            initialPreviewUrl={initialBannerPreviewUrl}
            previewShape="banner"
            pickerTopSpacingClassName="mt-2"
          />
        </div>
      </div>

      <MdxEditorPanel value={content} onChange={setContent} disabled={isSubmitting} />

      <div className="flex items-center justify-between gap-3">
        {mode === "create" ? (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => void submit(false)}
            >
              {isSubmitting ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => void submit(true)}
            >
              {isSubmitting ? "Publishing..." : "Publish"}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting || isDeleting}
              onClick={() => void deleteArticle()}
            >
              {isDeleting ? "Deleting..." : "Delete Article"}
            </Button>
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={isPublished}
                  onCheckedChange={(checked) => setIsPublished(checked === true)}
                  disabled={isSubmitting || isDeleting}
                />
                Published
              </label>
              <Button type="submit" disabled={isSubmitting || isDeleting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </>
        )}
      </div>
    </form>
  );
}
