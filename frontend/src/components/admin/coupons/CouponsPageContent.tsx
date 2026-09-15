"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CouponsHeader from '@/components/admin/coupons/CouponsHeader';
import CouponsList from '@/components/admin/coupons/CouponsList';
import { AdminCouponsSkeleton } from '@/components/skeletons/admin/coupons/AdminCouponsSkeleton';
import { CouponDrawer } from './CouponDrawer';
import { useToast } from '@/components/ui/ToastProvider';

export default function CouponsPageContent() {
  const { showSuccess, showError } = useToast();
  const router = useRouter();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [currency, setCurrency] = useState('USD');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { router.replace('/login'); return; }
    Promise.all([
      fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/coupons`, { headers: { Authorization: `Bearer ${token}` } }),
      fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/plans`, { headers: { Authorization: `Bearer ${token}` } }),
      fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/branding`)
    ])
      .then(async ([cR, pR, bR]) => {
        if (cR.ok) setCoupons(await cR.json());
        if (pR.ok) setPlans(await pR.json());
        if (bR.ok) {
          let bData: any = {}; try { bData = await bR.json(); } catch {}
          if (bData?.currency) setCurrency(bData.currency);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSaveCoupon = async (id: string | null, data: any) => {
    const token = localStorage.getItem('auth_token');
    setSaving(true);
    try {
      if (data._delete && id) {
        const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/coupons/${id}`, { 
          method: 'DELETE', headers: { Authorization: `Bearer ${token}` } 
        });
        if (res.ok) {
          setCoupons((prev) => prev.filter((c) => c._id !== id));
          setIsDrawerOpen(false);
          showSuccess("Coupon deleted successfully");
        } else {
          showError("Failed to delete coupon");
        }
        return;
      }

      if (id) {
        if (Object.keys(data).length === 1 && data.enabled !== undefined) {
          // just toggle
          const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/coupons/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data)
          });
          if (res.ok) {
            setCoupons((prev) => prev.map((c) => (c._id === id ? { ...c, ...data } : c)));
            showSuccess(`Coupon ${data.enabled ? 'enabled' : 'disabled'} successfully`);
          } else {
            showError("Failed to toggle coupon");
          }
          return; // don't close drawer if just toggling
        }

        const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/coupons/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data)
        });
        if (res.ok) {
          const updated = await res.json();
          setCoupons((prev) => prev.map((c) => (c._id === id ? updated : c)));
          setIsDrawerOpen(false);
          showSuccess("Coupon updated successfully");
        } else {
          showError("Failed to update coupon");
        }
      } else {
        const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/coupons`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data)
        });
        if (res.ok) {
          const created = await res.json();
          setCoupons((prev) => [...prev, created]);
          setIsDrawerOpen(false);
          showSuccess("Coupon created successfully");
        } else {
          showError("Failed to create coupon");
        }
      }
    } catch (err: any) {
      showError(err?.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminCouponsSkeleton />;

  return (
    <div className="space-y-6">
      <CouponsHeader onCreateNew={() => { setEditingCoupon(null); setIsDrawerOpen(true); }} />
      <CouponsList 
        coupons={coupons} 
        plans={plans} 
        onManage={(c: any) => { setEditingCoupon(c); setIsDrawerOpen(true); }} 
        currency={currency} 
      />
      <CouponDrawer 
        item={editingCoupon}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveCoupon}
        saving={saving}
        plans={plans}
        currency={currency}
      />
    </div>
  );
}


