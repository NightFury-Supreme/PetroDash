"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { AdminLedgerSkeleton } from "@/components/skeletons/admin/ledger";
import { AdminLedgerHeader, AdminLedgerContent } from "@/components/admin/ledger";
import { useModal } from "@/components/Modal";

interface Payment {
  _id: string;
  provider: string;
  providerOrderId: string;
  userId: string;
  planId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export default function AdminLedgerPage() {
  const [items, setItems] = useState<Payment[]>([]);
  const [status, setStatus] = useState<string>("");
  const [provider, setProvider] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refunding, setRefunding] = useState<string | null>(null);
  const [voiding, setVoiding] = useState<string | null>(null);
  const modal = useModal();

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (provider) params.set('provider', provider);
      if (userId) params.set('userId', userId);
      
      // Fixed API endpoint - now using the correct path
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/payments/ledger?${params.toString()}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load payments' }));
        throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as Array<{ _id: string; userId: string; username: string; planId: string; planName: string; amount: number; status: string; createdAt: string; updatedAt: string }>;
      setItems(data || []);
    } catch (e: unknown) { 
      setError(e instanceof Error ? e.message : 'Failed to load payments'); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
  }, []);

  const handleRefund = async (id: string) => {
    const confirmed = await modal.confirm({
      title: "Confirm Refund",
      body: "Are you sure you want to refund this payment? This action cannot be undone.",
      confirmText: "Refund Payment",
      cancelText: "Cancel"
    });
    
    if (!confirmed) return;
    
    setRefunding(id);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/payments/${id}/refund`, { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to refund payment' }));
        throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      await modal.success({
        title: "Refund Successful",
        body: "The payment has been successfully refunded."
      });
      
      await load(); // Reload the data
    } catch (e: unknown) {
      await modal.error({
        title: "Refund Failed",
        body: e instanceof Error ? e.message : 'Failed to refund payment'
      });
    } finally {
      setRefunding(null);
    }
  };

  const handleVoid = async (id: string) => {
    const confirmed = await modal.confirm({
      title: "Confirm Void",
      body: "Are you sure you want to void this payment? This action cannot be undone.",
      confirmText: "Void Payment",
      cancelText: "Cancel"
    });
    
    if (!confirmed) return;
    
    setVoiding(id);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/payments/${id}/void`, { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to void payment' }));
        throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      await modal.success({
        title: "Void Successful",
        body: "The payment has been successfully voided."
      });
      
      await load(); // Reload the data
    } catch (e: unknown) {
      await modal.error({
        title: "Void Failed",
        body: e instanceof Error ? e.message : 'Failed to void payment'
      });
    } finally {
      setVoiding(null);
    }
  };

  if (loading && items.length === 0) {
    return (
      <Shell>
        <div className="p-6">
          <AdminLedgerSkeleton />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <AdminLedgerHeader />

        {/* Main Content */}
        <AdminLedgerContent
          items={items}
          status={status}
          provider={provider}
          userId={userId}
          error={error}
          loading={loading}
          refunding={refunding}
          voiding={voiding}
          onStatusChange={setStatus}
          onProviderChange={setProvider}
          onUserIdChange={setUserId}
          onFilter={load}
          onRefund={handleRefund}
          onVoid={handleVoid}
        />
      </div>
    </Shell>
  );
}



