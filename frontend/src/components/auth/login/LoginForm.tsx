'use client';
import { useState } from 'react';
import { z } from 'zod';
import Link from 'next/link';
import AuthField from '@/components/auth/layout/AuthField';
import AuthSubmit from '@/components/auth/layout/AuthSubmit';
import { OAuthButtons } from '@/components/auth/layout/OAuthButtons';
import { useAuthSettings } from '@/hooks/useAuthSettings';
import { useToast } from '@/components/ui/ToastProvider';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

const schema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof schema>;
type FieldErrors = Partial<Record<keyof LoginForm, string>>;

export default function LoginForm({ onSuccess, onRequires2FA }: { onSuccess: (token: string) => void; onRequires2FA: (tempToken: string) => void }) {
  const { settings } = useAuthSettings();
  const { showError } = useToast();
  const [form, setForm] = useState<LoginForm>({ emailOrUsername: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Login failed');
      if (data.requires2FA && data.tempToken) {
        onRequires2FA(data.tempToken);
        return;
      }
      if (!data?.token) throw new Error('Invalid response');
      onSuccess(data.token);
    } catch (err: any) {
      showError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-left mb-8">
        <h2 className="text-2xl font-bold mb-1.5 tracking-tight">Login</h2>
        <p className="text-[13px] text-[#888888]">Enter your credentials to continue</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        {showEmailLogin && (
          <>
            <AuthField label="Email or Username" value={form.emailOrUsername} onChange={(v) => setForm({ ...form, emailOrUsername: v })} placeholder="Email or username" error={fieldErrors.emailOrUsername} />
            <AuthField label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="        " error={fieldErrors.password} />
            <div className="text-right text-[12px] mt-1 mb-4">
              <Link href="/forgot" className="text-[#888888] hover:text-[#FF5722] transition-colors">Forgot password?</Link>
            </div>
            <AuthSubmit disabled={loading}>{loading ? 'Loading.' : 'Login'}</AuthSubmit>
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
                  <span className="px-3 bg-[#0F0F0F] text-[#666]">Or continue with</span>
                </div>
              </div>
            )}
            <OAuthButtons onError={showError} />
          </>
        )}
        {!showEmailLogin && !showOAuth && (
          <div className="text-center text-[#888888] text-[13px]">
            <p>No login methods are currently available.</p>
            <p className="text-[12px] mt-1">Please contact an administrator.</p>
          </div>
        )}
        {showEmailLogin && (
          <div className="text-[12px] text-[#888888] text-left mt-6">
            Don't have an account? <Link href="/register" className="text-[#FF5722] hover:text-[#F4511E] transition-colors font-medium">Create one</Link>
          </div>
        )}
      </form>
    </div>
  );
}
