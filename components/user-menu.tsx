"use client"

import { EllipsisVertical, LogOut, UserCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Account } from "@/lib/interfaces/accounts/account"

interface UserMenuProps {
  account?: Account
}

export function UserMenu({ account }: UserMenuProps) {
  const profileInitial = account?.username.charAt(0).toUpperCase()
  const profileImageSrc = account?.profilePath
    ? `https://cdn.studentcouncil.dk/${account.profilePath}`
    : undefined

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-auto items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/10"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={profileImageSrc} alt={account?.username} />
            <AvatarFallback className="rounded-lg">{profileInitial}</AvatarFallback>
          </Avatar>
          <div className="grid text-left text-sm leading-tight">
            <span className="truncate font-medium">{account?.username}</span>
            <span className="truncate text-xs text-muted-foreground">{account?.email}</span>
          </div>
          <EllipsisVertical className="ml-1 size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 rounded-lg" side="bottom" align="end" sideOffset={4}>
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={profileImageSrc} alt={account?.username} />
              <AvatarFallback className="rounded-lg">{profileInitial}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{account?.username}</span>
              <span className="truncate text-xs text-muted-foreground">{account?.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link
              href="https://login.studentcouncil.dk/account"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer"
            >
              <UserCircle />
              Manage Account
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="http://login.studentcouncil.dk/logout?redirect=https://dashboard.studentcouncil.dk"
            className="cursor-pointer"
          >
            <LogOut />
            Log out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
