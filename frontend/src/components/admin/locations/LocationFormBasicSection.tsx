/**
 * Location Form Basic Section
 */

'use client';

import React, { useRef, useState } from 'react';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { LocationFormData } from './types';

const INPUT_CLASS =
  'w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60';

interface LocationFormBasicSectionProps {
  form: LocationFormData;
  setForm: React.Dispatch<React.SetStateAction<LocationFormData>>;
  flagPreview: string | null;
  setPendingFlagFile: (file: File | null) => void;
  setFlagPreview: (preview: string | null) => void;
  uploadingFlag: boolean;
}

export function LocationFormBasicSection({
  form,
  setForm,
  flagPreview,
  setPendingFlagFile,
  setFlagPreview,
  uploadingFlag,
}: LocationFormBasicSectionProps) {
  const t = useTranslations('admin.locations');
  const tCommon = useTranslations('Common');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = (file: File | undefined | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    setPendingFlagFile(file);
    setFlagPreview(URL.createObjectURL(file));
    setForm((f) => ({ ...f, flag: 'pending' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFlag = () => {
    setPendingFlagFile(null);
    setFlagPreview(null);
    setForm((f) => ({ ...f, flag: '' }));
  };

  const currentFlagSrc =
    flagPreview ||
    (form.flag && form.flag !== 'pending'
      ? `${process.env.NEXT_PUBLIC_API_BASE || ''}${form.flag}`
      : '');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white mb-1">{t('form.basicInfo')}</h3>
        <p className="text-xs text-[#888]">{t('form.basicInfoDesc')}</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">
            {t('form.locationName')} <span className="text-[#FF5722]">*</span>
          </label>
          <input
            className={INPUT_CLASS}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={t('form.locationNamePlaceholder')}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">
            {t('form.locationFlag')} <span className="text-[#FF5722]">*</span>
          </label>
          <div className="flex items-center gap-3">
            {currentFlagSrc && (
              <div className="relative w-11 h-11 bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                <img
                  src={currentFlagSrc}
                  alt="Flag"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div
              className="flex-1 min-w-0"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFileSelection(e.dataTransfer.files?.[0]);
              }}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => handleFileSelection(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFlag}
                className={`flex items-center justify-between w-full rounded-lg border px-4 h-[44px] text-sm text-[#888] transition-colors outline-none ${
                  isDragging
                    ? 'bg-[#FF5722]/10 border-[#FF5722] text-[#FF5722]'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
                }`}
              >
                <span className="truncate">
                  {uploadingFlag
                    ? tCommon('uploading')
                    : form.flag
                    ? t('form.changeFlag')
                    : t('form.uploadIcon')}
                </span>
                {uploadingFlag ? (
                  <Loader2 size={16} className="animate-spin text-[#888] shrink-0" />
                ) : (
                  <Upload size={16} className="text-[#888] shrink-0" />
                )}
              </button>
            </div>

            {form.flag && (
              <button
                type="button"
                onClick={handleRemoveFlag}
                className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[10px] text-[#666]">{t('form.uploadHint')}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">
            {t('form.nodeIp')} <span className="text-[#FF5722]">*</span>
          </label>
          <input
            className={INPUT_CLASS}
            value={form.latencyUrl}
            onChange={(e) => setForm((f) => ({ ...f, latencyUrl: e.target.value }))}
            placeholder={t('form.nodeIpPlaceholder')}
            required
          />
          <p className="mt-1 text-[10px] text-[#666]">{t('form.nodeIpHint')}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">
            {t('form.serverLimit')}
          </label>
          <input
            type="number"
            className={INPUT_CLASS}
            value={form.serverLimit}
            onChange={(e) => setForm((f) => ({ ...f, serverLimit: e.target.value }))}
            min="0"
            placeholder={t('form.serverLimitPlaceholder')}
          />
          <p className="mt-1 text-[10px] text-[#666]">{t('form.serverLimitHint')}</p>
        </div>
      </div>
    </div>
  );
}
