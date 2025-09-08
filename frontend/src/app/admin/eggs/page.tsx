"use client";
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { useRouter } from 'next/navigation';
import EggsHeader from '@/components/admin/eggs/EggsHeader';
import EggList from '@/components/admin/eggs/EggList';
import AdminEggsSkeleton from '@/components/skeletons/admin/eggs/AdminEggsSkeleton';

export default function EggsListPage() {
  const router = useRouter();
  const [eggs, setEggs] = useState<Array<{ _id: string; name: string; description: string; pterodactylEggId: string; pterodactylNestId: string; recommended: boolean; allowedPlans: string[] }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { router.replace('/login'); return; }
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/eggs`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (r) => {
      const d = await r.json();
      if (!r.ok) throw new Error((d && d.error) || 'Failed');
      if (Array.isArray(d)) {
        setEggs(d as Array<{ _id: string; name: string; description: string; pterodactylEggId: string; pterodactylNestId: string; recommended: boolean; allowedPlans: string[] }>);
      } else {
        setEggs([]);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  return (
    <Shell>
      <div className="space-y-8 p-6" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <EggsHeader total={eggs.length} />
        {loading ? (
          <AdminEggsSkeleton />
        ) : (
          <EggList eggs={eggs} />
        )}
      </div>
    </Shell>
  );
}


