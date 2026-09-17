'use client';
import { useState } from 'react';
import { z } from 'zod';
import { useRouter, useSearchParams } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import AuthField from '@/components/auth/layout/AuthField';
import AuthSubmit from '@/components/auth/layout/AuthSubmit';
import { OAuthButtons } from '@/components/auth/layout/OAuthButtons';
import { useAuthSettings } from '@/hooks/useAuthSettings';
import { useToast } from '@/components/ui/ToastProvider';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useTranslations } from 'next-intl';

export default function RegisterForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { settings } = useAuthSettings();
  const { showError } = useToast();
  const [form, setForm] = useState({ email: '', username: '', firstName: '', lastName: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [loading, setLoading] = useState(false);

  const t = useTranslations();
  const tCommon = useTranslations('Auth.common');
  const tErrors = useTranslations('Auth.errors');

  const strongPassword = z
    .string()
    .min(8, tErrors('passwordShort'))
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/, tErrors('passwordWeak'));

  const schema = z.object({
    email: z.string().email(tErrors('emailInvalid')),
    username: z.string().min(3, tErrors('usernameShort')).max(30, tErrors('usernameLong')),
    firstName: z.string().min(1, tErrors('firstNameRequired')),
    lastName: z.string().min(1, tErrors('lastNameRequired')),
    password: strongPassword,
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Partial<Record<keyof typeof form, string>> = {};
      parsed.error.issues.forEach((i) => {
        const k = i.path[0] as keyof typeof form;
        if (!errs[k]) errs[k] = i.message;
      });
      setFieldErrors(errs);
      return;
    }
    setLoading(true);
    try {
      const ref = search?.get('ref') || undefined;
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsed.data, ...(ref ? { ref } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        const serverFieldErrors = data?.details?.fieldErrors || {};
        const errs: Partial<Record<keyof typeof form, string>> = {};
        Object.entries(serverFieldErrors).forEach(([k, v]) => {
          if (Array.isArray(v) && v.length > 0) errs[k as keyof typeof form] = v[0] as string;
        });
        if (Object.keys(errs).length > 0) setFieldErrors(errs);
        throw new Error(data?.error || tErrors('registerFailed'));
      }
      if (!data?.token) throw new Error('Invalid response');
      localStorage.setItem('auth_token', data.token);
      router.push('/dashboard');
    } catch (err: any) {
      showError(err.message || tErrors('registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  const showEmailRegister = settings?.emailLogin ?? true;
  const showOAuth = (settings?.discord?.enabled || settings?.google?.enabled) ?? false;

  return (
    <div className="w-full">
      <div className="text-left mb-8">
        <h2 className="text-2xl font-bold mb-1.5 tracking-tight">{t('title')}</h2>
        <p className="text-[13px] text-[#888888]">{t('subtitle')}</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        {showEmailRegister && (
          <>
            <AuthField label={tCommon('emailLabel')} value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder={tCommon('emailPlaceholder')} error={fieldErrors.email} />
            <AuthField label={t('usernameLabel')} value={form.username} onChange={(v) => setForm({ ...form, username: v })} placeholder={t('usernamePlaceholder')} error={fieldErrors.username} />
            <div className="grid grid-cols-2 gap-3">
              <AuthField label={t('firstNameLabel')} value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} placeholder={t('firstNamePlaceholder')} error={fieldErrors.firstName} />
              <AuthField label={t('lastNameLabel')} value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} placeholder={t('lastNamePlaceholder')} error={fieldErrors.lastName} />
            </div>
            <AuthField label={tCommon('passwordLabel')} type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder={tCommon('passwordPlaceholder')} error={fieldErrors.password} />
            <AuthSubmit disabled={loading}>{loading ? t('submittingButton') : t('submitButton')}</AuthSubmit>
          </>
        )}
        {showOAuth && (
          <>
            {showEmailRegister && (
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#222]"></div>
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold">
                  <span className="px-3 bg-[#0F0F0F] text-[#666]">{tCommon('orContinueWith')}</span>
                </div>
              </div>
            )}
            <OAuthButtons onError={showError} />
          </>
        )}
        {!showEmailRegister && !showOAuth && (
          <div className="text-center text-[#888888] text-[13px]">
            <p>{t('noMethods')}</p>
            <p className="text-[12px] mt-1">{tCommon('contactAdmin')}</p>
          </div>
        )}
        {showEmailRegister && (
          <div className="text-[12px] text-[#888888] text-left mt-6">
            {t('hasAccount')} <Link href="/login" className="text-[#FF5722] hover:text-[#F4511E] transition-colors font-medium">{t('loginLink')}</Link>
          </div>
        )}
      </form>
    </div>
  );
}
