import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectForm } from "@/app/organisations/[id]/projects/edit/components/project-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionCookieHeader } from "@/lib/auth/session";
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

export default async function CreateProjectPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const organisation = await getOrganisation(id);

	if (!organisation) {
		notFound();
	}

	return (
		<div className="mx-auto w-full max-w-6xl space-y-6 p-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Create Project</h1>
					<p className="text-sm text-gray-600 dark:text-gray-300">
						Add a new Student Council project with dates, banner, and MDX content.
					</p>
				</div>
				<Button asChild variant="outline">
					<Link href={`/organisations/${id}/projects`}>Back to Projects</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Project Details</CardTitle>
					<CardDescription>
						Set title, timeline, banner image, and project content.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					<ProjectForm organisationId={String(organisation.id)} organisationPathId={id} />
				</CardContent>
			</Card>
		</div>
	);
}
