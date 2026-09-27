import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import React, { useState } from 'react';
import { useToast } from "@/components/ui/ToastProvider";
import { Drawer } from '@/components/ui/Drawer';
import { ValidationMsg } from '../ui/ValidationMsg';
import { ShieldCheck, Check, ArrowRight, Copy
} from "lucide-react";

export function Setup2FADrawer({ isOpen,
  onClose,
  tfaSetupData,
  tfaBackupCodes,
  setTfaBackupCodes,
  verifyAndEnable2FA,
}: {
  isOpen: boolean;
  onClose: () => void;
  tfaSetupData: { secret: string, qrCodeUrl: string } | null;
  tfaBackupCodes: string[] | null;
  setTfaBackupCodes: (codes: string[] | null) => void;
  verifyAndEnable2FA: (code: string) => Promise<void>;
}) {
  const t = useTranslations('Profile');
  const [tfaVerifyCode, setTfaVerifyCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [touchedCode, setTouchedCode] = useState(false);
  const { showError, showSuccess } = useToast();

  const codeValidation = useMemo(() => {
    if (!tfaVerifyCode) return { valid: false, message: t('codeRequired') };
    if (tfaVerifyCode.length !== 6) return { valid: false, message: t('code6Digits') };
    return { valid: true, message: t('code6DigitsEntered') };
  }, [tfaVerifyCode, t]);

  const handleClose = () => {
    onClose();
    setTfaBackupCodes(null);
    setTfaVerifyCode('');
    setTouchedCode(false);
  };

  const handleVerify = async () => {
    setTouchedCode(true);
    if (!codeValidation.valid) return;
    setIsLoading(true);
    try {
      await verifyAndEnable2FA(tfaVerifyCode);
      showSuccess(t('tfaEnabledSuccess'));
    } catch (e: any) {
      showError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCodes = () => {
    if (!tfaBackupCodes) return;
    navigator.clipboard.writeText(tfaBackupCodes.join('\n'));
    setCopied(true);
    showSuccess(t('backupCodesCopied'));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title={t('setup2faTitle')} subtitle={t('setup2faSubtitle')} icon={<ShieldCheck className="text-[#FF5722]" size={20} />}>
      <div className="grid gap-6 mt-2">
        {!tfaBackupCodes ? (
          <>
            {tfaSetupData?.qrCodeUrl && (
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 rounded-lg border border-[#222] bg-[#111] p-5">
                <div className="flex h-[130px] w-[130px] shrink-0 items-center justify-center rounded-lg bg-white p-2">
                  <img src={tfaSetupData.qrCodeUrl} alt="2FA setup QR code" className="h-full w-full object-contain" />
                </div>
                <div className="min-w-0 w-full text-center sm:text-left">
                  <p className="text-[14px] font-semibold text-[#EAEAEA]">{t('scanQrCode')}</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-[#888]">
                    {t('scanQrCodeDesc')}
                  </p>
                  <div className="mt-5 text-left">
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[#888]">{t('cantScan')}</p>
                    <div className="flex items-center rounded-md border border-[#292929] bg-[#151515]">
                      <code className="min-w-0 flex-1 truncate px-3 py-2 text-[12px] tracking-wider text-[#aaa]">
                        {tfaSetupData.secret}
                      </code>
                      <button onClick={() => { 
                        navigator.clipboard.writeText(tfaSetupData.secret); 
                        setCopied(true);
                        showSuccess(t('secretCopied'));
                        setTimeout(() => setCopied(false), 2000);
                      }} className="flex h-9 w-10 shrink-0 items-center justify-center border-l border-[#292929] text-[#666] hover:bg-[#1c1c1c] hover:text-white transition">
                        {copied ? <Check size={14} className="text-[#ff6b1a]" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6">
              <label htmlFor="two-factor-code" className="block text-[11px] uppercase tracking-wider text-[#888] font-medium mb-2">
                {t('verificationCodeLabel')}
              </label>
              <div className="flex gap-3">
                <input
                  id="two-factor-code"
                  value={tfaVerifyCode}
                  onChange={(e) => { setTfaVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setTouchedCode(true); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && codeValidation.valid && !isLoading) handleVerify(); }}
                  disabled={isLoading}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder={t('placeholder123456')}
                  className={`h-11 min-w-0 flex-1 rounded-lg border bg-[#161616] px-4 font-mono text-[16px] tracking-[0.2em] text-center text-white outline-none placeholder:text-[#414141] focus:border-[#FF5722] disabled:opacity-50 transition-colors ${touchedCode && !codeValidation.valid ? 'border-red-400/30' : 'border-[#222]'}`}
                />
                <button
                  onClick={handleVerify}
                  disabled={!codeValidation.valid || isLoading}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#FF5722] hover:bg-[#F4511E] px-4 text-[13px] font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-[#333] disabled:text-[#888]"
                >
                  {isLoading ? t('verifying') : t('verify')}
                  {!isLoading && <ArrowRight size={14} />}
                </button>
              </div>
              <p className="mt-3 text-[12px] text-[#888]">
                {t('enter6DigitCode')}
              </p>
              <ValidationMsg touched={touchedCode} valid={codeValidation.valid} message={codeValidation.message} hideSuccess={true} />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 p-4 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck size={24} />
              <p className="text-[13px] font-medium">{t('tfaEnabledSuccess')}</p>
            </div>
            <p className="text-[13px] leading-relaxed text-[#888]">
              {t('backupCodesWarning')} <strong className="text-white">{t('backupCodesWarning') ? '' : 'only way'}</strong> {t('backupCodesWarning') ? '' : 'to recover your account if you lose access to your authenticator app.'}
            </p>
            <div className="grid grid-cols-2 gap-3 bg-[#161616] p-5 rounded-lg border border-[#222]">
              {tfaBackupCodes.map((code, i) => (
                <code key={i} className="text-[13px] font-mono text-white/90 text-center tracking-wider">{code}</code>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={handleCopyCodes} className={`flex h-11 items-center justify-center rounded-lg border px-6 text-[13px] font-medium transition-colors gap-2 ${copied ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-[#222] text-[#888] hover:bg-[#161616] hover:text-white'}`}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? t('copied') : t('copyCodes')}
              </button>
              <button onClick={handleClose} className="flex h-11 items-center justify-center rounded-lg bg-[#FF5722] px-4 text-[13px] font-medium text-white hover:bg-[#F4511E] transition-colors">{t('savedThem')}</button>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}
