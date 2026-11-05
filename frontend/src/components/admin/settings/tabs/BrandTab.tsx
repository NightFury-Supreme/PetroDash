import React, { useState } from 'react';
import { LayoutTemplate } from 'lucide-react';
import { SettingsRow, SiteIconDisplay } from '../Shared';
import { TabProps } from '../types';
import { useTranslations } from 'next-intl';
import { useAdminBrandUpload, useAdminTabSettings } from '@/hooks/admin/settings';
import { ImageUploadDrawer } from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import { AdminSettingsTabSkeleton } from '@/components/skeletons/admin/settings';

export function BrandTab(props?: Partial<TabProps>) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const t = useTranslations('AdminSettings');
  const tProfile = useTranslations('Profile');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');
  const { showError } = useToast();
  const { uploadIcon } = useAdminBrandUpload();

  const tabHook = useAdminTabSettings('brand', {
    siteName: 'PteroDash',
    siteIcon: '',
  });

  const formData = props?.formData || tabHook.formData;
  const updateFormData = props?.updateFormData || tabHook.updateFormData;
  const saveSection = props?.saveSection || tabHook.saveSection;
  const loading = props?.loading ?? (tabHook.loading || tabHook.saving);

  if (!props?.formData && tabHook.loading) {
    return <AdminSettingsTabSkeleton rows={2} />;
  }

  const getSafeIconUrl = () => {
    if (!formData.siteIcon) return '';
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || (typeof window !== 'undefined' ? window.location.origin : '');
      const parsedUrl = base ? new URL(formData.siteIcon, base) : new URL(formData.siteIcon);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') return '';
      return parsedUrl.href;
    } catch {
      return '';
    }
  };
  const safeSiteIcon = getSafeIconUrl();

  const handleCropComplete = async (croppedFile: File) => {
    try {
      const finalSiteIcon = await uploadIcon(croppedFile);
      await saveSection({ siteIcon: finalSiteIcon }, t('brandSettingsUpdated'));
      updateFormData('siteIcon', finalSiteIcon);
      setIsDrawerOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ERR_ICON_UPLOAD_FAILED';
      showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : (msg || tCommon('error')));
      throw err;
    }
  };

  const handleRemoveIcon = async () => {
    try {
      await saveSection({ siteIcon: '' }, t('brandSettingsUpdated'));
      updateFormData('siteIcon', '');
      setIsDrawerOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ERR_ICON_UPLOAD_FAILED';
      showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : (msg || tCommon('error')));
      throw err;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{t('brandSettingsTitle')}</h3>
            <p className="mt-2 text-sm text-white/35">{t('brandSettingsDesc')}</p>
          </div>
        </div>
        
        <div className="divide-y divide-white/[0.06]">
          <SettingsRow
            icon={<LayoutTemplate />}
            label={t('siteName')}
            description={t('siteNameDesc')}
            displayValue={formData.siteName || t('notSet')}
            onSave={() => saveSection({ siteName: formData.siteName }, t('brandSettingsUpdated'))}
          >
            <input
              type="text"
              className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
              placeholder={t('enterSiteName')}
              value={formData.siteName || ''}
              onChange={(e) => updateFormData('siteName', e.target.value)}
              disabled={loading}
            />
          </SettingsRow>
          
          <SettingsRow 
            icon={<SiteIconDisplay src={safeSiteIcon || '/logo.svg'} alt={t('siteIcon')} />} 
            label={t('siteIcon')} 
            description={t('siteIconDesc')} 
            onEdit={() => setIsDrawerOpen(true)}
          />
        </div>
      </section>

      <ImageUploadDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentImage={safeSiteIcon}
        onCropComplete={handleCropComplete}
        onRemove={formData.siteIcon ? handleRemoveIcon : undefined}
        removeLabel={tProfile('resetGravatar')}
        cropShape="square"
        title={t('siteIcon')}
        subtitle={t('siteIconDesc')}
        cropTitle={tProfile('cropImage')}
        cropSubtitle={tProfile('cropImageDesc')}
        zIndex="z-[110]"
      />
    </div>
  );
}
