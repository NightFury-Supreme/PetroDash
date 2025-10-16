"use client";
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import EggForm from '@/components/admin/eggs/EggForm';
import AdminEggEditSkeleton from '@/components/skeletons/admin/eggs/AdminEggEditSkeleton';
import EditEggHeader from '@/components/admin/eggs/EditEggHeader';
import { useParams, useRouter } from 'next/navigation';

type EnvVar = { key: string; value: string };

export default function EditEggPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<{ _id: string; name: string; description: string; pterodactylEggId: string; pterodactylNestId: string; recommended: boolean; allowedPlans: string[]; category?: string; icon?: string } | null>(null);
  const [env, setEnv] = useState<EnvVar[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { router.replace('/login'); return; }
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/eggs/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (r) => {
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Failed');
      setForm({
        _id: d._id || String(params.id),
        name: d.name || '',
        category: d.category || '',
        icon: d.icon || '',
        pterodactylEggId: d.pterodactylEggId?.toString() || '',
        pterodactylNestId: d.pterodactylNestId?.toString() || '',
        recommended: !!d.recommended,
        description: d.description || '',
        allowedPlans: Array.isArray(d.allowedPlans) ? d.allowedPlans : [],
      });
      setEnv(d.env || []);
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [params.id, router]);

  const update = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/eggs/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          pterodactylEggId: Number(form?.pterodactylEggId || 0),
          pterodactylNestId: Number(form?.pterodactylNestId || 0),
          env: env.filter(v => v.key && v.value),
          allowedPlans: Array.isArray(form?.allowedPlans) ? form.allowedPlans : [],
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data?.error || 'Failed to update');
      router.push('/admin/eggs');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const del = async () => {
    if (!confirm('Delete this egg?')) return;
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/eggs/${params.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) router.push('/admin/eggs');
  };

  if (loading || !form) return (
    <Shell>
      <AdminEggEditSkeleton />
    </Shell>
  );

  return (
    <Shell>
      <div className="p-6" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <EditEggHeader />
        <EggForm form={form} setForm={setForm} env={env} setEnv={setEnv} onSubmit={update} submitting={false} onDelete={del} submitLabel="Save" />
      </div>
    </Shell>
  );
}



