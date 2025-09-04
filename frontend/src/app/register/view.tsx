"use client";
import { useState } from 'react';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthField from '@/components/auth/AuthField';
import AuthSubmit from '@/components/auth/AuthSubmit';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be at most 30 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterForm = z.infer<typeof schema>;

type ApiError = { error?: string };

type FieldErrors = Partial<Record<keyof RegisterForm, string>>;

export default function RegisterClient() {
  const router = useRouter();
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json()) as ApiError & { token?: string };
      if (!res.ok) throw new Error(data?.error || 'Registration failed');
      if (!data?.token) throw new Error('Invalid response');
      localStorage.setItem('auth_token', data.token);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <AuthField label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="john@example.com" error={fieldErrors.email} />
      <AuthField label="Username" value={form.username} onChange={(v) => setForm({ ...form, username: v })} placeholder="john" error={fieldErrors.username} />
      <div className="grid grid-cols-2 gap-3">
        <AuthField label="First name" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} placeholder="John" error={fieldErrors.firstName} />
        <AuthField label="Last name" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} placeholder="Doe" error={fieldErrors.lastName} />
      </div>
      <AuthField label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="••••••••" error={fieldErrors.password} />
      {error && <div className="text-sm" style={{ color: '#ff6b6b' }}>{error}</div>}
      <AuthSubmit disabled={loading}>{loading ? 'Loading…' : 'Create account'}</AuthSubmit>
      <div className="text-sm text-muted">Already have an account? <Link href="/login" className="underline">Sign in</Link></div>
    </form>
  );
}
