'use client';
import AuthSubmit from '@/components/auth/layout/AuthSubmit';
import AuthField from '@/components/auth/layout/AuthField';
import { useTranslations } from 'next-intl';

interface ChangeEmailFormProps {
  newEmail: string;
  setNewEmail: (v: string) => void;
  password?: string;
  setPassword: (v: string) => void;
  tfaCode?: string;
  setTfaCode: (v: string) => void;
  loginMethod: string;
  tfaEnabled: boolean;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
}

export default function ChangeEmailForm({
  newEmail, setNewEmail, password = '', setPassword, tfaCode = '', setTfaCode, loginMethod, tfaEnabled, onSave, onCancel, loading
}: ChangeEmailFormProps) {
  const t = useTranslations();
  const tCommon = useTranslations('Auth.common');

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[#888888] mb-6 text-center">{t('changeEmailSubtitle')}</p>
      
      <div className="space-y-4 text-left">
        <AuthField label={t('newEmailLabel')} type="email" value={newEmail} onChange={setNewEmail} placeholder={t('newEmailPlaceholder')} />
        
        {loginMethod === 'email' && (
          <AuthField label={t('currentPasswordLabel')} type="password" value={password} onChange={setPassword} placeholder="        " />
        )}
        
        {tfaEnabled && (
          <div className="space-y-2">
            <label className="block text-[11px] font-medium text-[#888888] uppercase tracking-wider">{t('tfaCodeLabel')}</label>
            <input type="text" maxLength={6} value={tfaCode} onChange={e => setTfaCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" className="w-full h-[42px] px-[13px] text-center font-mono tracking-[0.2em] bg-[#121212] border border-[#282828] rounded-[7px] text-[#d5d5d5] placeholder-[#666] focus:outline-none focus:border-[#454545] focus:bg-[#151515] transition-colors" />
          </div>
        )}
        
        <div className="space-y-3 mt-6">
          <AuthSubmit disabled={loading} onClick={onSave}>
            {loading ? t('updatingButton') : t('changeEmailButton')}
          </AuthSubmit>
          <button onClick={onCancel} disabled={loading} className="w-full h-[42px] bg-[#222] hover:bg-[#333] disabled:opacity-50 text-white font-semibold rounded-[7px] transition-colors flex items-center justify-center gap-2">
            {t('cancelButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
