import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import React, { useState } from 'react';
import { useToast } from "@/components/ui/ToastProvider";
import { Drawer } from '@/components/ui/Drawer';
import { ValidationMsg } from '../ui/ValidationMsg';
import { AlertTriangle
} from "lucide-react";

export function Disable2FADrawer({ isOpen,
  onClose,
  disable2FA,
}: {
  isOpen: boolean;
  onClose: () => void;
  disable2FA: (password: string, code: string) => Promise<void>;
}) {
  const t = useTranslations('Profile');
  const tErrorBackend = useTranslations('BackendErrors');
  const [tfaPassword, setTfaPassword] = useState('');
  const [tfaVerifyCode, setTfaVerifyCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [touchedPw, setTouchedPw] = useState(false);
  const [touchedCode, setTouchedCode] = useState(false);
  const { showError, showSuccess } = useToast();

  const pwValidation = useMemo(() => {
    if (!tfaPassword) return { valid: false, message: t('passwordRequired') || 'Password is required.' };
    if (tfaPassword.length < 6) return { valid: false, message: t('passwordMin6') || 'Password must be at least 6 characters.' };
    return { valid: true, message: t('passwordConfirmed') || 'Password confirmed.' };
  }, [tfaPassword, t]);

  const codeValidation = useMemo(() => {
    if (!tfaVerifyCode) return { valid: false, message: useBackupCode ? (t('backupCodeRequired') || 'Backup code is required.') : (t('tfaCodeRequired') || '2FA code is required.') };
    if (useBackupCode && tfaVerifyCode.length !== 8) return { valid: false, message: t('enterBackup8') || 'Enter your 8-character backup code.' };
    if (!useBackupCode && tfaVerifyCode.length !== 6) return { valid: false, message: t('enter6Authenticator') || 'Enter your 6-digit authenticator code.' };
    return { valid: true, message: useBackupCode ? (t('backup8Entered') || '8-character backup code entered.') : (t('code6DigitsEntered') || '6-digit code entered.') };
  }, [tfaVerifyCode, useBackupCode, t]);

  const handleClose = () => {
    onClose();
    setTfaPassword('');
    setTfaVerifyCode('');
    setTouchedPw(false);
    setTouchedCode(false);
  };

  const handleDisable = async () => {
    setTouchedPw(true);
    setTouchedCode(true);
    if (!pwValidation.valid || !codeValidation.valid) return;
    setIsLoading(true);
    try {
      await disable2FA(tfaPassword, tfaVerifyCode);
      showSuccess(t('disable2faTitle') ? (t('disable2faTitle') + " successful.") : "2FA disabled successfully.");
      handleClose();
    } catch (e: any) {
      const errKey = e.details?.[0]?.message || e.message;
      showError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : (e.message || 'An error occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title={t('disable2faTitle') || "Disable 2FA"} subtitle={t('disable2faSubtitle') || "Turn off Two-Factor Authentication"} icon={<AlertTriangle className="text-red-500" size={20} />}>
      <div className="grid gap-6 mt-2">
        <div className="flex items-start gap-3 rounded-lg bg-red-500/10 p-4 border border-red-500/20 text-red-400">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <p className="text-[13px] leading-relaxed">
            {t('disable2faWarning') || 'Disabling 2FA will make your account less secure. Please confirm your password and enter a 2FA code to continue.'}
          </p>
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#888] mb-2 font-medium">{t('password')}</label>
          <input
            type="password"
            value={tfaPassword}
            onChange={(e) => { setTfaPassword(e.target.value); setTouchedPw(true); }}
            onBlur={() => setTouchedPw(true)}
            disabled={isLoading}
            className={`w-full h-11 rounded-lg border bg-[#161616] px-4 text-[13px] text-white outline-none focus:border-red-500/50 transition-colors disabled:opacity-50 ${touchedPw && !pwValidation.valid ? 'border-red-400/30' : 'border-[#222]'}`}
            placeholder={t('placeholderPassword') || "••••••••"}
          />
          <ValidationMsg touched={touchedPw} valid={pwValidation.valid} message={pwValidation.message} hideSuccess={true} />
        </div>
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block text-[11px] uppercase tracking-wider text-[#888] font-medium">{useBackupCode ? (t('backupCode') || 'Backup Code') : (t('tfaCode') || '2FA Code')}</label>
            <button type="button" onClick={() => { setUseBackupCode(!useBackupCode); setTfaVerifyCode(''); setTouchedCode(false); }} className="text-[12px] font-medium text-red-400 hover:text-red-300 transition-colors">
              {useBackupCode ? (t('use2faCode') || 'Use 2FA Code') : (t('useBackupCode') || 'Use Backup Code')}
            </button>
          </div>
          <input
            type="text"
            maxLength={useBackupCode ? 8 : 6}
            value={tfaVerifyCode}
            onChange={(e) => { setTfaVerifyCode(e.target.value.replace(useBackupCode ? /[^0-9a-fA-F]/g : /\D/g, '')); setTouchedCode(true); }}
            onBlur={() => setTouchedCode(true)}
            disabled={isLoading}
            className={`w-full h-11 rounded-lg border bg-[#161616] px-4 text-[14px] text-white outline-none focus:border-red-500/50 transition-colors tracking-[0.2em] font-mono text-center disabled:opacity-50 ${touchedCode && !codeValidation.valid ? 'border-red-400/30' : 'border-[#222]'}`}
            placeholder={useBackupCode ? (t('placeholderBackup') || "a1b2c3d4") : (t('placeholder123456') || "123456")}
          />
          <ValidationMsg touched={touchedCode} valid={codeValidation.valid} message={codeValidation.message} hideSuccess={true} />
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={handleClose} disabled={isLoading} className="flex h-11 items-center justify-center rounded-lg border border-[#222] px-6 text-[13px] font-medium text-[#888] hover:bg-[#161616] hover:text-[#D4D4D4] transition-colors disabled:opacity-50 bg-transparent">{t('cancel')}</button>
          <button onClick={handleDisable} disabled={isLoading || !codeValidation.valid} className={`flex h-11 items-center justify-center gap-2 rounded-lg px-6 text-[13px] font-medium transition-colors disabled:cursor-not-allowed ${(isLoading || !codeValidation.valid) ? 'bg-[#333] text-[#888]' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
            {isLoading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : (t('confirmDisable') || "Confirm Disable")}
          </button>
        </div>
      </div>
    </Drawer>
  );
}
