import { AppSidebar } from "@/components/app-sidebar";
import { redirect, unauthorized } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentAuthSession, getSessionCookieHeader } from "@/lib/auth/session";
import type { AccountOrganisation } from "@/lib/interfaces/accounts/account-organisation";

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

export default async function OrganisationLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
        const [{ id }, authSession, organisations] = await Promise.all([
                params,
        getCurrentAuthSession(),
                getAccountOrganisations(),
    ]);
    const { isAuthenticated, account } = authSession;

    if (!isAuthenticated) {
       redirect("http://login.studentcouncil.dk/login?redirect=https://dashboard.studentcouncil.dk");
    }

        const hasOrganisationAccess = organisations.some(
            (organisation) => organisation.slug === id || organisation.id.toString() === id
        );

        if (!hasOrganisationAccess) {
           unauthorized();
        }

  return (
        <div className="flex flex-col flex-1 items-center justify-center bg-[oklch(0.17_0.03_18)] font-sans">
          <div className="flex w-full flex-1 flex-col">
              <SidebarProvider
                  className="bg-[oklch(0.17_0.03_18)] dark:[--sidebar:oklch(0.17_0.03_18)] dark:[--sidebar-accent:oklch(0.25_0.03_18)] dark:[--sidebar-border:oklch(0.34_0.04_18)] dark:[--sidebar-ring:var(--rose-400)]"
                  style={
                      {
                          "--sidebar-width": "calc(var(--spacing) * 72)",
                          "--header-height": "calc(var(--spacing) * 12)",
                      } as React.CSSProperties
                  }
              >
                                    <AppSidebar
                                        variant="inset"
                                        account={account}
                                        organisations={organisations}
                                        selectedOrganisationId={id}
                                    />
                  <SidebarInset className="bg-[oklch(0.23_0.03_18)] border border-[oklch(0.31_0.04_18)] shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
                      <SiteHeader />
                      <div className="flex flex-1 flex-col">
                          <div className="@container/main flex flex-1 flex-col gap-2">
                              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                                  {children}
                              </div>
                          </div>
                      </div>
                  </SidebarInset>
              </SidebarProvider>
          </div>
    </div>
  );
}
