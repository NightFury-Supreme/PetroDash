import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import React, { useState } from 'react';
import { useToast } from "@/components/ui/ToastProvider";
import { Drawer } from '@/components/ui/Drawer';
import { ValidationMsg } from '../ui/ValidationMsg';
import { KeyRound
} from "lucide-react";

export function PasswordDrawer({ isOpen,
  onClose,
  tfaEnabled,
  updatePassword,
}: {
  isOpen: boolean;
  onClose: () => void;
  tfaEnabled?: boolean;
  updatePassword: (current: string, newPass: string, tfa: string) => Promise<void>;
}) {
  const t = useTranslations('Profile');
  const tErrorBackend = useTranslations('BackendErrors');
  const tError = useTranslations('GlobalErrors');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordTfaCode, setPasswordTfaCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [touchedCurrent, setTouchedCurrent] = useState(false);
  const [touchedNew, setTouchedNew] = useState(false);
  const [touchedTfa, setTouchedTfa] = useState(false);
  const { showError, showSuccess } = useToast();

  const currentValidation = useMemo(() => {
    if (!currentPassword) return { valid: false, message: tError('currentPasswordRequired') };
    return { valid: true, message: tError('currentPasswordEntered') };
  }, [currentPassword, tError]);

  const newValidation = useMemo(() => {
    if (!newPassword) return { valid: false, message: tError('newPasswordRequired') };
    if (newPassword.length < 8) return { valid: false, message: tError('passwordMin8') };
    if (!/[A-Za-z]/.test(newPassword)) return { valid: false, message: tError('passwordLetter') };
    if (!/\d/.test(newPassword)) return { valid: false, message: tError('passwordNumber') };
    return { valid: true, message: tError('passwordMeetsRequirements') };
  }, [newPassword, tError]);

  const tfaValidation = useMemo(() => {
    if (!tfaEnabled) return { valid: true, message: '' };
    if (!passwordTfaCode) return { valid: false, message: useBackupCode ? tError('backupCodeRequired') : tError('tfaCodeRequired') };
    if (useBackupCode && passwordTfaCode.length !== 8) return { valid: false, message: tError('enter8CharBackupCode') };
    if (!useBackupCode && passwordTfaCode.length !== 6) return { valid: false, message: tError('enter6DigitAuthCode') };
    return { valid: true, message: useBackupCode ? tError('8CharBackupCodeEntered') : tError('6DigitCodeEntered') };
  }, [passwordTfaCode, tfaEnabled, useBackupCode, tError]);

  const isValid = currentValidation.valid && newValidation.valid && tfaValidation.valid;

  const handleUpdate = async () => {
    setTouchedCurrent(true);
    setTouchedNew(true);
    setTouchedTfa(true);
    if (!isValid) return;
    setIsLoading(true);
    try {
      await updatePassword(currentPassword, newPassword, passwordTfaCode);
      showSuccess("Password updated successfully.");
      handleClose();
    } catch (e: any) {
      
        const errKey = e.details?.[0]?.message || e.message;
        showError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : (e.message || 'An error occurred'));
    
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setCurrentPassword('');
    setNewPassword('');
    setPasswordTfaCode('');
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title={t('changePassword')} subtitle={t('changePasswordDesc')} icon={<KeyRound className="text-[#FF5722]" size={20} />}>
      <div className="grid gap-6 mt-2">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#888] mb-2 font-medium">{t('currentPassword')}</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => { setCurrentPassword(e.target.value); setTouchedCurrent(true); }}
            onBlur={() => setTouchedCurrent(true)}
            disabled={isLoading}
            className={`w-full h-11 rounded-lg border bg-[#161616] px-4 text-[13px] text-white outline-none focus:border-[#FF5722] transition-colors disabled:opacity-50 ${touchedCurrent && !currentValidation.valid ? 'border-red-400/30' : 'border-[#222]'}`}
            placeholder={t('placeholderPassword')}
          />
          <ValidationMsg touched={touchedCurrent} valid={currentValidation.valid} message={currentValidation.message} hideSuccess={true} />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#888] mb-2 font-medium">{t('newPassword')}</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setTouchedNew(true); }}
            onBlur={() => setTouchedNew(true)}
            disabled={isLoading}
            className={`w-full h-11 rounded-lg border bg-[#161616] px-4 text-[13px] text-white outline-none focus:border-[#FF5722] transition-colors disabled:opacity-50 ${touchedNew && !newValidation.valid ? 'border-red-400/30' : 'border-[#222]'}`}
            placeholder={t('minimum8Characters')}
          />
          <ValidationMsg touched={touchedNew} valid={newValidation.valid} message={newValidation.message} />
        </div>
        {tfaEnabled && (
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-[11px] uppercase tracking-wider text-[#888] font-medium">{useBackupCode ? t('backupCode') : t('tfaCode')}</label>
              <button type="button" onClick={() => { setUseBackupCode(!useBackupCode); setPasswordTfaCode(''); setTouchedTfa(false); }} className="text-[12px] font-medium text-[#FF5722] hover:text-[#F4511E] transition-colors">
                {useBackupCode ? t('use2faCode') : t('useBackupCode')}
              </button>
            </div>
            <input
              type="text"
              maxLength={useBackupCode ? 8 : 6}
              value={passwordTfaCode}
              onChange={(e) => { setPasswordTfaCode(e.target.value.replace(useBackupCode ? /[^0-9a-fA-F]/g : /\D/g, '')); setTouchedTfa(true); }}
              onBlur={() => setTouchedTfa(true)}
              disabled={isLoading}
              className={`w-full h-11 rounded-lg border bg-[#161616] px-4 text-[14px] text-white outline-none focus:border-[#FF5722] transition-colors tracking-[0.2em] font-mono text-center disabled:opacity-50 ${touchedTfa && !tfaValidation.valid ? 'border-red-400/30' : 'border-[#222]'}`}
              placeholder={useBackupCode ? t('placeholderBackup') : t('placeholder123456')}
            />
            <ValidationMsg touched={touchedTfa} valid={tfaValidation.valid} message={tfaValidation.message} hideSuccess={true} />
          </div>
        )}
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={handleClose} disabled={isLoading} className="flex h-11 items-center justify-center rounded-lg border border-[#222] px-6 text-[13px] font-medium text-[#888] hover:bg-[#161616] hover:text-[#D4D4D4] transition-colors disabled:opacity-50 bg-transparent">{t('cancel')}</button>
          <button onClick={handleUpdate} disabled={isLoading || !isValid} className={`flex h-11 items-center justify-center rounded-lg px-6 text-[13px] font-medium transition-colors gap-2 ${(!isValid) ? 'bg-[#333] text-[#888] cursor-not-allowed' : 'bg-[#FF5722] hover:bg-[#F4511E] text-white disabled:opacity-50'}`}>
            {isLoading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : t('updatePassword')}
          </button>
        </div>
      </div>
    </Drawer>
  );
}

