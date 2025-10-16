import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import AuthGuard from "@/components/auth/AuthGuard";
import LayoutWithAds from "@/components/ads/LayoutWithAds";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  let title = "PteroDash";
  let icons: Metadata["icons"] | undefined = undefined;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/branding`, { cache: 'no-store' });
    const s = await res.json();
    if (s?.siteName) title = s.siteName;
    if (s?.siteIcon) icons = { icon: `${process.env.NEXT_PUBLIC_API_BASE}${s.siteIcon}` } as any;
  } catch {}
  
  // Use default logo if no custom icon is set
  if (!icons) {
    icons = { 
      icon: '/favicon.svg',
      shortcut: '/favicon.svg',
      apple: '/favicon.svg'
    };
  }
  
  return { title, description: "Premium Control Panel", icons } satisfies Metadata;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <AuthGuard>
            <LayoutWithAds>
              {children}
            </LayoutWithAds>
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
