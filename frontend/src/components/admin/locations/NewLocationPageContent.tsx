"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NewLocationHeader from '@/components/admin/locations/NewLocationHeader';
import LocationForm from '@/components/admin/locations/LocationForm';
import AdminLocationEditSkeleton from '@/components/skeletons/admin/locations/AdminLocationEditSkeleton';

export default function NewLocationPageContent() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    flagUrl: '',
    latencyUrl: '',
    serverLimit: '0',
    platformLocationId: '',
    swapMb: '-1',
    blockIoWeight: '500',
    cpuPinning: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name,
          flagUrl: form.flagUrl,
          latencyUrl: form.latencyUrl,
          serverLimit: Number(form.serverLimit || 0),
          platform: {
            platformLocationId: form.platformLocationId,
            swapMb: Number(form.swapMb || -1),
            blockIoWeight: Number(form.blockIoWeight || 500),
            cpuPinning: form.cpuPinning,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create');
      router.push('/admin/locations');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <AdminLocationEditSkeleton />;
  }

  return (
    <div className="p-6" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <NewLocationHeader />
      <LocationForm form={form} setForm={setForm} onSubmit={submit} submitting={loading} />
      {error && <div className="text-sm mt-4" style={{ color: '#ff6b6b' }}>{error}</div>}
    </div>
  );
}


