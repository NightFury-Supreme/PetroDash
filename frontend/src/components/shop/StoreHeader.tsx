"use client";
import { useTranslations } from 'next-intl';


interface StoreHeaderProps {
  activeTab: "items" | "plans";
  coins: number | null;
  onTabChange: (tab: "items" | "plans") => void;
}

export function StoreHeader({ activeTab: _activeTab, coins: _coins, onTabChange: _onTabChange }: StoreHeaderProps) {
  const t = useTranslations('Shop');
  return (
    <>


      <header className="flex items-start justify-between">
      {/* Left: title + tabs */}
      <div>
        <div>
          <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">{t('storeTitle')}</h1>
          <p className="text-[#888888] mt-1 text-sm">{t('storeSubtitle')}</p>
        </div>

      </div>
      </header>
    </>
  );
}
