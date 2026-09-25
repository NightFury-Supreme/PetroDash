/* ==========================================================================
   Admin Egg Form Basic Section Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CategorySelect } from './CategorySelect';
import type { EggFormState, EggCategory } from './types';

interface EggFormBasicSectionProps {
  form: EggFormState;
  setForm: React.Dispatch<React.SetStateAction<EggFormState>>;
  pendingIconFile: File | null;
  setPendingIconFile: (file: File | null) => void;
  iconPreview: string | null;
  setIconPreview: (preview: string | null) => void;
  uploadingIcon: boolean;
  preloadedCategories?: EggCategory[];
}

export function EggFormBasicSection({
  form,
  setForm,
  pendingIconFile: _pendingIconFile,
  setPendingIconFile,
  iconPreview,
  setIconPreview,
  uploadingIcon,
  preloadedCategories,
}: EggFormBasicSectionProps) {
  const t = useTranslations('admin.eggs');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelection = (file: File | undefined | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    setPendingIconFile(file);
    setIconPreview(URL.createObjectURL(file));
    setForm((f) => ({ ...f, icon: 'pending' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files?.[0];
      if (file) handleFileSelection(file);
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleRemoveIcon = () => {
    setPendingIconFile(null);
    setIconPreview(null);
    setForm((f) => ({ ...f, icon: '' }));
  };

  const imageSrc =
    iconPreview ||
    (form.icon && form.icon !== 'pending'
      ? `${process.env.NEXT_PUBLIC_API_BASE || ''}${form.icon}`
      : '');

  return (
    <div className="animate-in fade-in duration-300">
      <section>
        <h2 className="text-base font-semibold text-white">{t('basicInfo')}</h2>
        <p className="mt-0.5 text-sm text-[#888]">{t('basicInfoDesc')}</p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">
              {t('eggName')} <span className="text-[#FF5722]">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={t('eggNamePlaceholder')}
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">
              {t('category')} <span className="text-[#FF5722]">*</span>
            </label>
            <CategorySelect
              value={form.category}
              onChange={(cat) => setForm((f) => ({ ...f, category: cat }))}
              initialCategories={preloadedCategories}
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-[#D4D4D4]">
              {t('description')} <span className="text-[#FF5722]">*</span>
            </label>
            <span className="text-xs text-[#666]">
              {form.description?.length || 0} / 150
            </span>
          </div>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder={t('descriptionPlaceholder')}
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 min-h-[80px]"
            maxLength={150}
            required
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">
            {t('eggIcon')} <span className="text-[#FF5722]">*</span>
          </label>
          <div className="flex items-center gap-3">
            {imageSrc && (
              <div className="relative w-11 h-11 bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                <img
                  src={imageSrc}
                  alt={t('eggIcon')}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
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
                disabled={uploadingIcon}
                className={`flex items-center justify-between w-full rounded-lg border px-4 h-[44px] text-sm text-[#888] transition-colors outline-none ${
                  isDragging
                    ? 'bg-[#FF5722]/10 border-[#FF5722] text-[#FF5722]'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
                }`}
              >
                <span className="truncate">
                  {uploadingIcon
                    ? t('uploadingIcon')
                    : form.icon
                    ? t('changeIcon')
                    : t('uploadIcon')}
                </span>
                {uploadingIcon ? (
                  <Loader2 size={16} className="animate-spin text-[#888] shrink-0" />
                ) : (
                  <Upload size={16} className="text-[#888] shrink-0" />
                )}
              </button>
            </div>

            {form.icon && (
              <button
                type="button"
                onClick={handleRemoveIcon}
                className="flex items-center justify-center h-[44px] w-[44px] rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
                title={t('removeIcon')}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-[#666]">{t('iconHelp')}</p>
        </div>
      </section>
    </div>
  );
}

export default EggFormBasicSection;
