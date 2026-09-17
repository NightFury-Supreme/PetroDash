'use client';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import AuthField from '@/components/auth/layout/AuthField';
import AuthSubmit from '@/components/auth/layout/AuthSubmit';
import { useToast } from '@/components/ui/ToastProvider';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useTranslations } from 'next-intl';

export default function TwoFactorForm({ tempToken, onSuccess, onBack }: { tempToken: string; onSuccess: (token: string) => void; onBack: () => void }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { showError } = useToast();
  const t = useTranslations('Auth.twoFactor');
  const tErrors = useTranslations('Auth.errors');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      showError(tErrors('missingFields'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || tErrors('verifyFailed'));
      if (!data?.token) throw new Error('Invalid response');
      onSuccess(data.token);
    } catch (err: any) {
      showError(err.message || tErrors('verifyFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full relative">
      <button onClick={onBack} className="absolute -top-12 left-0 text-[#888888] hover:text-[#fff] transition-colors flex items-center gap-1.5 text-[13px] font-medium">
        <ArrowLeft size={14} /> Back
      </button>
      <div className="text-left mb-8">
        <h2 className="text-2xl font-bold mb-1.5 tracking-tight">{t('title')}</h2>
        <p className="text-[13px] text-[#888888]">{t('subtitle')}</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField label={t('codeLabel')} type="text" value={code} onChange={setCode} placeholder={t('codePlaceholder')} />
        <AuthSubmit disabled={loading || code.length < 6}>{loading ? t('submittingButton') : t('submitButton')}</AuthSubmit>
      </form>
    </div>
  );
}
