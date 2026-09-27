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
      setToast({ message: tBackendErrors('ERR_INTERNAL_SERVER'), type: 'error', id: Date.now() });
      return;
    }

    // Strip namespaces if raw key was passed (e.g. BackendErrors.ERR_ACCOUNT_BANNED)
    let code = rawMessage.trim();
    if (code.startsWith('BackendErrors.')) {
      code = code.replace('BackendErrors.', '');
    } else if (code.startsWith('GlobalErrors.')) {
      code = code.replace('GlobalErrors.', '');
    } else if (code.startsWith('ErrorState.')) {
      code = code.replace('ErrorState.', '');
    }

    // 1. Account Banned: Global detection & graceful redirection to /banned
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
        if (!window.location.pathname.includes('/banned')) {
          window.dispatchEvent(new CustomEvent('account:banned'));
          setTimeout(() => {
            window.location.replace('/banned');
          }, 300);
        }
      }
      return;
    }

    // 2. Direct lookup in BackendErrors
    if (tBackendErrors.has(code)) {
      setToast({ message: tBackendErrors(code), type: 'error', id: Date.now() });
      return;
    }

    // 3. Direct lookup in GlobalErrors
    if (tGlobalErrors.has(code)) {
      setToast({ message: tGlobalErrors(code), type: 'error', id: Date.now() });
      return;
    }

    // 4. Normalized standard errors
    const lower = code.toLowerCase();
    let expandedMessage = rawMessage;

    if (
      lower === 'forbidden' ||
      lower === 'unauthorized' ||
      lower === 'access denied' ||
      code === 'ERR_FORBIDDEN' ||
      code === 'ERR_UNAUTHORIZED'
    ) {
      expandedMessage = tError('descForbidden');
    } else if (lower === 'not found' || code === 'ERR_NOT_FOUND') {
      expandedMessage = tError('descNotFound', { topic: tCommon('item') || 'resource' });
    } else if (
      lower.includes('failed to fetch') ||
      lower.includes('network error') ||
      code === 'ERR_NETWORK'
    ) {
      expandedMessage = tError('descNetwork');
    } else if (
      lower.includes('too many requests') ||
      lower.includes('rate limit') ||
      code === 'ERR_RATE_LIMIT'
    ) {
      expandedMessage = tError('descRateLimit');
    } else if (code === 'ERR_SERVER_TIMEOUT') {
      expandedMessage = tBackendErrors.has('ERR_SERVER_TIMEOUT')
        ? tBackendErrors('ERR_SERVER_TIMEOUT')
        : tError('descNetwork');
    } else if (code === 'ERR_INTERNAL_SERVER') {
      expandedMessage = tBackendErrors.has('ERR_INTERNAL_SERVER')
        ? tBackendErrors('ERR_INTERNAL_SERVER')
        : 'Internal Server Error';
    } else if (code.startsWith('ERR_')) {
      // Unmapped machine code: format to human sentence rather than showing ugly ERR_*
      const friendly = code.replace(/^ERR_/, '').replace(/_/g, ' ').toLowerCase();
      expandedMessage = friendly.charAt(0).toUpperCase() + friendly.slice(1) + '.';
    }

    setToast({ message: expandedMessage, type: 'error', id: Date.now() });
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
