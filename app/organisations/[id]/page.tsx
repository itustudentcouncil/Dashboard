import Image from "next/image"
import Link from "next/link"
import { Newspaper, Users, Pencil, ArrowRight, Calendar, Edit2, Eye } from "lucide-react"
import type { Organisation } from "@/lib/interfaces/organisations/organisation"
import { getSessionCookieHeader } from "@/lib/auth/session"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CategoryBadge } from "@/components/cards/category-badge"

async function getOrganisations(id: string): Promise<Organisation | null> {
    try {
    const sessionCookieHeader = await getSessionCookieHeader();
        const response = await fetch(`https://api.studentcouncil.dk/query/v1/organisations/${id}`, {
      next: { revalidate: 0 },
      headers: sessionCookieHeader ? { Cookie: sessionCookieHeader } : undefined,
      cache: "no-store",
        });
        
        if (!response.ok) {
            console.error(`API returned ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        console.log('API response:', data);
        return data;
    } catch (error) {
        console.error("Failed to fetch organisation:", error);
        return null;
    }
}

const quickCards = [
  {
    title: "Members",
    description: "Browse and manage the current member list.",
    href: "members",
    icon: Users,
  },
  {
    title: "News",
    description: "Publish announcements and posts for this organisation.",
    href: "news",
    icon: Newspaper,
  },
  {
    title: "Events",
    description: "Create upcoming or recurring events.",
    href: "events",
    icon: Calendar,
  },
  {
    title: "Edit page",
    description: "Change the description, banner, icon and add links.",
    href: "edit",
    icon: Edit2,
  },
]

export default async function OrganisationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const organisation = await getOrganisations(id);
  const organisationPath = `/organisations/${organisation?.slug ?? id}`
  const initials = organisation?.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="flex flex-col flex-1 font-sans">
      <div className="mx-auto w-full max-w-4xl px-6 py-6 flex flex-col gap-6">
        {/* Banner + identity */}
        <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10">
          {/* Banner */}
          <div className="relative h-36 w-full bg-muted">
            {organisation?.banner && (
              <Image
                src={"https://cdn.studentcouncil.dk/" + organisation?.banner}
                alt={`${organisation?.name} banner`}
                fill
                className="object-cover"
                priority
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          {/* Identity row — sits flush below banner, no overlap */}
          <div className="flex items-start gap-4 px-5 py-4 bg-card">
            <Avatar
              size="lg"
              className="size-14 rounded-full ring-2 ring-background shadow-sm shrink-0"
            >
              <AvatarImage
                src={"https://cdn.studentcouncil.dk/" + organisation?.icon}
                alt={organisation?.name}
                className="object-cover object-center"
              />
              <AvatarFallback className="rounded-full text-base">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <h1 className="text-lg font-semibold leading-tight">{organisation?.name}</h1>
                {organisation?.category && (
                  <CategoryBadge category={organisation.category} />
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-snug">{organisation?.description}</p>
            </div>

            {/* Action buttons */}
            <div className="shrink-0 mt-0.5 flex flex-col gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`${organisationPath}/edit`}>
                  <Pencil className="size-3.5" />
                  Edit
                </Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <a
                  href={`https://studentcouncil.dk/organisations/${organisation?.slug ?? ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Eye className="size-3.5" />
                  View
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick-action cards */}
        <section>
          <h2 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Quick links
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quickCards.map(({ title, description, href, icon: Icon }) => (
              <Link key={href} href={`${organisationPath}/${href}`}>
                <Card className="hover:ring-primary/40 transition-all hover:shadow-md cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 text-muted-foreground" />
                        <CardTitle>{title}</CardTitle>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </div>
                    <CardDescription>{description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
