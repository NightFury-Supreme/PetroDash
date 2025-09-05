"use client";
import { useState } from 'react';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthField from '@/components/auth/AuthField';
import AuthSubmit from '@/components/auth/AuthSubmit';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { useAuthSettings } from '@/hooks/useAuthSettings';

const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/, 'Password must include upper, lower, and a number');

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: strongPassword,
});

type RegisterForm = z.infer<typeof schema>;

type ApiError = { error?: string };

type FieldErrors = Partial<Record<keyof RegisterForm, string>>;

export default function RegisterClient() {
  const router = useRouter();
  const search = useSearchParams();
  const { settings, loading: settingsLoading } = useAuthSettings();
  const [form, setForm] = useState<RegisterForm>({ email: '', username: '', firstName: '', lastName: '', password: '' });
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
        const k = i.path[0] as keyof RegisterForm;
        if (!errs[k]) errs[k] = i.message;
      });
      setFieldErrors(errs);
      return;
    }
    setLoading(true);
    try {
      const ref = search?.get('ref') || undefined;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...parsed.data, ...(ref ? { ref } : {}) }),
      });
      const data = (await res.json()) as ApiError & { token?: string; details?: { fieldErrors?: Record<string, string[]> } };
      if (!res.ok) {
        // Try to surface server-side field errors
        const serverFieldErrors = data?.details?.fieldErrors || {};
        const errs: FieldErrors = {};
        Object.entries(serverFieldErrors).forEach(([k, v]) => {
          if (Array.isArray(v) && v.length > 0) errs[k as keyof RegisterForm] = v[0] as string;
        });
        if (Object.keys(errs).length > 0) setFieldErrors(errs);
        throw new Error(data?.error || 'Registration failed');
      }
      if (!data?.token) throw new Error('Invalid response');
      localStorage.setItem('auth_token', data.token);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (settingsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-[#202020] rounded animate-pulse"></div>
        <div className="h-12 bg-[#202020] rounded animate-pulse"></div>
        <div className="h-12 bg-[#202020] rounded animate-pulse"></div>
        <div className="h-12 bg-[#202020] rounded animate-pulse"></div>
        <div className="h-10 bg-[#202020] rounded animate-pulse"></div>
      </div>
    );
  }

  const showEmailRegister = settings?.emailLogin ?? true;
  const showOAuth = (settings?.discord?.enabled || settings?.google?.enabled) ?? false;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {showEmailRegister && (
        <>
          <AuthField label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="john@example.com" error={fieldErrors.email} />
          <AuthField label="Username" value={form.username} onChange={(v) => setForm({ ...form, username: v })} placeholder="john" error={fieldErrors.username} />
          <div className="grid grid-cols-2 gap-3">
            <AuthField label="First name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} placeholder="John" error={fieldErrors.firstName} />
            <AuthField label="Last name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} placeholder="Doe" error={fieldErrors.lastName} />
          </div>
          <AuthField label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="••••••••" error={fieldErrors.password} />
          {error && <div className="text-sm" style={{ color: '#ff6b6b' }}>{error}</div>}
          <AuthSubmit disabled={loading}>{loading ? 'Loading…' : 'Create account'}</AuthSubmit>
        </>
      )}
      
      {showOAuth && (
        <>
          {showEmailRegister && <div className="relative">
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
      
      {!showEmailRegister && !showOAuth && (
        <div className="text-center text-[#AAAAAA]">
          <p>No registration methods are currently available.</p>
          <p className="text-sm">Please contact an administrator.</p>
        </div>
      )}
      
      {showEmailRegister && (
        <div className="text-sm text-muted">Already have an account? <Link href="/login" className="underline">Sign in</Link></div>
      )}
    </form>
  );
}
