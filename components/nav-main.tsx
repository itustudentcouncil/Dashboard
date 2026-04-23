"use client"

import type { ComponentType, SVGProps } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { House } from "lucide-react"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import type { AccountOrganisation } from "@/lib/interfaces/accounts/account-organisation"

type SidebarIcon = ComponentType<SVGProps<SVGSVGElement>>

export function NavMain({
  items,
  homeUrl,
  organisations,
  selectedOrganisationId,
}: {
  items: {
    title: string
    url: string
    icon?: SidebarIcon
    match?: "exact" | "prefix"
  }[]
  homeUrl?: string
  organisations: AccountOrganisation[]
  selectedOrganisationId?: string
}) {
  const pathname = usePathname()
  const router = useRouter()

  const normalizePath = (path: string) => {
    if (!path) return "/"
    return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path
  }

  const currentPath = normalizePath(pathname)
  const normalizedHomeUrl = normalizePath(homeUrl ?? "/")
  const isHomeActive = currentPath === normalizedHomeUrl
  const selectedOrganisation = organisations.find(
    (organisation) =>
      organisation.slug === selectedOrganisationId || organisation.id.toString() === selectedOrganisationId
  )
  const selectedValue = selectedOrganisation?.slug ?? ""

  const isItemActive = (item: { url: string; match?: "exact" | "prefix" }) => {
    const targetPath = normalizePath(item.url)

    if (item.match === "exact") {
      return currentPath === targetPath
    }

    return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
                <Select
                  value={selectedValue}
                  onValueChange={(value) => {
                    router.push(`/organisations/${value}`)
                  }}
                >
                    <SelectTrigger className="w-[180px]">
                        {selectedOrganisation ? (
                          <span className="flex items-center gap-2 truncate">
                            <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full border border-border/60">
                              <Image
                                src={`https://cdn.studentcouncil.dk/${selectedOrganisation.icon}`}
                                alt={`${selectedOrganisation.name} icon`}
                                fill
                                className="object-cover"
                              />
                            </span>
                            <span className="truncate">{selectedOrganisation.name}</span>
                          </span>
                        ) : (
                          <SelectValue placeholder="Select Organisation" />
                        )}
                    </SelectTrigger>
                    <SelectContent position="popper" align="start" className="max-h-80 overflow-hidden">
                      <SelectGroup className="max-h-72 overflow-y-auto">
                        {organisations.map((organisation) => (
                          <SelectItem key={organisation.id} value={organisation.slug}>
                            <span className="flex items-center gap-2">
                              <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full border border-border/60">
                                <Image
                                  src={`https://cdn.studentcouncil.dk/${organisation.icon}`}
                                  alt={`${organisation.name} icon`}
                                  fill
                                  className="object-cover"
                                />
                              </span>
                              <span className="truncate">{organisation.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                </Select>
                <Button
                    asChild
                    size="icon"
                    className="size-8 group-data-[collapsible=icon]:opacity-0"
                  variant={isHomeActive ? "default" : "outline"}
                >
                    <Link href={homeUrl ?? "/"}>
                      <House />
                      <span className="sr-only">Go to overview</span>
                    </Link>
                </Button>
            </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isItemActive(item)}
                className="relative data-[active=true]:pl-3 before:absolute before:top-1/2 before:left-0 before:h-5 before:w-1 before:-translate-y-1/2 before:origin-center before:scale-y-75 before:rounded-full before:bg-[var(--rose-400)] before:opacity-0 before:transition-[opacity,transform] before:duration-200 before:ease-out hover:before:scale-y-100 hover:before:opacity-65 active:before:scale-y-70 active:before:opacity-90 data-[active=true]:before:scale-y-100 data-[active=true]:before:opacity-100"
              >
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}