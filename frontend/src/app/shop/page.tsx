"use client";
import Shell from '@/components/Shell';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useModal } from '@/components/Modal';
import ShopSkeleton from '@/components/skeletons/shop/ShopSkeleton';
import { useShop } from '@/hooks/useShop';
import { ItemCard } from '@/components/shop/ItemCard';
import { PlanCard } from '@/components/shop/PlanCard';
import { PlanPurchaseButton } from '@/components/shop/PlanPurchaseButton';
import { CouponModal } from '@/components/shop/CouponModal';
import { ContentAd, SidebarAd, MobileAd } from '@/components/AdSense';

export default function ShopPage() {
  const router = useRouter();
  const modal = useModal();
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  
  const {
    activeTab, setActiveTab,
    items, plans, error, setError,
    buying, setBuying,
    quantities, setQuantities,
    coins, setCoins, payments, activePlans,
    itemsLoading, plansLoading, bootstrapDone,
    clampQuantity, iconFor
  } = useShop();

  const downloadInvoice = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/payments/${id}/invoice`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.error || 'Failed to download invoice');
      }
      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(String(e?.message || 'Failed to download invoice'));
      await modal.error({ title: 'Download Error', body: String(e?.message || 'Failed to download invoice') });
    }
  };

  // data loading handled by useShop

  const handlePlanPurchase = async (couponCode: string) => {
    if (!selectedPlan) return;
    
    setPurchaseLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Not authenticated');

      if (selectedPlan.redirectionLink) {
        router.push(selectedPlan.redirectionLink);
        return;
      }

      const billingCycle = selectedPlan.lifetime ? 'lifetime' : 'monthly';

      const validationResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/plans/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: selectedPlan._id, couponCode: couponCode.trim() || undefined, billingCycle })
      });
      const validationData = await validationResponse.json();
      if (!validationResponse.ok) throw new Error(validationData?.error || 'Failed to validate purchase');

      const paypalResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: selectedPlan._id, billingCycle, couponCode: couponCode.trim() || undefined })
      });
      const paypalData = await paypalResponse.json();
      if (!paypalResponse.ok) throw new Error(paypalData?.error || 'Failed to create PayPal order');

      if (paypalData.links && paypalData.links.length > 0) {
        const approveLink = paypalData.links.find((link: any) => link.rel === 'approve');
        if (approveLink) {
          router.push(approveLink.href);
          return;
        }
      }
      throw new Error('PayPal redirect link not found');
    } catch (e: any) {
      await modal.error({ title: 'Purchase Error', body: e.message });
    } finally {
      setPurchaseLoading(false);
      setShowCouponModal(false);
      setSelectedPlan(null);
    }
  };

  const buy = async (key: string, quantity: number) => {
    const ok = await modal.confirm({ title: 'Confirm purchase', body: `Buy ${quantity} × ${items.find(i=>i.key===key)?.name || 'item'}?`, confirmText: 'Buy' });
    if (!ok) return;
    setBuying(key); setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/shop/purchase`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ itemKey: key, quantity }) });
      const d = await r.json();
      if (!r.ok) {
        const message = d?.error || 'Purchase failed';
        throw new Error(message);
      }
      // Update coins and refresh user data
      setCoins(d.coins);
      await modal.success({ title: 'Purchased', body: 'Purchased successfully.' });
      
      // Refresh user data to show updated resources
      try {
        const token = localStorage.getItem('auth_token');
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/me`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setCoins(userData.coins);
          // You might want to update other user data here if needed
        }
      } catch (refreshError) {
        console.warn('Failed to refresh user data after purchase:', refreshError);
      }
    } catch (e: any) {
      const msg: string = String(e?.message || 'Purchase failed');
      setError(msg);
      const title = /insufficient|coin/i.test(msg) ? 'Insufficient coins' : 'Error';
      await modal.error({ title, body: msg });
    } finally { setBuying(null); }
  };

  // iconFor and clampQuantity come from useShop

  if (!bootstrapDone) {
    return (
      <Shell>
        <ShopSkeleton />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 icon-gradient rounded-xl flex items-center justify-center shadow-glow">
              <i className="fas fa-store text-white"></i>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">Shop</h1>
              <p className="text-muted">Buy additional resources with your coins</p>
            </div>
          </div>
          <div className="text-sm text-muted flex items-center gap-2">
            <i className="fas fa-coins"></i>
            <span>{typeof coins === 'number' ? `${coins} coins` : ''}</span>
          </div>
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        {/* Tabs */}
        <div className="flex space-x-1" style={{ background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'items' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Shop Items
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'plans' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Plans
          </button>
        </div>

        {activeTab === 'items' && (
          <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((it) => (
                <ItemCard
                  key={it._id || it.key}
                  item={it}
                  quantity={quantities[it.key] || 1}
                  onChangeQuantity={(next) => setQuantities((q) => ({ ...q, [it.key]: next }))}
                  onBuy={() => buy(it.key, quantities[it.key] || 1)}
                  isBuying={buying === it.key}
                  iconFor={iconFor}
                  clampQuantity={clampQuantity}
                />
              ))}
            </div>
            <div className="xl:w-80 xl:flex-shrink-0">
              <div className="sticky top-6">
                <SidebarAd />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Ad for smaller screens */}
        <div className="xl:hidden">
          <MobileAd />
        </div>

        {activeTab === 'plans' && (
          <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <PlanCard key={plan._id} plan={plan}>
                  <PlanPurchaseButton 
                    plan={plan} 
                    onPurchase={() => {
                      setSelectedPlan(plan);
                      setShowCouponModal(true);
                    }}
                    onSuccess={async () => {
                      const token = localStorage.getItem('auth_token');
                      if (token) {
                        try {
                          const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
                          const d = await r.json();
                          if (r.ok) setCoins(Number(d?.coins ?? 0));
                        } catch {}
                      }
                    }} 
                  />
                </PlanCard>
              ))}
            </div>
            <div className="xl:w-80 xl:flex-shrink-0">
              <div className="sticky top-6">
                <SidebarAd />
              </div>
            </div>
          </div>
        )}

        {/* Invoices / Active Plans */}
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-3">Your Active Plans</h2>
          {activePlans.length === 0 ? (
            <div className="text-sm text-muted">No active plans.</div>
          ) : (
            (() => {
              const groups: Record<string, { name: string; label: string; count: number }> = {};
              for (const ap of activePlans) {
                const name: string = ap?.planId?.name || ap?.planId || 'Plan';
                const label: string = ap?.isLifetime ? 'Lifetime' : 'Lifetime';
                const key = `${name}__${label}`;
                if (!groups[key]) groups[key] = { name, label, count: 0 };
                groups[key].count += 1;
              }
              const grouped = Object.values(groups);
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                  {grouped.map((g) => (
                    <div key={`${g.name}-${g.label}`} className="rounded-lg p-4 flex items-center justify-between" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                      <div>
                        <div className="font-semibold">{g.name}</div>
                        <div className="text-xs text-muted">{g.label} ({g.count})</div>
                      </div>
                      <div className="px-2 py-1 text-[11px] rounded-full" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' }}>
                        Active
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}

          <h2 className="text-lg font-bold mb-3">Recent Payments</h2>
          {payments.length === 0 ? (
            <div className="text-sm text-muted">No payments yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#AAAAAA] border-b" style={{ borderColor: 'var(--border)' }}>
                    <th className="py-3 font-medium">Date</th>
                    <th className="py-3 font-medium">Plan</th>
                    <th className="py-3 font-medium">Amount</th>
                    <th className="py-3 font-medium">Status</th>
                    <th className="py-3 font-medium">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const status = String(p.status || '').toLowerCase();
                    const statusClass = status === 'completed' || status === 'paid'
                      ? 'bg-green-900/40 text-green-300 border-green-800'
                      : status === 'pending'
                      ? 'bg-yellow-900/40 text-yellow-300 border-yellow-800'
                      : 'bg-red-900/40 text-red-300 border-red-800';
                    return (
                      <tr key={p.id} className="border-b hover:bg-[#151515] transition-colors" style={{ borderColor: 'var(--border)' }}>
                        <td className="py-3 align-middle">{new Date(p.createdAt).toLocaleString()}</td>
                        <td className="py-3 align-middle">{p.plan?.name || p.planId}</td>
                        <td className="py-3 align-middle">
                          <span className="font-semibold">{p.amount?.toFixed ? p.amount.toFixed(2) : p.amount}</span> <span className="text-[#AAAAAA]">{p.currency || 'USD'}</span>
                        </td>
                        <td className="py-3 align-middle">
                          <span className={`px-2 py-1 text-[11px] rounded-full border ${statusClass}`}>{p.status}</span>
                        </td>
                        <td className="py-3 align-middle">
                          <button className="text-accent underline hover:opacity-80" onClick={() => downloadInvoice(p.id)}>Download</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Coupon Modal */}
      <CouponModal
        isOpen={showCouponModal}
        onClose={() => {
          setShowCouponModal(false);
          setSelectedPlan(null);
        }}
        onConfirm={handlePlanPurchase}
        planName={selectedPlan?.name || ''}
        planPrice={selectedPlan?.pricePerMonth || 0}
        isLifetime={selectedPlan?.lifetime || false}
        redirectionLink={selectedPlan?.redirectionLink}
        loading={purchaseLoading}
      />
    </Shell>
  );
}

// PlanPurchaseButton moved to components/shop/PlanPurchaseButton

