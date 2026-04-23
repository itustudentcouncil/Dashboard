import { News } from "@/lib/interfaces/news/news";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { NewsCard } from "@/app/organisations/[id]/news/components/news-card";

async function getNews(id: string): Promise<News[]> {
  try {
    const response = await fetch(`https://api.studentcouncil.dk/query/v1/organisations/${id}/news?includeDrafts=true`, {
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      console.error(`API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch organisation news:", error);
    return [];
  }
}

export default async function NewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const news = await getNews(id);
  const publishedArticles = news.filter((article) => article.isPublished);
  const draftArticles = news.filter((article) => !article.isPublished);

  return (
    <div className="flex flex-1 flex-col font-sans">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">News</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Manage published and draft articles for this Student Organisation.
            </p>
          </div>
          <Button asChild>
            <Link href={`/organisations/${id}/news/edit`}>Create News</Link>
          </Button>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Drafts</h2>
          {draftArticles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
              No drafts yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {draftArticles.map((article) => (
                <NewsCard key={article.id} article={article} organisationId={id} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Published Articles</h2>
          {publishedArticles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
              No published articles yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {publishedArticles.map((article) => (
                <NewsCard key={article.id} article={article} organisationId={id} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}