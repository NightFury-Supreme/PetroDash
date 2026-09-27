/* ==========================================================================
   Toast Notification Provider
   Compliance: ISO/IEC 25010 (Fault Tolerance, Localization, User Experience)
========================================================================== */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Toast } from './Toast';
import { resolveErrorMessage, normalizeErrorCode } from '@/utils/formatApiError';

type ToastContextType = {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success'; id: number } | null>(null);
  const tError = useTranslations('ErrorState');
  const tBackendErrors = useTranslations('BackendErrors');
  const tGlobalErrors = useTranslations('GlobalErrors');
  const tCommon = useTranslations('Common');

  const showError = useCallback((rawMessage: string) => {
    if (!rawMessage || typeof rawMessage !== 'string') {
      setToast({ message: tBackendErrors('ERR_INTERNAL_SERVER'), type: 'error', id: Date.now() });
      return;
    }

    const code = normalizeErrorCode(rawMessage);

    // Account Banned: Notification & event dispatch for AuthGuard to route gracefully
    if (code === 'ERR_ACCOUNT_BANNED' || code.includes('ERR_ACCOUNT_BANNED')) {
      const msg = tBackendErrors.has('ERR_ACCOUNT_BANNED')
        ? tBackendErrors('ERR_ACCOUNT_BANNED')
        : 'Your account has been suspended.';
      setToast({ message: msg, type: 'error', id: Date.now() });

      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('is_banned', 'true');
        } catch {
          // ignore
        }
        window.dispatchEvent(new CustomEvent('account:banned'));
      }
      return;
    }

    const resolved = resolveErrorMessage(rawMessage, {
      tBackendErrors: (k) => tBackendErrors(k),
      hasBackendError: (k) => tBackendErrors.has(k),
      tGlobalErrors: (k) => tGlobalErrors(k),
      hasGlobalError: (k) => tGlobalErrors.has(k),
      tErrorState: (k, v) => tError(k, v),
      tCommon: (k) => tCommon(k),
    });

    setToast({ message: resolved, type: 'error', id: Date.now() });
  }, [tError, tBackendErrors, tGlobalErrors, tCommon]);

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
