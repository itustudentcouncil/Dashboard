import { notFound } from "next/navigation";
import { OrganisationEditForm } from "@/app/organisations/[id]/edit/components/organisation-edit-form";
import { getSessionCookieHeader } from "@/lib/auth/session";
import type { Organisation } from "@/lib/interfaces/organisations/organisation";
import type { QuickLink } from "@/lib/interfaces/organisations/quicklink";
import { Category } from "@/lib/interfaces/organisations/category";
import { QuickLinkType } from "@/lib/interfaces/organisations/quicklink-type";

type EditableOrganisation = Organisation & {
  quickLinks?: QuickLink[];
  quicklinks?: QuickLink[];
};

async function getOrganisation(id: string): Promise<EditableOrganisation | null> {
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

    return (await response.json()) as EditableOrganisation;
  } catch {
    return null;
  }
}

async function getQuickLinks(identifier: string): Promise<QuickLink[]> {
  // API supports fetching with both id or slug
  const res = await fetch(`https://api.studentcouncil.dk/query/v1/organisations/${identifier}/quick-links`);
  if (res.ok) return res.json(); else return [];
}

async function getCategories(): Promise<Category[]> {
  // API supports fetching with both id or slug
  const res = await fetch(`https://api.studentcouncil.dk/query/v1/organisations/categories`);
  if (res.ok) return res.json(); else return [];
}

async function getLinkTypes(): Promise<QuickLinkType[]> {
  // API supports fetching with both id or slug
  const res = await fetch(`https://api.studentcouncil.dk/query/v1/quick-links/types`);
  if (res.ok) return res.json(); else return [];
}

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const organisation = await getOrganisation(id);
  const quickLinks = await getQuickLinks(id);
  const categories = await getCategories();
  const linkTypes = await getLinkTypes();

  if (!organisation) {
    notFound();
  }

  return (
    <div className="flex flex-col flex-1 font-sans">
      <main className="mx-auto w-full max-w-5xl px-6 py-6">
        <OrganisationEditForm
          organisation={organisation}
          quickLinks={quickLinks}
          categories={categories}
          linkTypes={linkTypes}
        />
      </main>
    </div>
  );
}