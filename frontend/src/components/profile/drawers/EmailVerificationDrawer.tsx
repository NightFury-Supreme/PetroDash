import { useTranslations } from 'next-intl';

import React, { useState } from 'react';
import { useToast } from "@/components/ui/ToastProvider";
import { Drawer } from '@/components/ui/Drawer';
import { Mail
} from "lucide-react";

export function EmailVerificationDrawer({ isOpen,
  onClose,
  email,
  onVerify,
  onResend,
  rateLimit,
  onRateLimitChange,
  onChangeEmail,
}: {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  rateLimit: number;
  onRateLimitChange: (val: number) => void;
  onChangeEmail?: () => void;
}) {
  const t = useTranslations('Profile');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { showError, showSuccess } = useToast();

  const handleVerify = async () => {
    if (code.length !== 8) return;
    setIsLoading(true);
    try {
      await onVerify(code);
      showSuccess(t('verifyEmailTitle') ? (t('verifyEmailTitle') + " successful.") : "Email verified successfully.");
      handleClose();
    } catch (e: any) {
                    showError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setCode('');
  };

  const resendLabel = (() => {
    if (resendLoading) return t('sending');
    if (rateLimit > 0) {
      const mins = Math.floor(rateLimit / 60);
      const secs = rateLimit % 60;
      return `${t('resendIn')} ${mins > 0 ? `${mins}m ` : ''}${secs}s`;
    }
    return t('resendCode');
  })();

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title={t('verifyEmailTitle')} subtitle={t('verifyEmailSubtitle')} icon={<Mail className="text-emerald-500" size={20} />}>
      <div className="grid gap-6 mt-2">
        <div className="flex items-center justify-between bg-[#161616] border border-[#222] rounded-lg p-3">
          <div className="text-[13px] text-left truncate pr-2">
            <span className="text-[#888] block text-[10px] uppercase tracking-wider mb-0.5">{t('emailAddress')}</span>
            <span className="font-medium text-white">{email || t('yourEmail')}</span>
          </div>
          {onChangeEmail && (
            <button type="button" onClick={onChangeEmail} className="shrink-0 px-3 py-1.5 bg-[#222] hover:bg-[#333] border border-[#333] rounded-md text-[11px] font-medium text-[#aaa] hover:text-white transition-colors">
              {t('editEmail')}
            </button>
          )}
        </div>
        <p className="text-[13px] text-[#888] leading-relaxed -mt-3">
          {t('codeSentDesc')}
        </p>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#888] mb-2 font-medium">{t('verificationCode')}</label>
          <input 
            type="text" 
            maxLength={8} 
            value={code} 
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} 
            disabled={isLoading}
            className={`w-full h-11 rounded-lg border bg-[#161616] px-4 text-[14px] text-white outline-none focus:border-[#FF5722] transition-colors tracking-[0.2em] font-mono text-center disabled:opacity-50 border-[#222]`} 
            placeholder={t('placeholder12345678')} 
          />
          <div className="mt-2 flex items-center justify-end">
            <button 
              type="button" 
              onClick={async () => {
                if (resendLoading || rateLimit > 0) return;
                setResendLoading(true);
                try {
                  await onResend();
                  onRateLimitChange(60);
                  showSuccess(t('resendCode') ? (t('resendCode') + " successful.") : "Verification code resent.");
                } catch (e: any) {
                  if (e.retryAfter) onRateLimitChange(e.retryAfter);
                  else {
                    showError((e.message || 'An error occurred'));
                  }
                } finally {
                  setResendLoading(false);
                }
              }}
              disabled={resendLoading || rateLimit > 0}
              className="text-[11px] text-[#FF5722] hover:text-[#F4511E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {resendLabel}
            </button>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={handleClose} disabled={isLoading} className="flex h-11 items-center justify-center rounded-lg border border-[#222] px-6 text-[13px] font-medium text-[#888] hover:bg-[#161616] hover:text-[#D4D4D4] transition-colors disabled:opacity-50 bg-transparent">{t('cancel')}</button>
          <button type="button" onClick={handleVerify} disabled={isLoading || code.length !== 8} className={`flex h-11 items-center justify-center gap-2 rounded-lg px-6 text-[13px] font-medium transition-colors disabled:cursor-not-allowed ${(isLoading || code.length !== 8) ? 'bg-[#333] text-[#888]' : 'bg-[#FF5722] hover:bg-[#F4511E] text-white'}`}>
            {isLoading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : t('verify')}
          </button>
        </div>
      </div>
    </Drawer>
  );
}
