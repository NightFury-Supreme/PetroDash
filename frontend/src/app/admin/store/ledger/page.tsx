"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { BookOpen, RefreshCw } from "lucide-react";
import { ErrorState, DashboardButton, ErrorDescription } from "@/components/ui/ErrorState";
import { AdminLedgerSkeleton } from "@/components/skeletons/admin/ledger";
import { AdminLedgerContent } from "@/components/admin/ledger";
import { Pagination } from "@/components/Pagination";
import { useModal } from "@/components/Modal";

// Use a flexible item shape to match API without strict coupling
type LedgerItem = Record<string, any>;

export default function AdminLedgerPage() {
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [status, setStatus] = useState<string>("");
  const [provider, setProvider] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refunding, setRefunding] = useState<string | null>(null);
  const [voiding, setVoiding] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const modal = useModal();
  const { showSuccess, showError } = useToast();

  const load = async (pageToLoad = currentPage) => {
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
      params.set('page', pageToLoad.toString());
      params.set('limit', '10');
      
      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/payments/ledger?${params.toString()}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load payments' }));
        throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      let data: any = {}; try { data = await response.json(); } catch {}
      if (Array.isArray(data)) {
        setItems(data);
        setPagination({ page: 1, totalPages: 1, total: data.length });
      } else {
        setItems(data.payments || []);
        setPagination({
          page: data.page || 1,
          totalPages: data.totalPages || 1,
          total: data.total || 0
        });
      }
    } catch (e: unknown) { 
      setError(e instanceof Error ? e.message : 'Failed to load payments'); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(currentPage); 
  }, [currentPage]);

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

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/payments/${id}/refund`, { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to refund payment' }));
        throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      showSuccess("The payment has been successfully refunded.");
      
      await load(); // Reload the data
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : 'Failed to refund payment');
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

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/payments/${id}/void`, { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to void payment' }));
        throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      showSuccess("The payment has been successfully voided.");
      
      await load(); // Reload the data
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : 'Failed to void payment');
    } finally {
      setVoiding(null);
    }
  };

  if (loading && items.length === 0) {
    return (
      
        <div>
          <AdminLedgerSkeleton />
        </div>
      
    );
  }

  if (error) {
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<BookOpen strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker="Load Error"
          title="Failed to Load Ledger"
          errorString={error}
          description={<ErrorDescription error={error} topic="Ledger" />}
          buttons={
            <>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              >
                <RefreshCw className="w-[14px] h-[14px]" />
                Retry
              </button>
              <DashboardButton variant="secondary" />
            </>
          }
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
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
          onFilter={() => {
            setCurrentPage(1);
            load(1);
          }}
          onRefund={handleRefund}
          onVoid={handleVoid}
        />

        {/* Pagination Controls */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={10}
          onPageChange={setCurrentPage}
          itemName="payments"
        />
      </div>
    </>
  );
}



