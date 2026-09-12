"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LocationsHeader from '@/components/admin/locations/LocationsHeader';
import LocationList from '@/components/admin/locations/LocationList';
import AdminLocationsSkeleton from '@/components/skeletons/admin/locations/AdminLocationsSkeleton';

export default function LocationsPageContent() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { router.replace('/login'); return; }
    fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/locations`, { headers: { Authorization: `Bearer ${token}` }})
      .then(async (r) => { let d: any = {}; try { d = await r.json(); } catch {} if (!r.ok) throw new Error(d?.error || 'Failed'); setItems(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="space-y-8 p-6" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      {loading ? (
        <AdminLocationsSkeleton />
      ) : (
        <>
          <LocationsHeader total={items.length} />
          <LocationList 
            locations={items} 
            onEdit={(id) => router.push(`/admin/locations/${id}`)}
            onDelete={async (id) => {
              const token = localStorage.getItem('auth_token');
              await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/locations/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              });
              setItems(items.filter(i => i.id !== id));
            }}
          />
        </>
      )}
    </div>
  );
}


