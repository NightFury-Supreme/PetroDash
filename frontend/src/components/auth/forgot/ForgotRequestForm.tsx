'use client';
import { useRouter } from '@/i18n/routing';
import AuthSubmit from '@/components/auth/layout/AuthSubmit';
import AuthField from '@/components/auth/layout/AuthField';
import { useTranslations } from 'next-intl';

interface ForgotRequestFormProps {
  email: string;
  setEmail: (e: string) => void;
  onRequest: () => void;
  loading: boolean;
}

export default function ForgotRequestForm({ email, setEmail, onRequest, loading }: ForgotRequestFormProps) {
  const router = useRouter();
  const t = useTranslations();
  const tCommon = useTranslations('Auth.common');
  
  return (
    <div className="space-y-4">
      <AuthField label={tCommon('emailLabel')} value={email} onChange={setEmail} placeholder={tCommon('emailPlaceholder')} />
      <div className="space-y-3 pt-2">
        <AuthSubmit disabled={loading || !email} onClick={onRequest}>
          {loading ? t('submitting') : t('submitRequest')}
        </AuthSubmit>
      </div>
      <div className="mt-6 text-[12px] text-[#888888] text-start">
        {t('rememberedPassword')}<button onClick={() => router.replace('/login')} className="text-[#FF5722] hover:text-[#F4511E] transition-colors font-medium">{t('backToLogin')}</button>
      </div>
    </div>
  );
}
