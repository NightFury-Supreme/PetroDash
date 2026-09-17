'use client';

import React, { useEffect, useState } from 'react';
import { XCircle, CheckCircle2, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

type ToastType = 'error' | 'success';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
}

export function Toast({ message, type = 'error', duration = 3500, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Trigger slide-in on mount
    const showTimer = setTimeout(() => setVisible(true), 10);
    // Auto dismiss
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // wait for slide-out animation
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onDismiss]);

  const isError = type === 'error';
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register') || pathname?.startsWith('/forgot') || pathname?.startsWith('/verify') || pathname === '/';

  return (
    <div
      style={{ left: isAuthPage ? '0px' : 'var(--sidebar-width, 16rem)' }}
      className={`fixed bottom-0 right-0 z-[9999] transition-transform duration-300 ease-out max-md:!left-0 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div
        className={`w-full flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] ${
          isError
            ? 'bg-[#5f1313] text-[#ffbaba] border-t border-[#8c1c1c]'
            : 'bg-[#10B981] text-white border-t border-[#059669]'
        }`}
      >
        <div className="flex items-center gap-3">
          {isError ? (
            <XCircle size={18} className="shrink-0 opacity-90" />
          ) : (
            <CheckCircle2 size={18} className="shrink-0 opacity-90" />
          )}
          <span className="text-[13px] sm:text-sm font-medium leading-tight">{message}</span>
        </div>
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
          className="ml-4 shrink-0 rounded p-1 opacity-70 transition-all hover:bg-white/10 hover:opacity-100"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
