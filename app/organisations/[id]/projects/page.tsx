import { redirect, unauthorized } from "next/navigation";
import { getCurrentAuthSession, getSessionCookieHeader } from "@/lib/auth/session";
import type { AccountOrganisation } from "@/lib/interfaces/accounts/account-organisation";
import type { Project } from "@/lib/interfaces/projects/projects";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ProjectCard from "@/app/organisations/[id]/projects/components/project-card";

async function getAccountOrganisations(): Promise<AccountOrganisation[]> {
	const sessionCookieHeader = await getSessionCookieHeader();

	try {
		const response = await fetch("https://api.studentcouncil.dk/query/v1/accounts/me/organisations", {
			next: { revalidate: 0 },
			headers: sessionCookieHeader ? { Cookie: sessionCookieHeader } : undefined,
			cache: "no-store",
		});

		if (!response.ok) {
			return [];
		}

		const data = await response.json();
		return Array.isArray(data) ? data : [];
	} catch {
		return [];
	}
}

async function getProjects(): Promise<Project[]> {
	try {
		const response = await fetch("https://api.studentcouncil.dk/query/v1/projects", {
			cache: "no-store",
		});
            
		if (!response.ok) {
			console.error(`API returned ${response.status}`);
			return [];
		}

		const data = await response.json();
		return Array.isArray(data) ? data : [];
	} catch (error) {
		console.error("Failed to fetch projects:", error);
		return [];
	}
}

export default async function ProjectsPage({ params }: { params: Promise<{ id: string }>; }) {
	const [{ id }, authSession, organisations] = await Promise.all([
		params,
		getCurrentAuthSession(),
		getAccountOrganisations(),
	]);
	const projects = await getProjects();
	const ongoingProjects = projects.filter((project) => project.isOngoing);
	const completedProjects = projects.filter((project) => !project.isOngoing);

	if (!authSession.isAuthenticated) {
		redirect("http://login.studentcouncil.dk/login?redirect=https://dashboard.studentcouncil.dk");
	}

	const selectedOrganisation = organisations.find(
		(organisation) => organisation.slug === id || organisation.id.toString() === id
	);

	const hasStudentCouncilAccess = organisations.some(
		(organisation) => organisation.slug === "student-council" || organisation.id === 9
	);
	const isStudentCouncilRoute =
		id === "student-council" ||
		id === "9" ||
		selectedOrganisation?.slug === "student-council" ||
		selectedOrganisation?.id === 9;

	if (!hasStudentCouncilAccess || !isStudentCouncilRoute) {
		unauthorized();
	}

	return (
		<div className="flex flex-1 flex-col font-sans">
			<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-8">
				<div className="flex items-center justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Projects</h1>
						<p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
							Manage Student Council projects.
						</p>
					</div>
					<Button asChild>
						<Link href={`/organisations/${id}/projects/edit`}>Create Project</Link>
					</Button>
				</div>

				<section className="space-y-4">
					<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Ongoing Projects</h2>
					{ongoingProjects.length === 0 ? (
						<div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
							No ongoing projects.
						</div>
					) : (
						<div className="grid gap-4 md:grid-cols-2">
							{ongoingProjects.map((project) => (
								<ProjectCard key={project.id} project={project} organisationId={id} />
							))}
						</div>
					)}
				</section>

				<section className="space-y-4">
					<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Completed Projects</h2>
					{completedProjects.length === 0 ? (
						<div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
							No completed projects.
						</div>
					) : (
						<div className="grid gap-4 md:grid-cols-2">
							{completedProjects.map((project) => (
								<ProjectCard key={project.id} project={project} organisationId={id} />
							))}
						</div>
					)}
				</section>
			</main>
		</div>
	);
}
