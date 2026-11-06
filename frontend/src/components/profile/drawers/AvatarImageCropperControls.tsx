'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ZoomIn, ZoomOut, RotateCw, RotateCcw, Upload } from 'lucide-react';

export interface AvatarImageCropperControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onZoomStep: (delta: number) => void;
  onRotate: () => void;
  onReset: () => void;
  onChangeImage: () => void;
  disabled: boolean;
  canReset: boolean;
}

export function AvatarImageCropperControls({
  zoom,
  onZoomChange,
  onZoomStep,
  onRotate,
  onReset,
  onChangeImage,
  disabled,
  canReset,
}: AvatarImageCropperControlsProps) {
  const t = useTranslations('Profile');

  return (
    <>
      <div className="w-full flex items-center gap-3 px-2">
        <button
          type="button"
          onClick={() => onZoomStep(-0.1)}
          disabled={disabled || zoom <= 1}
          aria-label={t('zoom')}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-[#888] hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-30"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <input
          type="range"
          min="1"
          max="3"
          step="0.01"
          value={zoom}
          disabled={disabled}
          onChange={(e) => onZoomChange(parseFloat(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-[#222] accent-[#FF5722]"
        />
        <button
          type="button"
          onClick={() => onZoomStep(0.1)}
          disabled={disabled || zoom >= 3}
          aria-label={t('zoom')}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-[#888] hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-30"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      <div className="w-full flex items-center justify-between pt-2 border-t border-white/[0.08]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRotate}
            disabled={disabled}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/[0.08] text-xs font-medium text-[#AAA] hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-30"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>{t('rotate')}</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={disabled || !canReset}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/[0.08] text-xs font-medium text-[#AAA] hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-30"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{t('resetCrop')}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onChangeImage}
          disabled={disabled}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/[0.08] text-xs font-medium text-[#AAA] hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>{t('changeImage')}</span>
        </button>
      </div>
    </>
  );
}
