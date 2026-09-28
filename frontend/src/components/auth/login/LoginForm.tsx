'use client';
import { useState } from 'react';
import { z } from 'zod';
import { Link, useSearchParams } from '@/i18n/routing';
import AuthField from '@/components/auth/layout/AuthField';
import AuthSubmit from '@/components/auth/layout/AuthSubmit';
import { OAuthButtons } from '@/components/auth/layout/OAuthButtons';
import { useAuthSettings } from '@/hooks/useAuthSettings';
import { useToast } from '@/components/ui/ToastProvider';
import { useLogin } from '@/hooks/auth';
import { useTranslations } from 'next-intl';

const schema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof schema>;
type FieldErrors = Partial<Record<keyof LoginForm, string>>;

export default function LoginForm({ onSuccess, onRequires2FA }: { onSuccess: (token: string) => void; onRequires2FA: (tempToken: string) => void }) {
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || null;
  const { settings } = useAuthSettings();
  const { showError } = useToast();
  const { login, loading } = useLogin({ onSuccess, onRequires2FA });
  const t = useTranslations('Auth.login');
  const tCommon = useTranslations('Common');
  const [form, setForm] = useState<LoginForm>({ emailOrUsername: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const showEmailLogin = settings?.emailLogin ?? true;
  const showOAuth = (settings?.discord?.enabled || settings?.google?.enabled) ?? false;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: FieldErrors = {};
      parsed.error.issues.forEach((i) => {
        const k = i.path[0] as keyof LoginForm;
        if (!errs[k]) errs[k] = i.message;
      });
      setFieldErrors(errs);
      return;
    }
    await login(parsed.data);
  };

  return (
    <div className="w-full">
      <div className="text-left mb-8">
        <h2 className="text-2xl font-bold mb-1.5 tracking-tight">{t('title')}</h2>
        <p className="text-[13px] text-[#888888]">{t('subtitle')}</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        {showEmailLogin && (
          <>
            <AuthField label={tCommon('email')} value={form.emailOrUsername} onChange={(v) => setForm({ ...form, emailOrUsername: v })} placeholder={tCommon('emailPlaceholder')} error={fieldErrors.emailOrUsername} />
            <AuthField label={tCommon('password')} type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder={tCommon('passwordPlaceholder')} error={fieldErrors.password} />
            <div className="text-right text-[12px] mt-1 mb-4">
              <Link href="/forgot" className="text-[#888888] hover:text-[#FF5722] transition-colors">{t('forgotPassword')}</Link>
            </div>
            <AuthSubmit disabled={loading}>{loading ? tCommon('loading') : t('submitButton')}</AuthSubmit>
          </>
        )}
        {showOAuth && (
          <>
            {showEmailLogin && (
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#222]" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold">
                  <span className="px-3 bg-[#0F0F0F] text-[#666]">{tCommon('orContinueWith')}</span>
                </div>
              </div>
            )}
            <OAuthButtons onError={showError} />
          </>
        )}
        {!showEmailLogin && !showOAuth && (
          <div className="text-center text-[#888888] text-[13px]">
            <p>{t('noMethods')}</p>
            <p className="text-[12px] mt-1">{tCommon('contactAdmin')}</p>
          </div>
        )}
        {showEmailLogin && (
          <div className="text-[12px] text-[#888888] text-left mt-6">
            {t('noAccount')} <Link href={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : '/register'} className="text-[#FF5722] hover:text-[#F4511E] transition-colors font-medium">{t('registerLink')}</Link>
          </div>
        )}
      </form>
    </div>
  );
}
