'use client';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import AuthField from '@/components/auth/layout/AuthField';
import AuthSubmit from '@/components/auth/layout/AuthSubmit';
import { useToast } from '@/components/ui/ToastProvider';
import { useTwoFactor } from '@/hooks/auth';
import { useTranslations } from 'next-intl';

export default function TwoFactorForm({ tempToken, onSuccess, onBack }: { tempToken: string; onSuccess: (token: string) => void; onBack: () => void }) {
  const [code, setCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const { showError } = useToast();
  const { verify2FA, loading } = useTwoFactor({ onSuccess });
  const t = useTranslations('Auth.twoFactor');
  const tCommon = useTranslations('Common');
  const tErrors = useTranslations('Auth.errors');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      showError(tErrors('missingFields'));
      return;
    }
    
    if (useBackup) {
      if (code.length !== 8) {
        showError(t('errBackupLength'));
        return;
      }
    } else {
      if (!/^\d{6}$/.test(code)) {
        showError(t('errAuthLength'));
        return;
      }
    }

    await verify2FA(tempToken, code);
  };

  const isSubmitDisabled = loading || (useBackup ? code.length !== 8 : !/^\d{6}$/.test(code));

  return (
    <div className="w-full relative">
      <button onClick={onBack} className="text-[#888888] hover:text-[#fff] transition-colors flex items-center gap-1.5 text-[13px] font-medium mb-6">
        <ArrowLeft size={14} className="rtl:rotate-180" /> {tCommon('back')}
      </button>
      <div className="text-left mb-8">
        <h2 className="text-2xl font-bold mb-1.5 tracking-tight">
          {useBackup ? t('backupTitle') : t('title')}
        </h2>
        <p className="text-[13px] text-[#888888]">
          {useBackup ? t('backupSubtitle') : t('subtitle')}
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField 
          label={useBackup ? t('backupCodeLabel') : tCommon('codeLabel')} 
          type="text" 
          value={code} 
          onChange={(v) => {
            if (useBackup) {
              setCode(v.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8));
            } else {
              setCode(v.replace(/[^\d]/g, '').slice(0, 6));
            }
          }} 
          placeholder={useBackup ? t('backupCodePlaceholder') : t('codePlaceholder')} 
        />
        <AuthSubmit disabled={isSubmitDisabled}>
          {loading ? tCommon('loading') : t('submitButton')}
        </AuthSubmit>
        
        <div className="text-start mt-6">
          <button 
            type="button" 
            onClick={() => {
              setUseBackup(!useBackup);
              setCode('');
            }} 
            className="text-[13px] text-[#FF5722] hover:text-[#F4511E] transition-colors font-medium"
          >
            {useBackup ? t('useAuthApp') : t('useBackupCode')}
          </button>
        </div>
      </form>
    </div>
  );
}
