"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { News } from "@/lib/interfaces/news/news";

type NewsCardProps = {
	article: News;
	organisationId: string;
};

function formatDate(value: string): string {
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return value;
	}

	return new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(parsed);
}

export function NewsCard({ article, organisationId }: NewsCardProps) {
	const router = useRouter();
	const bannerUrl = article.banner ? `https://cdn.studentcouncil.dk/${article.banner}` : null;

	return (
		<article
			className="overflow-hidden rounded-lg border border-gray-200 bg-white cursor-pointer transition-all duration-150 hover:bg-gray-50 dark:border-[rgba(185,114,114,0.35)] dark:bg-[rgba(40,23,25,0.9)] dark:hover:bg-[rgba(50,28,31,0.4)] active:scale-[0.99] active:brightness-95"
			onClick={() => router.push(`/organisations/${organisationId}/news/edit/${article.id}`)}
		>
			{article.isPublished && bannerUrl ? (
				<div className="relative h-40 w-full overflow-hidden">
					<Image
						src={bannerUrl}
						alt={article.title}
						fill
						className="object-cover"
					/>
				</div>
			) : null}

			<div className="space-y-2 px-4 py-4">
				<div className="flex items-start justify-between gap-3">
					<h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{article.title}</h3>
					<div onClick={(e) => e.stopPropagation()} className="shrink-0">
						<Button asChild size="sm" variant="outline">
							<Link href={`/organisations/${organisationId}/news/edit/${article.id}`}>Edit</Link>
						</Button>
					</div>
				</div>

				{article.description ? (
					<p className="line-clamp-2 text-sm text-gray-700 dark:text-gray-200">{article.description}</p>
				) : (
					<p className="text-sm text-gray-500 dark:text-gray-300">No description</p>
				)}

				{article.isPublished && article.publishedAt ? (
					<p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
						Published: {formatDate(article.publishedAt)}
					</p>
				) : (
					<p className="text-xs font-medium text-gray-600 dark:text-gray-300">
						Created: {formatDate(article.createdAt)}
					</p>
				)}
			</div>
		</article>
	);
}
