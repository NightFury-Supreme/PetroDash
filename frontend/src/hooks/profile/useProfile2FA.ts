"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";

export interface UseProfile2FAProps {
  onStatusChanged?: (enabled: boolean) => void;
}

export function useProfile2FA({ onStatusChanged }: UseProfile2FAProps = {}) {
  const tError = useTranslations('BackendErrors');
  const { showError } = useToast();

  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [show2FADisableModal, setShow2FADisableModal] = useState(false);
  const [tfaSetupData, setTfaSetupData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [tfaBackupCodes, setTfaBackupCodes] = useState<string[] | null>(null);

  const start2FASetup = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/2fa/setup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        showError(tError(data.error) || tError('failedToSetup2FA'));
        return;
      }
      setTfaSetupData(data);
      setTfaBackupCodes(null);
      setShow2FASetupModal(true);
    } catch {
      showError(tError('networkError'));
    }
  }, [showError, tError]);

  const verifyAndEnable2FA = useCallback(async (code: string) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/2fa/enable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'invalidVerificationCode');
    setTfaBackupCodes(data.backupCodes);
    onStatusChanged?.(true);
  }, [onStatusChanged]);

  const disable2FA = useCallback(async (password: string, code: string) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/2fa/disable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password: password || undefined, code: code || undefined })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'failedToDisable2FA');
    onStatusChanged?.(false);
    setShow2FADisableModal(false);
  }, [onStatusChanged]);

  return {
    show2FASetupModal,
    setShow2FASetupModal,
    show2FADisableModal,
    setShow2FADisableModal,
    tfaSetupData,
    setTfaSetupData,
    tfaBackupCodes,
    setTfaBackupCodes,
    start2FASetup,
    verifyAndEnable2FA,
    disable2FA,
  };
}
