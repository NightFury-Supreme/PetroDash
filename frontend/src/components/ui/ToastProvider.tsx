'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast } from './Toast';

type ToastContextType = {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

import { useTranslations } from 'next-intl';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success'; id: number } | null>(null);
  const tError = useTranslations('ErrorState');

  const showError = useCallback((message: string) => {
    let expandedMessage = message;
    const e = message.toLowerCase();
    
    if (e === 'forbidden' || e === 'unauthorized' || e === 'access denied') {
      expandedMessage = tError('descForbidden');
    } else if (e === 'not found') {
      expandedMessage = tError('descNotFound', { topic: tError('defaultResource') });
    } else if (e.includes('failed to fetch') || e.includes('network error')) {
      expandedMessage = tError('descNetwork');
    } else if (e.includes('too many requests') || e.includes('rate limit')) {
      expandedMessage = tError('descRateLimit');
    }

    setToast({ message: expandedMessage, type: 'error', id: Date.now() });
  }, [tError]);

  const showSuccess = useCallback((message: string) => {
    setToast({ message, type: 'success', id: Date.now() });
  }, []);

  return (
    <ToastContext.Provider value={{ showError, showSuccess }}>
      {children}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast((current) => (current?.id === toast.id ? null : current))}
        />
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
