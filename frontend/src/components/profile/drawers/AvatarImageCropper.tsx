'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import { useTranslations } from 'next-intl';
import { RefreshCw } from 'lucide-react';
import { AvatarImageCropperControls } from './AvatarImageCropperControls';

export interface AvatarImageCropperRef {
  getCroppedFile: () => Promise<File>;
}

export interface AvatarImageCropperProps {
  imageSrc: string;
  originalFile: File;
  onChangeImage: () => void;
  disabled?: boolean;
  cropShape?: 'circle' | 'square' | 'flag';
}

const clamp = (v: number, max: number) => Math.min(Math.max(v, -max), max);

export const AvatarImageCropper = forwardRef<AvatarImageCropperRef, AvatarImageCropperProps>(
  function AvatarImageCropper({ imageSrc, originalFile, onChangeImage, disabled = false, cropShape = 'circle' }, ref) {
    const t = useTranslations('Profile');

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dprRef = useRef(1);
    const isDragging = useRef(false);
    const dragOrigin = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

    const [displaySize, setDisplaySize] = useState(460);
    const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
    const [imageError, setImageError] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      const updateSize = () => {
        if (container.clientWidth > 0) setDisplaySize(Math.min(container.clientWidth, 480));
      };
      updateSize();
      const ro = new ResizeObserver(updateSize);
      ro.observe(container);
      return () => ro.disconnect();
    }, []);

    useEffect(() => {
      setLoadedImage(null);
      setImageError(false);
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      if (!imageSrc) return;
      let active = true;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { if (active) setLoadedImage(img); };
      img.onerror = () => { if (active) setImageError(true); };
      img.src = imageSrc;
      return () => { active = false; };
    }, [imageSrc]);

    const isFlag = cropShape === 'flag';
    const isCircle = cropShape === 'circle';
    const cropW = isFlag ? Math.round(displaySize * 0.86) : Math.round(displaySize * 0.78);
    const cropH = isFlag ? Math.round(cropW * 0.75) : cropW;
    const isRotated = rotation === 90 || rotation === 270;
    const effW = loadedImage ? (isRotated ? loadedImage.naturalHeight : loadedImage.naturalWidth) : cropW;
    const effH = loadedImage ? (isRotated ? loadedImage.naturalWidth : loadedImage.naturalHeight) : cropH;
    const baseScale = Math.max(cropW / (effW || 1), cropH / (effH || 1));
    const currentScale = baseScale * zoom;
    const maxPanX = Math.max(0, (effW * currentScale - cropW) / 2);
    const maxPanY = Math.max(0, (effH * currentScale - cropH) / 2);

    useEffect(() => {
      setPan((p) => ({ x: clamp(p.x, maxPanX), y: clamp(p.y, maxPanY) }));
    }, [maxPanX, maxPanY]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      canvas.width = displaySize * dpr;
      canvas.height = displaySize * dpr;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, displaySize, displaySize);

      if (loadedImage) {
        ctx.save();
        ctx.translate(displaySize / 2 + pan.x, displaySize / 2 + pan.y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(currentScale, currentScale);
        ctx.drawImage(
          loadedImage,
          -loadedImage.naturalWidth / 2,
          -loadedImage.naturalHeight / 2,
          loadedImage.naturalWidth,
          loadedImage.naturalHeight,
        );
        ctx.restore();
      }

      const half = displaySize / 2;
      const x0 = half - cropW / 2;
      const y0 = half - cropH / 2;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      ctx.rect(0, 0, displaySize, displaySize);
      if (isCircle) {
        ctx.arc(half, half, cropW / 2, 0, Math.PI * 2, true);
        ctx.closePath();
      } else {
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0, y0 + cropH);
        ctx.lineTo(x0 + cropW, y0 + cropH);
        ctx.lineTo(x0 + cropW, y0);
        ctx.closePath();
      }
      ctx.fill();

      ctx.strokeStyle = '#FF5722';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (isCircle) {
        ctx.arc(half, half, cropW / 2, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(x0, y0, cropW, cropH);
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      if (isCircle) {
        ctx.moveTo(half, y0); ctx.lineTo(half, y0 + cropH);
        ctx.moveTo(x0, half); ctx.lineTo(x0 + cropW, half);
      } else {
        const w3 = cropW / 3;
        const h3 = cropH / 3;
        ctx.moveTo(x0 + w3, y0); ctx.lineTo(x0 + w3, y0 + cropH);
        ctx.moveTo(x0 + w3 * 2, y0); ctx.lineTo(x0 + w3 * 2, y0 + cropH);
        ctx.moveTo(x0, y0 + h3); ctx.lineTo(x0 + cropW, y0 + h3);
        ctx.moveTo(x0, y0 + h3 * 2); ctx.lineTo(x0 + cropW, y0 + h3 * 2);
      }
      ctx.stroke();
      ctx.restore();
    }, [loadedImage, pan.x, pan.y, rotation, currentScale, displaySize, cropW, cropH, isCircle]);

    const getCroppedFile = useCallback((): Promise<File> => {
      return new Promise((resolve) => {
        if (!loadedImage?.naturalWidth) return resolve(originalFile);

        const outW = 512;
        const outH = isFlag ? 384 : 512;
        const out = document.createElement('canvas');
        out.width = outW;
        out.height = outH;
        const ctx = out.getContext('2d');
        if (!ctx) return resolve(originalFile);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const R = outW / cropW;
        ctx.translate(outW / 2, outH / 2);
        ctx.translate(pan.x * R, pan.y * R);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(currentScale * R, currentScale * R);
        ctx.drawImage(
          loadedImage,
          -loadedImage.naturalWidth / 2,
          -loadedImage.naturalHeight / 2,
          loadedImage.naturalWidth,
          loadedImage.naturalHeight,
        );

        out.toBlob(
          (blob) => {
            if (!blob) return resolve(originalFile);
            const ext = blob.type === 'image/webp' ? '.webp' : '.png';
            const base = originalFile.name.replace(/\.[^.]+$/, '');
            resolve(new File([blob], `${base}${ext}`, { type: blob.type, lastModified: Date.now() }));
          },
          'image/webp',
          0.92,
        );
      });
    }, [loadedImage, originalFile, pan.x, pan.y, rotation, currentScale, cropW, isFlag]);

    useImperativeHandle(ref, () => ({ getCroppedFile }), [getCroppedFile]);

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (disabled || !loadedImage) return;
      isDragging.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragOrigin.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDragging.current || disabled || !loadedImage) return;
      const dx = e.clientX - dragOrigin.current.x;
      const dy = e.clientY - dragOrigin.current.y;
      setPan({
        x: clamp(dragOrigin.current.panX + dx, maxPanX),
        y: clamp(dragOrigin.current.panY + dy, maxPanY),
      });
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      isDragging.current = false;
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { }
    };

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (disabled || !loadedImage) return;
      const delta = e.deltaY * -0.002;
      setZoom((z) => Math.min(3, Math.max(1, Number((z + delta).toFixed(2)))));
    };

    const canReset = zoom !== 1 || rotation !== 0 || pan.x !== 0 || pan.y !== 0;

    return (
      <div ref={containerRef} className="flex flex-col items-center gap-6 w-full py-1">
        <div
          style={{ width: displaySize, height: displaySize }}
          className="relative rounded-2xl overflow-hidden shrink-0 bg-[#111] border border-white/[0.08] shadow-2xl"
        >
          <canvas
            ref={canvasRef}
            style={{ display: 'block', width: displaySize, height: displaySize }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            className="cursor-grab active:cursor-grabbing touch-none select-none"
          />

          {!loadedImage && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-[#111]">
              <RefreshCw className="h-6 w-6 animate-spin text-[#FF5722]" />
            </div>
          )}

          {imageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-[#111] gap-2">
              <p className="text-xs text-red-400">{t('imageLoadFailed')}</p>
              <button
                type="button"
                onClick={onChangeImage}
                className="text-xs text-[#FF5722] underline pointer-events-auto"
              >
                {t('chooseAnother')}
              </button>
            </div>
          )}
        </div>

        <div style={{ maxWidth: displaySize }} className="w-full space-y-4">
          <AvatarImageCropperControls
            zoom={zoom}
            onZoomChange={(newZoom) => setZoom(newZoom)}
            onZoomStep={(delta) => setZoom((z) => Math.min(3, Math.max(1, Number((z + delta).toFixed(2)))))}
            onRotate={() => setRotation((r) => (r + 90) % 360)}
            onReset={() => { setZoom(1); setRotation(0); setPan({ x: 0, y: 0 }); }}
            onChangeImage={onChangeImage}
            disabled={disabled || !loadedImage}
            canReset={canReset}
          />
        </div>
      </div>
    );
  }
);
