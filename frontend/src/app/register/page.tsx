"use client";
import { useState } from 'react';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const schema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(8),
});

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', username: '', firstName: '', lastName: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError('Please fill in the form correctly.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Registration failed');
      localStorage.setItem('auth_token', data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <section className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl p-8" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 icon-gradient rounded-xl flex items-center justify-center shadow-glow">
              <i className="fas fa-feather-alt"></i>
            </div>
            <h1 className="text-xl font-bold">PteroDash</h1>
          </div>
          <h2 className="text-lg font-semibold mb-1">Create account</h2>
          <p className="text-sm text-muted mb-6">It only takes a minute</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="space-y-1 block">
              <span className="text-sm text-muted">Email</span>
              <input className="w-full rounded-lg p-3" style={{ background: 'transparent', border: '1px solid var(--border)' }} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
            </label>
            <label className="space-y-1 block">
              <span className="text-sm text-muted">Username</span>
              <input className="w-full rounded-lg p-3" style={{ background: 'transparent', border: '1px solid var(--border)' }} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="john" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 block">
                <span className="text-sm text-muted">First name</span>
                <input className="w-full rounded-lg p-3" style={{ background: 'transparent', border: '1px solid var(--border)' }} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="John" />
              </label>
              <label className="space-y-1 block">
                <span className="text-sm text-muted">Last name</span>
                <input className="w-full rounded-lg p-3" style={{ background: 'transparent', border: '1px solid var(--border)' }} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Doe" />
              </label>
            </div>
            <label className="space-y-1 block">
              <span className="text-sm text-muted">Password</span>
              <input className="w-full rounded-lg p-3" style={{ background: 'transparent', border: '1px solid var(--border)' }} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </label>
            {error && <div className="text-sm" style={{ color: '#ff6b6b' }}>{error}</div>}
            <button className="w-full btn-gradient" disabled={loading} type="submit">{loading ? 'Loading…' : 'Create account'}</button>
            <div className="text-sm text-muted">Already have an account? <Link href="/login" className="underline">Sign in</Link></div>
          </form>
        </div>
      </section>
    </main>
  );
}


