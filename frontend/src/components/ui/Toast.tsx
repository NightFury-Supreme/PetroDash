'use client';

import React, { useEffect, useState } from 'react';
import { XCircle, CheckCircle2, X } from 'lucide-react';

type ToastType = 'error' | 'success';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss: () => void;
}

export function Toast({ message, type = 'error', duration = 3500, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);

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

  return (
    <div
      className={`fixed bottom-4 right-4 z-[9999] transition-all duration-300 ease-out ${
        visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'
      }`}
    >
      <div
        className={`flex items-center justify-between gap-4 px-4 py-3 min-w-[300px] max-w-md rounded-lg shadow-2xl border ${
          isError
            ? 'bg-[#1a0f0f] text-[#ffbaba] border-[#5f1313]'
            : 'bg-[#0f1a14] text-[#86efac] border-[#0f4a30]'
        }`}
      >
        <div className="flex items-center gap-3">
          {isError ? (
            <XCircle size={18} className="shrink-0 text-red-500" />
          ) : (
            <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
          )}
          <span className="text-[13px] sm:text-sm font-medium leading-tight">{message}</span>
        </div>
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
          className="shrink-0 rounded p-1 opacity-50 transition-all hover:bg-white/5 hover:opacity-100"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
