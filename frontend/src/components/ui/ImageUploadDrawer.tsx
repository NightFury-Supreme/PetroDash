'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, ArrowLeft, CheckCircle2, RefreshCw, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Drawer } from './Drawer';
import { SafeImage } from './SafeImage';
import { useToast } from './ToastProvider';
import { AvatarImageCropper, AvatarImageCropperRef } from '@/components/profile/drawers/AvatarImageCropper';

export interface ImageUploadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => Promise<void> | void;
  onRemove?: () => Promise<void> | void;
  removeLabel?: string;
  initialFile?: File | null;
  currentImage?: string | null;
  cropShape?: 'circle' | 'square' | 'flag';
  title?: string;
  subtitle?: string;
  cropTitle?: string;
  cropSubtitle?: string;
  zIndex?: string;
}

export function ImageUploadDrawer({
  isOpen,
  onClose,
  onCropComplete,
  onRemove,
  removeLabel,
  initialFile,
  currentImage,
  cropShape = 'square',
  title,
  subtitle,
  cropTitle,
  cropSubtitle,
  zIndex = 'z-[110]',
}: ImageUploadDrawerProps) {
  const tProfile = useTranslations('Profile');
  const tCommon = useTranslations('Common');
  const { showError } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<AvatarImageCropperRef>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [applying, setApplying] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialFile) {
        setSelectedFile(initialFile);
        setPreviewUrl(URL.createObjectURL(initialFile));
      }
    } else {
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setDragActive(false);
      setApplying(false);
    }
  }, [isOpen, initialFile]);

  const validateAndSelectFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showError(tProfile('invalidFileType'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError(tProfile('fileTooLarge'));
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

  const handleBack = () => {
    if (isCropping) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setSelectedFile(null);
    } else {
      onClose();
    }
  };

  const handleApply = async () => {
    if (!selectedFile) return;
    setApplying(true);
    try {
      const croppedFile = cropperRef.current
        ? await cropperRef.current.getCroppedFile()
        : selectedFile;
      await onCropComplete(croppedFile);
      onClose();
    } catch (e: unknown) {
      if (e instanceof Error && e.message) {
        showError(e.message);
      }
    } finally {
      setApplying(false);
    }
  };

  const isCropping = Boolean(selectedFile && previewUrl);

  const drawerTitle = isCropping
    ? (cropTitle || tProfile('cropImage'))
    : (title || tProfile('updateAvatar'));

  const drawerSubtitle = isCropping
    ? (cropSubtitle || tProfile('cropImageDesc'))
    : (subtitle || tProfile('uploadAvatarDesc'));

  const footer = (
    <div className="flex items-center justify-between gap-3 w-full">
      {isCropping ? (
        <button
          type="button"
          onClick={handleBack}
          disabled={applying}
          className="flex items-center gap-1.5 text-xs text-[#888] hover:text-white transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{tCommon('back')}</span>
        </button>
      ) : onRemove ? (
        <button
          type="button"
          onClick={async () => {
            setRemoving(true);
            try {
              await onRemove();
            } finally {
              setRemoving(false);
            }
          }}
          disabled={applying || removing || !currentImage}
          className="flex items-center gap-1.5 text-xs text-[#888] hover:text-white transition-colors disabled:opacity-50"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${removing ? 'animate-spin' : ''}`} />
          <span>{removeLabel || tProfile('resetGravatar')}</span>
        </button>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleApply}
          disabled={!isCropping || applying || removing}
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#FF5722] hover:bg-[#ff6939] px-5 text-xs font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
        >
          {applying ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>{tCommon('saving')}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{tCommon('save')}</span>
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
      title={drawerTitle}
      subtitle={drawerSubtitle}
      footer={footer}
      zIndex={zIndex}
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
            cropShape={cropShape}
            onChangeImage={() => fileInputRef.current?.click()}
            disabled={applying}
          />
        ) : (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center min-h-[320px] sm:min-h-[360px] py-12 sm:py-16 px-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
              dragActive
                ? 'border-[#FF5722] bg-[#FF5722]/5'
                : 'border-white/[0.1] hover:border-white/[0.2] bg-[#141414]'
            }`}
          >
            {currentImage ? (
              <div className="h-24 w-24 mb-4 rounded-xl overflow-hidden border border-white/10 bg-white/[0.02] flex items-center justify-center shadow-lg">
                <SafeImage
                  src={currentImage}
                  alt=""
                  className="h-full w-full object-contain"
                  fallback={<Upload className="h-8 w-8 text-[#888]" />}
                />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-white/[0.05] flex items-center justify-center text-[#888] mb-4">
                <Upload className="h-7 w-7" />
              </div>
            )}
            <p className="text-base font-medium text-white text-center">{tProfile('dragDropImage')}</p>
            <p className="text-xs text-[#888] mt-1 text-center">{tProfile('supportedFormats')}</p>
          </div>
        )}
      </div>
    </Drawer>
  );
}

export default ImageUploadDrawer;

