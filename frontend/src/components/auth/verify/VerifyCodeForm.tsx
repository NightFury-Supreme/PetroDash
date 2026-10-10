'use client';
import AuthSubmit from '@/components/auth/layout/AuthSubmit';
import { useTranslations } from 'next-intl';

interface VerifyCodeFormProps {
  email: string;
  code: string;
  setCode: (c: string) => void;
  codeSent: boolean;
  onChangeEmailRequest: () => void;
  onVerify: () => void;
  onResend: () => void;
  loading: boolean;
  resendLoading: boolean;
  rateLimit: number;
}

export default function VerifyCodeForm({
  email, code, setCode, codeSent, onChangeEmailRequest, onVerify, onResend, loading, resendLoading, rateLimit
}: VerifyCodeFormProps) {
  const t = useTranslations();
  const tCommon = useTranslations('Auth.common');
  
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[#888888] mb-6 text-center">
        {codeSent ? t('descSent') : t('descUnsent')}
      </p>
      
      <div className="flex items-center justify-between bg-[#121212] border border-[#282828] rounded-[7px] p-3">
        <div className="text-left truncate pr-2">
          <span className="text-[#888888] block text-[10px] uppercase tracking-wider mb-0.5 font-medium">{t('lblEmail')}</span>
          <span className="font-medium text-[#d5d5d5] text-[13px]">{email}</span>
        </div>
        <button onClick={onChangeEmailRequest} className="shrink-0 px-3 h-[28px] bg-[#222] hover:bg-[#333] border border-[#333] rounded-[5px] text-[11px] font-medium text-[#aaa] hover:text-white transition-colors">
          {t('btnEdit')}
        </button>
      </div>

      {codeSent && (
        <div className="space-y-2 pt-2 text-left">
          <label className="block text-[11px] font-medium text-[#888888] uppercase tracking-wider">{tCommon('codeLabel')}</label>
          <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="00000000" maxLength={8} className="w-full h-[42px] px-[13px] text-center font-mono tracking-[0.2em] bg-[#121212] border border-[#282828] rounded-[7px] text-[#d5d5d5] placeholder-[#666] focus:outline-none focus:border-[#454545] focus:bg-[#151515] transition-colors" />
        </div>
      )}

      <div className="space-y-3 pt-2">
        {codeSent && (
          <AuthSubmit disabled={loading || code.length !== 8} onClick={onVerify}>
            {loading ? t('submittingButton') : t('submitButton')}
          </AuthSubmit>
        )}
        <button onClick={onResend} disabled={resendLoading || rateLimit > 0} className={`w-full h-[42px] font-semibold rounded-[7px] transition-colors flex items-center justify-center gap-2 ${codeSent ? 'bg-[#222] hover:bg-[#333] text-white disabled:opacity-50 disabled:cursor-not-allowed' : 'bg-[#FF5722] hover:bg-[#F4511E] text-white disabled:bg-[#333] disabled:text-[#888] disabled:cursor-not-allowed'}`}>
          {resendLoading ? t('sending') : rateLimit > 0 ? tCommon('resendIn', { time: `${Math.floor(rateLimit / 60) > 0 ? `${Math.floor(rateLimit / 60)}m ` : ''}${rateLimit % 60}s` }) : (codeSent ? t('resendLink') : t('sendVerifyBtn'))}
        </button>
      </div>

      <div className="mt-6 text-[11px] text-[#888888] text-center">
        {t('helpText')}
      </div>
    </div>
  );
}
