"use client";
import { useState } from 'react';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthField from '@/components/auth/AuthField';
import AuthSubmit from '@/components/auth/AuthSubmit';

const schema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof schema>;

type ApiError = { error?: string };

type FieldErrors = Partial<Record<keyof LoginForm, string>>;

export default function LoginClient() {
  const router = useRouter();
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

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AuthField
        label="Email or Username"
        value={form.emailOrUsername}
        onChange={(v) => setForm({ ...form, emailOrUsername: v })}
        placeholder="john@example.com or john"
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
      {error && <div className="text-sm" style={{ color: '#ff6b6b' }}>{error}</div>}
      <AuthSubmit disabled={loading}>{loading ? 'Loading…' : 'Login'}</AuthSubmit>
      <div className="text-sm text-muted">Don’t have an account? <Link href="/register" className="underline">Create one</Link></div>
    </form>
  );
}
