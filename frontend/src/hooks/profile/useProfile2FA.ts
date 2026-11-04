"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { updateCachedUser } from "@/utils/userCache";
import { useToast } from "@/components/ui/ToastProvider";

export interface UseProfile2FAProps {
  onStatusChanged?: (enabled: boolean) => void;
}

export function useProfile2FA({ onStatusChanged }: UseProfile2FAProps = {}) {
  const { showError } = useToast();
  const tErrorBackend = useTranslations('BackendErrors');
  const tCommon = useTranslations('Common');

  const [show2FASetupDrawer, setShow2FASetupDrawer] = useState(false);
  const [show2FADisableDrawer, setShow2FADisableDrawer] = useState(false);
  const [tfaSetupData, setTfaSetupData] = useState<{ secret: string; qrCodeUrl: string; qr?: string } | null>(null);
  const [tfaBackupCodes, setTfaBackupCodes] = useState<string[] | null>(null);
  const [tfaLoading, setTfaLoading] = useState(false);

  const start2FASetup = useCallback(async () => {
    setTfaLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/2fa/setup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errCode = data.error || 'ERR_INTERNAL_SERVER';
        showError(tErrorBackend.has(errCode) ? tErrorBackend(errCode) : errCode);
        return;
      }
      const qrCodeUrl = data.qrCodeUrl || data.qr || '';
      setTfaSetupData({ secret: data.secret, qrCodeUrl, qr: qrCodeUrl });
      setTfaBackupCodes(null);
      setShow2FASetupDrawer(true);
    } catch {
      const msg = tErrorBackend.has('ERR_NETWORK') ? tErrorBackend('ERR_NETWORK') : tCommon('error');
      showError(msg);
    } finally {
      setTfaLoading(false);
    }
  }, [showError, tErrorBackend, tCommon]);

  const verifyAndEnable2FA = useCallback(async (code: string) => {
    setTfaLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/2fa/enable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ code, secret: tfaSetupData?.secret }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'ERR_2FA_INVALID');
      setTfaBackupCodes(data.backupCodes);
      updateCachedUser({ tfaEnabled: true });
      window.dispatchEvent(new CustomEvent('user:refresh'));
      onStatusChanged?.(true);
    } finally {
      setTfaLoading(false);
    }
  }, [onStatusChanged, tfaSetupData]);

  const disable2FA = useCallback(async (password: string, code: string) => {
    setTfaLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/2fa/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ password: password || undefined, code: code || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'ERR_INVALID_PASSWORD');
      updateCachedUser({ tfaEnabled: false });
      window.dispatchEvent(new CustomEvent('user:refresh'));
      onStatusChanged?.(false);
      setShow2FADisableDrawer(false);
    } finally {
      setTfaLoading(false);
    }
  }, [onStatusChanged]);

  return {
    show2FASetupDrawer,
    setShow2FASetupDrawer,
    show2FADisableDrawer,
    setShow2FADisableDrawer,
    tfaSetupData,
    setTfaSetupData,
    tfaBackupCodes,
    setTfaBackupCodes,
    tfaLoading,
    start2FASetup,
    verifyAndEnable2FA,
    disable2FA,
  };
}
