import React from 'react';
import { useTranslations } from 'next-intl';
import { Upload } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';

interface AvatarUploadDropzoneProps {
  currentAvatar?: string;
  selectedFile: File | null;
  previewUrl: string | null;
  dragActive: boolean;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function AvatarUploadDropzone({
  currentAvatar,
  selectedFile,
  previewUrl,
  dragActive,
  onDrag,
  onDrop,
  onFileSelect,
  fileInputRef,
}: AvatarUploadDropzoneProps) {
  const t = useTranslations('Profile');

  return (
    <div
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`flex flex-col items-center justify-center min-h-[320px] sm:min-h-[360px] py-12 sm:py-16 px-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
        dragActive
          ? 'border-[#FF5722] bg-[#FF5722]/5'
          : 'border-white/[0.1] hover:border-white/[0.2] bg-[#141414]'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={onFileSelect}
      />

      {previewUrl ? (
        <div className="flex flex-col items-center gap-3.5 text-center">
          <div className="h-28 w-28 rounded-full overflow-hidden border-2 border-[#FF5722] shadow-xl">
            <img src={previewUrl} alt={t('preview')} className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-medium text-white truncate max-w-[260px]">
              {selectedFile?.name}
            </p>
            <p className="text-xs text-[#888] mt-0.5">
              {selectedFile && formatFileSize(selectedFile.size)} &rarr; {t('optimizedBadge')}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center">
          {currentAvatar ? (
            <div className="h-20 w-20 mb-1 rounded-full overflow-hidden">
              <UserAvatar src={currentAvatar} size={80} rounded="full" />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-full bg-white/[0.05] flex items-center justify-center text-[#888] mb-1">
              <Upload className="h-7 w-7" />
            </div>
          )}
          <p className="text-base font-medium text-white">{t('dragDropImage')}</p>
          <p className="text-xs text-[#888]">{t('supportedFormats')}</p>
        </div>
      )}
    </div>
  );
}
