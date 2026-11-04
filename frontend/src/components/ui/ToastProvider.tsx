/* ==========================================================================
   Toast Notification Provider
   Compliance: ISO/IEC 25010 (Fault Tolerance, Localization, User Experience)
========================================================================== */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Toast } from './Toast';

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
      setToast({ message: tCommon('somethingWentWrong'), type: 'error', id: Date.now() });
      return;
    }

    const trimmed = rawMessage.trim();

    // Account Banned: Notification & event dispatch for AuthGuard to route gracefully
    if (trimmed === 'ERR_ACCOUNT_BANNED' || trimmed.includes('ERR_ACCOUNT_BANNED')) {
      const msg = tBackendErrors.has('ERR_ACCOUNT_BANNED')
        ? tBackendErrors('ERR_ACCOUNT_BANNED')
        : trimmed;
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

    // Direct translation from translation namespaces
    let displayMessage = trimmed;
    if (tBackendErrors.has(trimmed)) {
      displayMessage = tBackendErrors(trimmed);
    } else if (tGlobalErrors.has(trimmed)) {
      displayMessage = tGlobalErrors(trimmed);
    } else if (tError.has(trimmed)) {
      displayMessage = tError(trimmed);
    }

    setToast({ message: displayMessage, type: 'error', id: Date.now() });
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
