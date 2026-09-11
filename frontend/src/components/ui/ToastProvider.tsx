'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast } from './Toast';

type ToastContextType = {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success'; id: number } | null>(null);

  const showError = useCallback((message: string) => {
    let expandedMessage = message;
    const e = message.toLowerCase();
    
    if (e === 'forbidden' || e === 'unauthorized' || e === 'access denied') {
      expandedMessage = 'You do not have permission to perform this action. Please contact an administrator if you believe this is a mistake.';
    } else if (e === 'not found') {
      expandedMessage = 'The requested resource could not be found. It may have been deleted.';
    } else if (e.includes('failed to fetch') || e.includes('network error')) {
      expandedMessage = 'Unable to connect to the server. Please try again in a few moments.';
    } else if (e.includes('too many requests') || e.includes('rate limit')) {
      expandedMessage = 'You are making requests too quickly. Please wait a moment and try again.';
    }

    setToast({ message: expandedMessage, type: 'error', id: Date.now() });
  }, []);

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
