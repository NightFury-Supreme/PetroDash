'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Loader2, Crop } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SafeImage, ImageUploadDrawer } from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
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
  pendingIconFile,
  setPendingIconFile,
  iconPreview,
  setIconPreview,
  uploadingIcon,
  preloadedCategories,
}: EggFormBasicSectionProps) {
  const t = useTranslations('admin.eggs');
  const tProfile = useTranslations('Profile');
  const tErrorBackend = useTranslations('BackendErrors');
  const { showError } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleFileSelection = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError(tErrorBackend('ERR_UPLOAD_INVALID_IMAGE'));
      return;
    }
    setCropFile(file);
    setIsDrawerOpen(true);
  };

  const handleCropComplete = (croppedFile: File) => {
    setPendingIconFile(croppedFile);
    setIconPreview(URL.createObjectURL(croppedFile));
    setForm((f) => ({ ...f, icon: 'pending' }));
    setIsDrawerOpen(false);
    setCropFile(null);
  };

  const handleOpenDrawer = () => {
    setCropFile(pendingIconFile);
    setIsDrawerOpen(true);
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
              className="w-full h-[42px] rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">
              {t('category')} <span className="text-[#FF5722]">*</span>
            </label>
            <CategorySelect
              value={form.category}
              onChange={(cat) => setForm((p) => ({ ...p, category: cat }))}
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
                <SafeImage
                  src={imageSrc}
                  alt={t('eggIcon')}
                  className="w-full h-full object-cover"
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
              <button
                type="button"
                onClick={handleOpenDrawer}
                disabled={uploadingIcon}
                className={`flex items-center justify-between w-full rounded-lg border px-4 h-[42px] text-sm text-[#888] transition-colors outline-none ${
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
              <div className="flex items-center gap-2 shrink-0">
                {pendingIconFile && (
                  <button
                    type="button"
                    onClick={handleOpenDrawer}
                    className="flex items-center justify-center h-[42px] w-[42px] rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#888] hover:text-white hover:bg-white/[0.08] transition-colors"
                    title={tProfile('cropImage')}
                  >
                    <Crop size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleRemoveIcon}
                  className="flex items-center justify-center h-[42px] w-[42px] rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                  title={t('removeIcon')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-[#666]">{t('iconHelp')}</p>
        </div>
      </section>

      <ImageUploadDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setCropFile(null);
        }}
        initialFile={cropFile}
        currentImage={imageSrc}
        onCropComplete={handleCropComplete}
        cropShape="square"
        title={t('eggIcon')}
        subtitle={t('iconHelp')}
        cropTitle={tProfile('cropImage')}
        cropSubtitle={tProfile('cropImageDesc')}
        zIndex="z-[110]"
      />
    </div>
  );
}

export default EggFormBasicSection;
