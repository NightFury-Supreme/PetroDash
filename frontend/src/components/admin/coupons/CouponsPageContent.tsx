"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CouponsHeader from '@/components/admin/coupons/CouponsHeader';
import CouponsList from '@/components/admin/coupons/CouponsList';
import { AdminCouponsSkeleton } from '@/components/skeletons/admin/coupons/AdminCouponsSkeleton';

export default function CouponsPageContent() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { router.replace('/login'); return; }
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/coupons`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/plans`, { headers: { Authorization: `Bearer ${token}` } })
    ])
      .then(async ([cR, pR]) => {
        if (cR.ok) setCoupons(await cR.json());
        if (pR.ok) setPlans(await pR.json());
      })
      .finally(() => setLoading(false));
  }, [router]);

  const toggleEnabled = async (id: string, enabled: boolean) => {
    const token = localStorage.getItem('auth_token');
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/coupons/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ enabled })
    });
    setCoupons((prev) => prev.map((c) => (c._id === id ? { ...c, enabled } : c)));
  };

  const deleteCoupon = async (id: string) => {
    const token = localStorage.getItem('auth_token');
    setDeleting(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/coupons/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCoupons((prev) => prev.filter((c) => c._id !== id));
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <AdminCouponsSkeleton />;

  return (
    <div className="p-6 space-y-6">
      <CouponsHeader total={coupons.length} />
      <CouponsList coupons={coupons} plans={plans} onToggle={toggleEnabled} onDelete={deleteCoupon} deletingId={deleting} />
    </div>
  );
}


