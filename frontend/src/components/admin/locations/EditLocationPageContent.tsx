"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import EditLocationHeader from '@/components/admin/locations/EditLocationHeader';
import LocationForm from '@/components/admin/locations/LocationForm';
import AdminLocationEditSkeleton from '@/components/skeletons/admin/locations/AdminLocationEditSkeleton';

export default function EditLocationPageContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { router.replace('/login'); return; }
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/locations/${params.id}`, { headers: { Authorization: `Bearer ${token}` }})
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d?.error || 'Failed');
        setForm({
          id: d._id || d.id,
          name: d.name || '',
          flag: d.flag || '',
          latencyUrl: d.latencyUrl || '',
          serverLimit: String(d.serverLimit ?? '0'),
          platformLocationId: d.platform?.platformLocationId || '',
          swapMb: String(d.platform?.swapMb ?? '-1'),
          blockIoWeight: String(d.platform?.blockIoWeight ?? '500'),
          cpuPinning: d.platform?.cpuPinning || '',
          allowedPlans: Array.isArray(d.allowedPlans) ? d.allowedPlans : [],
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/locations/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: form.name,
        flag: form.flag,
        latencyUrl: form.latencyUrl,
        serverLimit: Number(form.serverLimit || 0),
        platform: {
          platformLocationId: form.platformLocationId,
          swapMb: Number(form.swapMb || -1),
          blockIoWeight: Number(form.blockIoWeight || 500),
          cpuPinning: form.cpuPinning,
        },
        allowedPlans: Array.isArray(form.allowedPlans) ? form.allowedPlans : [],
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data?.error || 'Failed to update'); return; }
    router.push('/admin/locations');
  };

  const del = async () => {
    if (!confirm('Delete this location?')) return;
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/locations/${params.id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) router.push('/admin/locations');
  };

  if (loading || !form) return <AdminLocationEditSkeleton />;

  return (
    <div className="p-6" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <EditLocationHeader />
      <LocationForm form={form} setForm={setForm} onSubmit={save} submitting={false} onDelete={del} />
      {error && <div className="text-sm mt-4" style={{ color: '#ff6b6b' }}>{error}</div>}
    </div>
  );
}


