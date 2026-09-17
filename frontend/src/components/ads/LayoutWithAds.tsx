"use client";

import { HeaderAd, FooterAd, MobileAd } from './AdSense';
import Footer from '@/components/Footer';
import { usePathname } from '@/i18n/routing';

interface LayoutWithAdsProps {
  children: React.ReactNode;
}

import Shell from '@/components/Shell';

// Pages that use Shell component (don't need footer here)
const SHELL_PAGES = [
  '/dashboard',
  '/panel',
  '/shop',
  '/gift',
  '/create',
  '/admin',
  '/server',
  '/referrals',
  '/tickets',
  '/profile',
  '/earn'
];

export default function LayoutWithAds({ children }: LayoutWithAdsProps) {
  const pathname = usePathname();
  
  // Check if current page uses Shell component
  const usesShell = SHELL_PAGES.some(page => pathname.startsWith(page));
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Ad */}
      <HeaderAd />
      
      {/* Mobile Ad - only visible on mobile */}
      <MobileAd />
      
      {/* Main Content */}
      <main className="flex-1">
        {usesShell ? (
          <Shell>{children}</Shell>
        ) : (
          children
        )}
      </main>
      
      {/* Footer Ad */}
      <FooterAd />
      
      {/* Footer - only show for pages that don't use Shell */}
      {!usesShell && <Footer />}
    </div>
  );
}
