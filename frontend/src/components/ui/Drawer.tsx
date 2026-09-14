"use client";

import { useEffect, useState, ReactNode } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  headerExtra?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  headerExtra,
  footer,
  children,
}: DrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay to allow initial render before starting slide animation
      setIsClosing(false);
      const t = setTimeout(() => setMounted(true), 30);
      return () => clearTimeout(t);
    } else {
      if (mounted) {
        setIsClosing(true);
        const t = setTimeout(() => {
          setMounted(false);
        }, 300);
        return () => clearTimeout(t);
      }
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setMounted(false);
      onClose();
    }, 300);
  };

  // If not open and not currently animating out, don't render anything
  if (!isOpen && !mounted) return null;

  const showDrawer = mounted && !isClosing;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end font-sans">
      {/* overlay */}
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ${
          showDrawer ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* drawer */}
      <div
        className={`relative flex h-full w-full max-w-xl flex-col border-l border-white/5 bg-[#0F0F0F] transition-transform duration-300 ease-out will-change-transform transform-gpu ${
          showDrawer ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4 bg-[#0F0F0F] px-6 py-6 sm:px-8 relative z-10 shrink-0">
          <div className="flex items-start gap-4">

            <div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="text-xl font-semibold text-[#FF5722] tracking-tight">{title}</h1>
                {headerExtra}
              </div>
              {subtitle && <p className="mt-0.5 text-sm text-[#888]">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[#222] text-[#888] transition-colors hover:border-[#333] hover:text-[#D4D4D4] hover:bg-[#161616] bg-transparent"
          >
            <X size={16} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-7 sm:px-8">
          {children}
        </div>

        {/* footer */}
        {footer && (
          <div className="border-t border-[#222] bg-[#0F0F0F] px-6 py-5 sm:px-8 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
