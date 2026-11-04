import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { RefreshCw, RotateCcw, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useToast } from "@/components/ui/ToastProvider";
import { Drawer } from '@/components/ui/Drawer';
import { AvatarUploadDropzone } from './AvatarUploadDropzone';
import { AvatarOAuthSync } from './AvatarOAuthSync';
import { AvatarImageCropper, AvatarImageCropperRef } from './AvatarImageCropper';

export interface AvatarUploadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  hasDiscord?: boolean;
  hasGoogle?: boolean;
  onUpload: (file: File) => Promise<void>;
  onSyncOAuth?: (provider: 'discord' | 'google') => Promise<void>;
  onResetGravatar: () => Promise<void>;
}

export function AvatarUploadDrawer({
  isOpen,
  onClose,
  currentAvatar,
  hasDiscord = false,
  hasGoogle = false,
  onUpload,
  onSyncOAuth,
  onResetGravatar,
}: AvatarUploadDrawerProps) {
  const t = useTranslations('Profile');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');
  const { showError } = useToast();

  const resolveError = (err: unknown): string => {
    if (err instanceof Error) {
      if (tErrorBackend.has(err.message)) return tErrorBackend(err.message);
      if (t.has(err.message)) return t(err.message);
      return err.message;
    }
    return tCommon('error');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<AvatarImageCropperRef>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [syncingProvider, setSyncingProvider] = useState<'discord' | 'google' | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [isOpen]);

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateAndSelectFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      showError(t('invalidFileType'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError(t('fileTooLarge'));
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) validateAndSelectFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setSubmitting(true);
    try {
      const fileToUpload = cropperRef.current
        ? await cropperRef.current.getCroppedFile()
        : selectedFile;
      await onUpload(fileToUpload);
      onClose();
    } catch (err: unknown) {
      showError(resolveError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncSubmit = async (provider: 'discord' | 'google') => {
    if (!onSyncOAuth) return;
    setSyncingProvider(provider);
    try {
      await onSyncOAuth(provider);
      onClose();
    } catch (err: unknown) {
      showError(resolveError(err));
    } finally {
      setSyncingProvider(null);
    }
  };

  const handleResetSubmit = async () => {
    setResetting(true);
    try {
      await onResetGravatar();
      onClose();
    } catch (err: unknown) {
      showError(resolveError(err));
    } finally {
      setResetting(false);
    }
  };

  const isCropping = Boolean(selectedFile && previewUrl);

  const footer = (
    <div className="flex items-center justify-between gap-3">
      {isCropping ? (
        <button
          type="button"
          onClick={clearSelection}
          disabled={submitting}
          className="flex items-center gap-1.5 text-xs text-[#888] hover:text-white transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{t('back')}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleResetSubmit}
          disabled={resetting || submitting}
          className="flex items-center gap-1.5 text-xs text-[#888] hover:text-white transition-colors disabled:opacity-50"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span>{t('resetGravatar')}</span>
        </button>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isCropping || submitting || resetting}
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#FF5722] hover:bg-[#ff6939] px-5 text-xs font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
        >
          {submitting ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>{t('uploadingAvatar')}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{t('save')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isCropping ? t('cropImage') : t('updateAvatar')}
      subtitle={isCropping ? t('cropImageDesc') : t('uploadAvatarDesc')}
      footer={footer}
    >
      <div className="space-y-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) validateAndSelectFile(e.target.files[0]);
          }}
        />

        {isCropping && selectedFile && previewUrl ? (
          <AvatarImageCropper
            ref={cropperRef}
            imageSrc={previewUrl}
            originalFile={selectedFile}
            onChangeImage={() => fileInputRef.current?.click()}
            disabled={submitting}
          />
        ) : (
          <>
            <AvatarUploadDropzone
              currentAvatar={currentAvatar}
              selectedFile={selectedFile}
              previewUrl={previewUrl}
              dragActive={dragActive}
              onDrag={handleDrag}
              onDrop={handleDrop}
              onFileSelect={(e) => {
                if (e.target.files?.[0]) validateAndSelectFile(e.target.files[0]);
              }}
              fileInputRef={fileInputRef}
            />

            <AvatarOAuthSync
              hasDiscord={hasDiscord}
              hasGoogle={hasGoogle}
              syncingProvider={syncingProvider}
              disabled={syncingProvider !== null || submitting}
              onSync={handleSyncSubmit}
            />
          </>
        )}
      </div>
    </Drawer>
  );
}
