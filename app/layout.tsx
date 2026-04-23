import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { redirect } from "next/navigation";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentAuthSession } from "@/lib/auth/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dashboard.studentcouncil.dk"),
  title: "Student Council Dashboard",
  description: "Dashboard to manage Student Organisations and Account",
  applicationName: "Student Council Dashboard",
  openGraph: {
    title: "Student Council Dashboard",
    description: "Dashboard to manage Student Organisations and Account",
    siteName: "Student Council",
    type: "website",
    images: [
      {
        url: "/Banner.png",
        alt: "Student Council",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Student Council Dashboard",
    description: "Dashboard to manage Student Organisations and Account",
    images: ["/Banner.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentAuthSession();

  if (!session.isAuthenticated) {
    redirect("http://login.studentcouncil.dk/login?redirect=https://dashboard.studentcouncil.dk");
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
             <Toaster />
             <main>
              {children}
              </main>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
