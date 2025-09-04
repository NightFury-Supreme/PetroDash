"use client";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Shell from '@/components/Shell';
import EggForm from '@/components/admin/eggs/EggForm';
import AdminEggEditSkeleton from '@/components/skeletons/admin/eggs/AdminEggEditSkeleton';
import NewEggHeader from '@/components/admin/eggs/NewEggHeader';

export default function NewEggPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    category: '',
    iconUrl: '',
    pterodactylEggId: '',
    pterodactylNestId: '',
    recommended: false,
    description: '',
  });
  const [env, setEnv] = useState<Array<{ key: string; value: string; description?: string }>>([]);
  const [, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // brief skeleton to match pattern/SSR
  useEffect(() => {
    const t = setTimeout(() => setInitialLoading(false), 150);
    return () => clearTimeout(t);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/eggs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          pterodactylEggId: Number(form.pterodactylEggId || 0),
          pterodactylNestId: Number(form.pterodactylNestId || 0),
          env: env.filter(v => v.key && v.value),
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data?.error || 'Failed to create egg');
      router.push('/admin/eggs');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Shell>
        <AdminEggEditSkeleton />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="p-6" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <NewEggHeader />
        <EggForm form={form} setForm={setForm} env={env} setEnv={setEnv} onSubmit={submit} submitting={loading} submitLabel="Create" />
      </div>
    </Shell>
  );
}




