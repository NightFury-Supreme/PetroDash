import React, { useState } from 'react';
import { UpdateSystem } from '../updates';
import { Palette, Globe, ShieldCheck, Server, Users, RefreshCw, Mail } from 'lucide-react';
import { AdminSettingsContentProps } from './types';
import { SideItem, PayPalIcon, GoogleIcon } from './Shared';
import { BrandTab } from './tabs/BrandTab';
import { LocalizationTab } from './tabs/LocalizationTab';
import { AuthTab } from './tabs/AuthTab';
import { EmailTab } from './tabs/EmailTab';
import { ResourcesTab } from './tabs/ResourcesTab';
import { ReferralsTab } from './tabs/ReferralsTab';
import { AdSenseTab } from './tabs/AdSenseTab';
import { PayPalTab } from './tabs/PayPalTab';
import { useTranslations } from 'next-intl';

export function AdminSettingsContent(_props?: AdminSettingsContentProps) {
  const [activeTab, setActiveTab] = useState('brand');
  const t = useTranslations('AdminSettings');

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <aside className="w-full lg:w-48 shrink-0 pt-1">
        <div className="sticky top-6">
          <div className="mb-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">{t('settings')}</p>
          </div>
          <nav className="flex flex-col gap-1">
            <SideItem icon={Palette} label={t('brand')} active={activeTab === 'brand'} onClick={() => setActiveTab('brand')} />
            <SideItem icon={Globe} label={t('localization')} active={activeTab === 'localization'} onClick={() => setActiveTab('localization')} />
            <SideItem icon={ShieldCheck} label={t('authentication')} active={activeTab === 'auth'} onClick={() => setActiveTab('auth')} />
            <SideItem icon={Mail} label={t('email')} active={activeTab === 'email'} onClick={() => setActiveTab('email')} />
            <SideItem icon={Server} label={t('defaultResources')} active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} />
            <SideItem icon={Users} label={t('referrals')} active={activeTab === 'referrals'} onClick={() => setActiveTab('referrals')} />
            <SideItem icon={GoogleIcon} label={t('googleAdSense')} active={activeTab === 'adsense'} onClick={() => setActiveTab('adsense')} />
            <SideItem icon={PayPalIcon} label={t('paypal')} active={activeTab === 'paypal'} onClick={() => setActiveTab('paypal')} />
            <SideItem icon={RefreshCw} label={t('systemUpdates')} active={activeTab === 'updates'} onClick={() => setActiveTab('updates')} />
          </nav>
        </div>
      </aside>

      <div className="flex-1 min-w-0 w-full space-y-6 mt-8">
        {activeTab === 'brand' && <BrandTab />}
        {activeTab === 'localization' && <LocalizationTab />}
        {activeTab === 'referrals' && <ReferralsTab />}
        {activeTab === 'auth' && <AuthTab />}
        {activeTab === 'email' && <EmailTab />}
        {activeTab === 'resources' && <ResourcesTab />}
        {activeTab === 'adsense' && <AdSenseTab />}
        {activeTab === 'paypal' && <PayPalTab />}
        {activeTab === 'updates' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <UpdateSystem />
          </div>
        )}
      </div>
    </div>
  );
}
