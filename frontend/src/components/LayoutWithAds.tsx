"use client";

import { HeaderAd, FooterAd, MobileAd } from './AdSense';

interface LayoutWithAdsProps {
  children: React.ReactNode;
}

export default function LayoutWithAds({ children }: LayoutWithAdsProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Ad */}
      <HeaderAd />
      
      {/* Mobile Ad - only visible on mobile */}
      <MobileAd />
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer Ad */}
      <FooterAd />
    </div>
  );
}
