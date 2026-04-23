import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 mt-1.5 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium mb-1">Dashboard</h1>
        <h2 className="text-sm text-muted-foreground mb-1">v1</h2>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="mailto:aybo@itu.dk"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
            Send Feedback
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}