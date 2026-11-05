'use client';
import { Pencil } from 'lucide-react';
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
  email,
  code,
  setCode,
  codeSent,
  onChangeEmailRequest,
  onVerify,
  onResend,
  loading,
  resendLoading,
  rateLimit,
}: VerifyCodeFormProps) {
  const t = useTranslations('Auth.verify');
  const tAuth = useTranslations('Auth');
  const tCommon = useTranslations('Common');

  const formattedCooldown = `${Math.floor(rateLimit / 60) > 0 ? `${Math.floor(rateLimit / 60)}${tAuth('minutesShort')} ` : ''}${rateLimit % 60}${tAuth('secondsShort')}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-1 text-left">
        <div className="truncate pr-2">
          <span className="text-[#888888] block text-[10px] uppercase tracking-wider mb-0.5 font-medium">{t('lblEmail')}</span>
          <span className="font-medium text-[#d5d5d5] text-[13px]">{email}</span>
        </div>
        <button
          type="button"
          onClick={onChangeEmailRequest}
          aria-label={t('btnEdit')}
          title={t('btnEdit')}
          className="shrink-0 p-1.5 text-[#888888] hover:text-[#FF5722] transition-colors rounded hover:bg-[#1a1a1a] cursor-pointer"
        >
          <Pencil size={14} />
        </button>
      </div>

      {codeSent && (
        <div className="space-y-2 pt-2 text-left">
          <label className="block text-[11px] font-medium text-[#888888] uppercase tracking-wider">{tCommon('codeLabel')}</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder={tAuth('code8Placeholder')}
            maxLength={8}
            className="w-full h-[42px] px-[13px] text-center font-mono tracking-[0.2em] bg-[#121212] border border-[#282828] rounded-[7px] text-[#d5d5d5] placeholder-[#666] focus:outline-none focus:border-[#454545] focus:bg-[#151515] transition-colors"
          />
        </div>
      )}

      <div className="space-y-3 pt-2">
        {codeSent && (
          <AuthSubmit disabled={loading || code.length !== 8} onClick={onVerify}>
            {loading ? tCommon('loading') : t('submitButton')}
          </AuthSubmit>
        )}
        <button
          type="button"
          onClick={onResend}
          disabled={resendLoading || rateLimit > 0}
          className={`w-full h-[42px] font-semibold rounded-[7px] transition-colors flex items-center justify-center gap-2 ${
            codeSent
              ? 'bg-[#222] hover:bg-[#333] text-white disabled:opacity-50 disabled:cursor-not-allowed'
              : 'bg-[#FF5722] hover:bg-[#F4511E] text-white disabled:bg-[#333] disabled:text-[#888] disabled:cursor-not-allowed'
          }`}
        >
          {resendLoading
            ? tCommon('sending')
            : rateLimit > 0
              ? tCommon('resendIn', { time: formattedCooldown })
              : codeSent
                ? t('resendLink')
                : t('sendVerifyBtn')}
        </button>
      </div>

      <div className="mt-6 text-[11px] text-[#888888] text-center">
        {t('helpText')}
      </div>
    </div>
  );
}
