"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';
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

  // All hooks declared unconditionally at the top
  const [form, setForm] = useState<LoginForm>({ emailOrUsername: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [tfaCode, setTfaCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  // Derived values (no hooks, safe to compute anywhere)
  const showEmailLogin = settings?.emailLogin ?? true;
  const showOAuth = (settings?.discord?.enabled || settings?.google?.enabled) ?? false;
  const codeReady = useBackupCode ? tfaCode.length === 8 : tfaCode.length === 6;

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
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json()) as ApiError & { token?: string; requires2FA?: boolean; tempToken?: string };
      if (!res.ok) throw new Error(data?.error || 'Login failed');
      if (data.requires2FA && data.tempToken) {
        setRequires2FA(true);
        setTempToken(data.tempToken);
        return;
      }
      if (!data?.token) throw new Error('Invalid response');
      localStorage.setItem('auth_token', data.token);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const on2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!tfaCode) { setError('Code is required'); return; }
    setLoading(true);
    try {
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/login/2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code: tfaCode }),
      });
      const data = (await res.json()) as ApiError & { token?: string };
      if (!res.ok) throw new Error(data?.error || '2FA failed');
      if (!data?.token) throw new Error('Invalid response');
      localStorage.setItem('auth_token', data.token);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '2FA failed');
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---



  if (requires2FA) {
    return (
      <form onSubmit={on2FASubmit} className="space-y-5 text-center">
        <div className="text-left mb-8">
          <h2 className="text-2xl font-bold mb-1.5 tracking-tight">Two-Factor Authentication</h2>
          <p className="text-[13px] text-[#888888]">
            {useBackupCode
              ? 'Enter one of your 8-character backup codes.'
              : 'Enter the 6-digit code from your authenticator app.'}
          </p>
        </div>

        <div className="text-left">
          <label className="block text-[11px] font-medium text-[#888888] mb-1.5 uppercase tracking-wider">
            {useBackupCode ? 'Backup Code' : 'Authentication Code'}
          </label>
          <input
            type="text"
            value={tfaCode}
            onChange={(e) => {
              const v = e.target.value;
              setTfaCode(useBackupCode ? v.toLowerCase().replace(/[^a-f0-9]/g, '') : v.replace(/\D/g, ''));
              setError(null);
            }}
            maxLength={useBackupCode ? 8 : 6}
            placeholder={useBackupCode ? 'a1b2c3d4' : '123456'}
            className={`w-full h-[42px] rounded-[7px] px-[13px] bg-[#121212] border outline-none text-[#d5d5d5] transition-colors focus:bg-[#151515] font-mono text-center tracking-[0.2em] ${
              useBackupCode ? 'text-[14px]' : 'text-[16px]'
            } ${error ? 'border-red-500/50 focus:border-red-500' : 'border-[#282828] focus:border-[#454545]'}`}
            autoFocus
            autoComplete="one-time-code"
          />
          {tfaCode.length > 0 && (
            <div className={`mt-2 flex items-center gap-1.5 text-[11px] ${codeReady ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
              {codeReady ? <Check size={11} /> : <AlertCircle size={11} />}
              <span>{codeReady
                ? (useBackupCode ? 'Backup code ready.' : '6-digit code ready.')
                : (useBackupCode ? 'Must be exactly 8 characters (a-f, 0-9).' : 'Must be exactly 6 digits.')}
              </span>
            </div>
          )}
          {error && <p className="mt-2 text-[13px] text-red-400 text-left">{error}</p>}
        </div>

        <AuthSubmit disabled={loading || !codeReady}>
          {loading ? 'Verifying.' : 'Verify'}
        </AuthSubmit>

        <div className="flex flex-col items-start gap-2 pt-1">
          <button
            type="button"
            onClick={() => { setUseBackupCode(!useBackupCode); setTfaCode(''); setError(null); }}
            className="text-[12px] text-[#FF5722] hover:text-[#F4511E] transition-colors"
          >
            {useBackupCode ? 'Use authenticator app instead' : 'Use a backup code instead'}
          </button>
          <button
            type="button"
            onClick={() => { setRequires2FA(false); setTempToken(null); setTfaCode(''); setError(null); setUseBackupCode(false); }}
            className="text-[12px] text-[#888888] hover:text-[#FF5722] transition-colors"
          >
            Return to login
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="w-full">
      <div className="text-left mb-8">
        <h2 className="text-2xl font-bold mb-1.5 tracking-tight">Login</h2>
        <p className="text-[13px] text-[#888888]">Enter your credentials to continue</p>
      </div>

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
          <div className="text-right text-[12px] mt-1 mb-4">
            <Link href="/forgot" className="text-[#888888] hover:text-[#FF5722] transition-colors">Forgot password?</Link>
          </div>
          {error && <div className="text-[13px] text-red-400 mb-2">{error}</div>}
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
          <OAuthButtons onError={setError} />
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
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[#FF5722] hover:text-[#F4511E] transition-colors font-medium">Create one</Link>
        </div>
      )}
      </form>
    </div>
  );
}
