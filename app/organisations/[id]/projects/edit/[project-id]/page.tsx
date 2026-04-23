import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectForm } from "@/app/organisations/[id]/projects/edit/components/project-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionCookieHeader } from "@/lib/auth/session";
import type { Organisation } from "@/lib/interfaces/organisations/organisation";
import type { Project } from "@/lib/interfaces/projects/projects";

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

async function getProjectById(projectId: string): Promise<Project | null> {
	try {
		const response = await fetch("https://api.studentcouncil.dk/query/v1/projects", {
			cache: "no-store",
		});

		if (!response.ok) {
			return null;
		}

		const data = (await response.json()) as Project[];
		if (!Array.isArray(data)) {
			return null;
		}

		return data.find((project) => String(project.id) === projectId) ?? null;
	} catch {
		return null;
	}
}

async function getProjectContent(contentPath: string | undefined): Promise<string> {
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

export default async function EditProjectPage({
	params,
}: {
	params: Promise<{ id: string; "project-id": string }>;
}) {
	const { id, "project-id": projectId } = await params;

	const [organisation, project] = await Promise.all([
		getOrganisation(id),
		getProjectById(projectId),
	]);

	if (!organisation || !project) {
		notFound();
	}

	const initialContent = await getProjectContent(project.contentPath);

	return (
		<div className="mx-auto w-full max-w-6xl space-y-6 p-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Edit Project</h1>
					<p className="text-sm text-gray-600 dark:text-gray-300">
						Update timeline, banner, and MDX content for this project.
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
						Edit title, timeline, banner image, and content.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-5">
					<ProjectForm
						organisationId={String(organisation.id)}
						organisationPathId={id}
						mode="edit"
						projectId={projectId}
						initialValues={{
							title: project.title ?? "",
							content: initialContent,
							startDate: project.startDate ?? "",
							endDate: project.endDate,
							isOngoing: project.isOngoing === true,
							bannerPath: project.banner,
						}}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
