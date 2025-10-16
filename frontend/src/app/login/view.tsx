"use client";
import { useState } from 'react';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthField from '@/components/auth/AuthField';
import AuthSubmit from '@/components/auth/AuthSubmit';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { useAuthSettings } from '@/hooks/useAuthSettings';

const schema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof schema>;

type ApiError = { error?: string };

type FieldErrors = Partial<Record<keyof LoginForm, string>>;

export default function LoginClient() {
  const router = useRouter();
  const { settings, loading: settingsLoading } = useAuthSettings();
  const [form, setForm] = useState<LoginForm>({ emailOrUsername: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json()) as ApiError & { token?: string };
      if (!res.ok) throw new Error(data?.error || 'Login failed');
      if (!data?.token) throw new Error('Invalid response');
      localStorage.setItem('auth_token', data.token);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (settingsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-[#202020] rounded animate-pulse"></div>
        <div className="h-12 bg-[#202020] rounded animate-pulse"></div>
        <div className="h-10 bg-[#202020] rounded animate-pulse"></div>
      </div>
    );
  }

  const showEmailLogin = settings?.emailLogin ?? true;
  const showOAuth = (settings?.discord?.enabled || settings?.google?.enabled) ?? false;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {showEmailLogin && (
        <>
          <AuthField
            label="Email or Username"
            value={form.emailOrUsername}
            onChange={(v) => setForm({ ...form, emailOrUsername: v })}
            placeholder="Email or username"
            error={fieldErrors.emailOrUsername}
          />
          <AuthField
            label="Password"
            type="password"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            placeholder="••••••••"
            error={fieldErrors.password}
          />
          <div className="text-right text-sm">
            <Link href="/forgot" className="underline">Forgot password?</Link>
          </div>
          {error && <div className="text-sm" style={{ color: '#ff6b6b' }}>{error}</div>}
          <AuthSubmit disabled={loading}>{loading ? 'Loading…' : 'Login'}</AuthSubmit>
        </>
      )}
      
      {showOAuth && (
        <>
          {showEmailLogin && <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#303030]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 text-[#AAAAAA]">Or continue with</span>
            </div>
          </div>}
          <OAuthButtons onError={setError} />
        </>
      )}
      
      {!showEmailLogin && !showOAuth && (
        <div className="text-center text-[#AAAAAA]">
          <p>No login methods are currently available.</p>
          <p className="text-sm">Please contact an administrator.</p>
        </div>
      )}
      
      {showEmailLogin && (
        <div className="text-sm text-muted">Don't have an account? <Link href="/register" className="underline">Create one</Link></div>
      )}
    </form>
  );
}
