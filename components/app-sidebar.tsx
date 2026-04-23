"use client"

import * as React from "react"
import {
  Calendar,
  CircleHelp,
  Database,
  FileBarChart,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Newspaper,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import type { Account } from "@/lib/interfaces/accounts/account"
import type { AccountOrganisation } from "@/lib/interfaces/accounts/account-organisation"
import { cn } from "@/lib/utils"

const data = {
  navSecondary: [
    /* {
      title: "Settings",
      url: "#",
      icon: Settings,
    }, */
    {
      title: "Get Help",
      url: "https://github.com/itustudentcouncil/website-guide/blob/main/README.md",
      icon: CircleHelp,
      openInNewTab: true,
    }
    /*
      {
      title: "Search",
      url: "#",
      icon: IconSearch,
    }, */
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: Database,
    },
    {
      name: "Reports",
      url: "#",
      icon: FileBarChart,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: FileText,
    },
  ],
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  account?: Account
  organisations?: AccountOrganisation[]
  selectedOrganisationId?: string
}

export function AppSidebar({
  className,
  account,
  organisations = [],
  selectedOrganisationId,
  ...props
}: AppSidebarProps) {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const routeOrganisationId = Array.isArray(params.id) ? params.id[0] : params.id
  const organisationId = selectedOrganisationId ?? routeOrganisationId
  const [isDeletingOrganisation, setIsDeletingOrganisation] = React.useState(false)
  const selectedOrganisation = organisations.find(
    (organisation) =>
      organisation.slug === organisationId || organisation.id.toString() === organisationId
  )
  const organisationApiId = selectedOrganisation?.id?.toString() ?? (organisationId && /^\d+$/.test(organisationId) ? organisationId : null)
  const showProjectsItem =
    organisationId === "student-council" ||
    organisationId === "9" ||
    selectedOrganisation?.slug === "student-council" ||
    selectedOrganisation?.id === 9
  const basePath = organisationId ? `/organisations/${organisationId}` : "/organisations"

  const onDeleteOrganisation = async () => {
    if (!organisationApiId) {
      toast.warning("No organisation is selected.")
      return
    }

    const confirmedFirst = window.confirm("Are you sure you want to delete this organisation?")
    if (!confirmedFirst) return

    const confirmedSecond = window.confirm("This action is permanent. Confirm again if you want to delete?")
    if (!confirmedSecond) return

    try {
      setIsDeletingOrganisation(true)
      const response = await fetch(`/api/organisations/${organisationApiId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const message = (await response.text()) || "Failed to delete organisation."
        throw new Error(message)
      }

      toast.success("Organisation deleted.")
      router.push("/")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete organisation.")
    } finally {
      setIsDeletingOrganisation(false)
    }
  }

  const navMain = [
    {
      title: "Overview",
      url: basePath,
      icon: LayoutDashboard,
      match: "exact" as const,
    },
    {
      title: "Edit",
      url: `${basePath}/edit`,
      icon: Pencil,
      match: "prefix" as const,
    },
    {
      title: "Events",
      url: `${basePath}/events`,
      icon: Calendar,
      match: "prefix" as const,
    },
    {
      title: "News",
      url: `${basePath}/news`,
      icon: Newspaper,
      match: "prefix" as const,
    },
    ...(showProjectsItem
      ? [
          {
            title: "Projects",
            url: `${basePath}/projects`,
            icon: FolderKanban,
            match: "prefix" as const,
          },
        ]
      : []),
    {
      title: "Members",
      url: `${basePath}/members`,
      icon: Users,
      match: "prefix" as const,
    },
  ]

  return (
    <Sidebar
      collapsible="offcanvas"
      className={cn(
        "dark:[--sidebar:oklch(0.17_0.03_18)] dark:[--sidebar-accent:oklch(0.25_0.03_18)] dark:[--sidebar-border:oklch(0.34_0.04_18)] dark:[--sidebar-ring:var(--rose-400)]",
        className
      )}
      {...props}
    >

      <SidebarContent>
        <NavMain
          items={navMain}
          homeUrl="/"
          organisations={organisations}
          selectedOrganisationId={organisationId}
        />
        <div className="mt-auto">
          {account?.isGlobalAdministrator && (
            <div className="space-y-2 px-2 pb-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/create/organisation">
                  <Plus />
                  <span>Create organisation</span>
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => void onDeleteOrganisation()}
                disabled={isDeletingOrganisation || !organisationApiId}
              >
                <Trash2 />
                <span>{isDeletingOrganisation ? "Deleting organisation..." : "Delete organisation"}</span>
              </Button>
            </div>
          )}
          <NavSecondary items={data.navSecondary} />
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser account={account} />
      </SidebarFooter>
    </Sidebar>
  )
}