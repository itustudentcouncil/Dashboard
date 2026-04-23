import { redirect } from "next/navigation";

import { CreateOrganisationForm } from "@/app/create/organisation/components/create-organisation-form";
import { getCurrentAuthSession } from "@/lib/auth/session";
import type { Category } from "@/lib/interfaces/organisations/category";

async function getCategories(): Promise<Category[]> {
	try {
		const response = await fetch("https://api.studentcouncil.dk/query/v1/organisations/categories", {
			cache: "no-store",
		});

		if (!response.ok) {
			return [];
		}

		const data = await response.json();
		return Array.isArray(data) ? (data as Category[]) : [];
	} catch {
		return [];
	}
}

export default async function CreateOrganisationPage() {
	const authSession = await getCurrentAuthSession();

	if (!authSession.account?.isGlobalAdministrator) {
		redirect("/unauthorized");
	}

	const categories = await getCategories();

	return (
		<main className="min-h-screen bg-[oklch(0.17_0.03_18)] text-foreground px-6 py-8">
			<section className="mx-auto w-full max-w-3xl">
				<CreateOrganisationForm categories={categories} />
			</section>
		</main>
	);
}
