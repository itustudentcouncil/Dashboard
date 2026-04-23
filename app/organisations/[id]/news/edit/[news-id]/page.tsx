import Link from "next/link";
import { notFound } from "next/navigation";

import { NewsForm } from "@/app/organisations/[id]/news/edit/components/news-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionCookieHeader } from "@/lib/auth/session";
import type { News } from "@/lib/interfaces/news/news";
import type { Organisation } from "@/lib/interfaces/organisations/organisation";

async function getOrganisation(id: string): Promise<Organisation | null> {
  const sessionCookieHeader = await getSessionCookieHeader();

  try {
    const response = await fetch(`https://api.studentcouncil.dk/query/v1/organisations/${id}`, {
      next: { revalidate: 0 },
      headers: sessionCookieHeader ? { Cookie: sessionCookieHeader } : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Organisation;
  } catch {
    return null;
  }
}

async function getNewsById(id: string, newsId: string): Promise<News | null> {
  try {
    const response = await fetch(
      `https://api.studentcouncil.dk/query/v1/organisations/${id}/news?includeDrafts=true`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as News[];
    if (!Array.isArray(data)) {
      return null;
    }

    return data.find((article) => String(article.id) === newsId) ?? null;
  } catch {
    return null;
  }
}

async function getNewsContent(contentPath: string | undefined): Promise<string> {
  if (!contentPath) {
    return "";
  }

  const url = contentPath.startsWith("http") ? contentPath : `https://cdn.studentcouncil.dk/${contentPath}`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      return "";
    }

    return await response.text();
  } catch {
    return "";
  }
}

export default async function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string; "news-id": string }>;
}) {
  const { id, "news-id": newsId } = await params;

  const [organisation, article] = await Promise.all([
    getOrganisation(id),
    getNewsById(id, newsId),
  ]);

  if (!organisation || !article) {
    notFound();
  }

  const initialContent = await getNewsContent(article.contentPath);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit News Article</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Update content and publishing status for this article.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/organisations/${id}/news`}>Back to News</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Article Details</CardTitle>
          <CardDescription>
            Edit the banner, summary, and MDX body for this article.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <NewsForm
            organisationId={String(organisation.id)}
            organisationPathId={id}
            mode="edit"
            newsId={newsId}
            initialValues={{
              title: article.title ?? "",
              description: article.description ?? "",
              content: initialContent,
              isPublished: article.isPublished,
              bannerPath: article.banner,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
