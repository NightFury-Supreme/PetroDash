import React, { useState, useRef } from 'react';
import { LayoutTemplate, Upload, Trash2 } from 'lucide-react';
import { SettingsRow, SiteIconDisplay } from '../Shared';
import { TabProps } from '../types';
import { useModal } from '@/components/Modal';
import { useTranslations } from 'next-intl';
import { useAdminBrandUpload } from '@/hooks/admin/settings';

export function BrandTab({ formData, updateFormData, saveSection, loading }: TabProps) {
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modal = useModal();
  const t = useTranslations('AdminSettings');
  const { uploadIcon } = useAdminBrandUpload();

  const getSafeIconUrl = () => {
    if (iconPreview) return iconPreview;
    if (!formData.siteIcon) return '';
    try {
      const parsedUrl = new URL(formData.siteIcon, process.env.NEXT_PUBLIC_API_BASE || 'http://localhost');
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') return '';
      return parsedUrl.href;
    } catch {
      return '';
    }
  };
  const safeSiteIcon = getSafeIconUrl();

  const handleUpload = async () => {
    let finalSiteIcon = formData.siteIcon;
    if (iconFile) {
      try {
        finalSiteIcon = await uploadIcon(iconFile);
      } catch (err: any) {
        throw new Error(err?.message || 'ERR_ICON_UPLOAD_FAILED');
      }
    }
    await saveSection({ siteIcon: finalSiteIcon }, t('brandSettingsUpdated'));
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
          <SettingsRow icon={<LayoutTemplate />} label={t('siteName')} description={t('siteNameDesc')} displayValue={formData.siteName || t('notSet')} onSave={() => saveSection({ siteName: formData.siteName }, t('brandSettingsUpdated'))}>
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
            displayValue={formData.siteIcon ? (
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded border border-white/10 overflow-hidden bg-white/5 shrink-0">
                  <SiteIconDisplay src={safeSiteIcon || '/logo.svg'} alt={t('siteIcon')} />
                </div>
                <span className="text-xs text-[#AAA] truncate max-w-[200px]">{formData.siteIcon}</span>
              </div>
            ) : t('notSet')} 
            onSave={handleUpload}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full max-w-md">
              <div
                className="flex-1 min-w-0"
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={(e) => { 
                  e.preventDefault(); 
                  setIsDragging(false); 
                  const file = e.dataTransfer.files?.[0];
                  if (!file || !file.type.startsWith('image/')) return;
                  setIconFile(file);
                  setIconPreview(URL.createObjectURL(file));
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file || !file.type.startsWith('image/')) return;
                    setIconFile(file);
                    setIconPreview(URL.createObjectURL(file));
                  }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className={`flex items-center justify-between w-full rounded-lg px-4 h-[44px] text-sm text-[#888] transition-colors outline-none ${isDragging ? 'bg-[#FF5722]/10 border-[#FF5722] text-[#FF5722]' : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'}`}
                >
                  <span className="truncate">
                    {iconPreview || formData.siteIcon ? t('changeIcon') : t('uploadIcon')}
                  </span>
                  <Upload size={16} className="text-[#888] shrink-0" />
                </button>
              </div>

              {(iconPreview || formData.siteIcon) && (
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = await modal.confirm({
                      title: t('removeIconTitle'),
                      body: t('removeIconBody')
                    });
                    if (confirmed) {
                      if (iconPreview) URL.revokeObjectURL(iconPreview);
                      setIconFile(null);
                      setIconPreview(null);
                      if (formData.siteIcon) updateFormData('siteIcon', '');
                    }
                  }}
                  className="flex items-center justify-center h-[44px] w-[44px] rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
                  disabled={loading}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </SettingsRow>
        </div>
      </section>
    </div>
  );
}
