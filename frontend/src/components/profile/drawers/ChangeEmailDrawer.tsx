import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import React, { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/ToastProvider";
import { Drawer } from '@/components/ui/Drawer';
import { ValidationMsg } from '../ui/ValidationMsg';
import { Mail
} from "lucide-react";

export function ChangeEmailDrawer({ isOpen,
  onClose,
  tfaEnabled,
  changeEmail,
  verifyEmailChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  tfaEnabled?: boolean;
  changeEmail: (newEmail: string, password: string, tfa: string) => Promise<{ requiresVerification: boolean } | void>;
  verifyEmailChange?: (newEmail: string, code: string) => Promise<void>;
}) {
  const t = useTranslations('Profile');
  const tErrorBackend = useTranslations('BackendErrors');
  const tError = useTranslations('GlobalErrors');
  const [step, setStep] = useState<1 | 2>(1);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [tfaCode, setTfaCode] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedCurrent, setTouchedCurrent] = useState(false);
  const [touchedTfa, setTouchedTfa] = useState(false);
  const [touchedVerify, setTouchedVerify] = useState(false);
  const { showError, showSuccess } = useToast();

  // Reset state when drawer closes/opens
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setNewEmail('');
        setCurrentPassword('');
        setTfaCode('');
        setVerifyCode('');
        setUseBackupCode(false);
        setTouchedEmail(false);
        setTouchedCurrent(false);
        setTouchedTfa(false);
        setTouchedVerify(false);
      }, 300);
    }
  }, [isOpen]);

  const emailValidation = useMemo(() => {
    if (!newEmail) return { valid: false, message: tError('newEmailRequired') };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return { valid: false, message: tError('invalidEmail') };
    return { valid: true, message: tError('validEmailFormat') };
  }, [newEmail, tError]);

  const currentValidation = useMemo(() => {
    if (!currentPassword) return { valid: false, message: tError('currentPasswordRequired') };
    return { valid: true, message: tError('currentPasswordEntered') };
  }, [currentPassword, tError]);

  const tfaValidation = useMemo(() => {
    if (!tfaEnabled) return { valid: true, message: '' };
    if (!tfaCode) return { valid: false, message: useBackupCode ? tError('backupCodeRequired') : tError('tfaCodeRequired') };
    if (useBackupCode && tfaCode.length !== 8) return { valid: false, message: tError('enter8CharBackupCode') };
    if (!useBackupCode && tfaCode.length !== 6) return { valid: false, message: tError('enter6DigitAuthCode') };
    return { valid: true, message: useBackupCode ? tError('8CharBackupCodeEntered') : tError('6DigitCodeEntered') };
  }, [tfaCode, tfaEnabled, useBackupCode, tError]);
  
  const verifyValidation = useMemo(() => {
    if (!verifyCode) return { valid: false, message: tError('verificationCodeRequired') };
    if (verifyCode.length !== 8) return { valid: false, message: tError('codeExactly8Char') };
    return { valid: true, message: tError('validCodeFormat') };
  }, [verifyCode, tError]);

  const isStep1Valid = emailValidation.valid && currentValidation.valid && tfaValidation.valid;
  const isStep2Valid = verifyValidation.valid;

  const handleClose = () => {
    onClose();
    setNewEmail('');
    setCurrentPassword('');
    setTfaCode('');
    setVerifyCode('');
    setStep(1);
  };

  const handleUpdate = async () => {
    setTouchedEmail(true);
    setTouchedCurrent(true);
    setTouchedTfa(true);
    if (!isStep1Valid) return;
    setIsLoading(true);
    try {
      const result = await changeEmail(newEmail, currentPassword, tfaCode);
      if (result && result.requiresVerification) {
        setStep(2);
      } else {
        showSuccess("Email updated successfully.");
        handleClose();
      }
    } catch (e: any) {
      
        const errKey = e.details?.[0]?.message || e.message;
        showError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : (e.message || 'An error occurred'));
    
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerify = async () => {
    setTouchedVerify(true);
    if (!isStep2Valid || !verifyEmailChange) return;
    setIsLoading(true);
    try {
      await verifyEmailChange(newEmail, verifyCode);
      showSuccess(t('emailVerifiedSuccess'));
      handleClose();
    } catch (e: any) {
      const errKey = e.details?.[0]?.message || e.message;
      showError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : (e.message || 'An error occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title={t('changeEmail')} subtitle={step === 1 ? t('updateEmailDesc') : t('verifyNewEmailDesc')} icon={<Mail className="text-[#FF5722]" size={20} />}>
      <div className="grid gap-6 mt-2">
        {step === 1 ? (
          <>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#888] mb-2 font-medium">{t('newEmailAddress')}</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => { setNewEmail(e.target.value); setTouchedEmail(true); }}
                onBlur={() => setTouchedEmail(true)}
                disabled={isLoading}
                className={`w-full h-11 rounded-lg border bg-[#161616] px-4 text-[13px] text-white outline-none focus:border-[#FF5722] transition-colors disabled:opacity-50 ${touchedEmail && !emailValidation.valid ? 'border-red-400/30' : 'border-[#222]'}`}
                placeholder={t('placeholderNewEmail')}
              />
              <ValidationMsg touched={touchedEmail} valid={emailValidation.valid} message={emailValidation.message} />
            </div>
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
            {tfaEnabled && (
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-[11px] uppercase tracking-wider text-[#888] font-medium">{useBackupCode ? t('backupCode') : t('tfaCode')}</label>
                  <button type="button" onClick={() => { setUseBackupCode(!useBackupCode); setTfaCode(''); setTouchedTfa(false); }} className="text-[12px] font-medium text-[#FF5722] hover:text-[#F4511E] transition-colors">
                    {useBackupCode ? t('use2faCode') : t('useBackupCode')}
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={useBackupCode ? 8 : 6}
                  value={tfaCode}
                  onChange={(e) => { setTfaCode(e.target.value.replace(useBackupCode ? /[^0-9a-fA-F]/g : /\D/g, '')); setTouchedTfa(true); }}
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
              <button onClick={handleUpdate} disabled={isLoading || !isStep1Valid} className={`flex h-11 items-center justify-center rounded-lg px-6 text-[13px] font-medium transition-colors gap-2 ${(!isStep1Valid) ? 'bg-[#333] text-[#888] cursor-not-allowed' : 'bg-[#FF5722] hover:bg-[#F4511E] text-white disabled:opacity-50'}`}>
                {isLoading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : t('changeEmail')}
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-sm text-[#888] mb-4 leading-relaxed">
                {t('codeSentTo')} <span className="text-white font-medium">{newEmail}</span>.
              </p>
              <label className="block text-[11px] uppercase tracking-wider text-[#888] mb-2 font-medium">{t('verificationCode')}</label>
              <input
                type="text"
                maxLength={8}
                value={verifyCode}
                onChange={(e) => { setVerifyCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()); setTouchedVerify(true); }}
                onBlur={() => setTouchedVerify(true)}
                disabled={isLoading}
                className={`w-full h-11 rounded-lg border bg-[#161616] px-4 text-[14px] text-white outline-none focus:border-[#FF5722] transition-colors tracking-[0.2em] font-mono text-center disabled:opacity-50 ${touchedVerify && !verifyValidation.valid ? 'border-red-400/30' : 'border-[#222]'}`}
                placeholder={t('placeholderA1B2C3D4')}
              />
              <ValidationMsg touched={touchedVerify} valid={verifyValidation.valid} message={verifyValidation.message} />
            </div>
            
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setStep(1)} disabled={isLoading} className="flex h-11 items-center justify-center rounded-lg border border-[#222] px-6 text-[13px] font-medium text-[#888] hover:bg-[#161616] hover:text-[#D4D4D4] transition-colors disabled:opacity-50 bg-transparent">{t('back')}</button>
              <button onClick={handleVerify} disabled={isLoading || !isStep2Valid} className={`flex h-11 items-center justify-center rounded-lg px-6 text-[13px] font-medium transition-colors gap-2 ${(!isStep2Valid) ? 'bg-[#333] text-[#888] cursor-not-allowed' : 'bg-[#FF5722] hover:bg-[#F4511E] text-white disabled:opacity-50'}`}>
                {isLoading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : t('verifyAndSave')}
              </button>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}

