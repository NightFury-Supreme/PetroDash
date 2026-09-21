"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { BookOpen, RefreshCw } from "lucide-react";
import { ErrorState, DashboardButton, ErrorDescription } from "@/components/ui/ErrorState";
import { AdminLedgerSkeleton } from "@/components/skeletons/admin/ledger";
import { AdminLedgerContent, AdminRefundDrawer } from "@/components/admin/ledger";
import { Pagination } from "@/components/Pagination";
import { useModal } from "@/components/Modal";
import { useTranslations } from "next-intl";

// Use a flexible item shape to match API without strict coupling
type LedgerItem = Record<string, any>;

export default function AdminLedgerTab() {
  const t = useTranslations('Admin.Ledger');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');
  
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [status, setStatus] = useState<string>("");
  const [provider, setProvider] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [sort, setSort] = useState<string>("-createdAt");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refunding, setRefunding] = useState<string | null>(null);
  const [voiding, setVoiding] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [refundDrawerOpen, setRefundDrawerOpen] = useState(false);
  const [refundTargetId, setRefundTargetId] = useState<string | null>(null);
  
  const modal = useModal();
  const { showSuccess, showError } = useToast();

  const load = async (pageToLoad = currentPage) => {
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError(t('errors.tokenNotFound'));
        return;
      }

      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (provider) params.set('provider', provider);
      if (userId) params.set('search', userId);
      if (sort) params.set('sort', sort);
      params.set('page', pageToLoad.toString());
      params.set('limit', '10');
      
      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/payments/ledger?${params.toString()}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: t('errors.failedToLoad') }));
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
    } catch (e: any) { 
      const errKey = e.message;
      setError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : errKey);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(currentPage); 
  }, [currentPage]);

  const initiateRefund = (id: string) => {
    setRefundTargetId(id);
    setRefundDrawerOpen(true);
  };

  const confirmRefund = async () => {
    if (!refundTargetId) return;
    const id = refundTargetId;
    
    setRefunding(id);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError(t('errors.tokenNotFound'));
        return;
      }

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/payments/${id}/refund`, { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: t('errors.failedToRefund') }));
        throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      showSuccess(t('success.refunded'));
      setRefundDrawerOpen(false);
      await load(); // Reload the data
    } catch (e: any) {
      const errKey = e.message;
      showError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : errKey);
    } finally {
      setRefunding(null);
    }
  };

  const handleVoid = async (id: string) => {
    const confirmed = await modal.confirm({
      title: t('modals.voidTitle'),
      body: t('modals.voidBody'),
      confirmText: t('actions.void'),
      cancelText: tCommon('cancel')
    });
    
    if (!confirmed) return;
    
    setVoiding(id);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError(t('errors.tokenNotFound'));
        return;
      }

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/payments/${id}/void`, { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: t('errors.failedToVoid') }));
        throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      showSuccess(t('success.voided'));
      
      await load(); // Reload the data
    } catch (e: any) {
      const errKey = e.message;
      showError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : errKey);
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
          kicker={tCommon('errors.loadErrorKicker')}
          title={t('errors.failedToLoadTitle')}
          errorString={error}
          description={<ErrorDescription error={error} topic={t('title')} />}
          buttons={
            <>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              >
                <RefreshCw className="w-[14px] h-[14px]" />
                {tCommon('retry')}
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
          sort={sort}
          error={error}
          loading={loading}
          refunding={refunding}
          voiding={voiding}
          onStatusChange={(v) => { setStatus(v); setCurrentPage(1); }}
          onProviderChange={(v) => { setProvider(v); setCurrentPage(1); }}
          onUserIdChange={(v) => { setUserId(v); setCurrentPage(1); }}
          onSortChange={(v) => { setSort(v); setCurrentPage(1); }}
          onFilter={() => {
            setCurrentPage(1);
            load(1);
          }}
          onRefund={initiateRefund}
          onVoid={handleVoid}
        />

        {/* Pagination Controls */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={10}
          onPageChange={setCurrentPage}
          itemName={tCommon('pagination.payments')}
        />
        
        <AdminRefundDrawer
          isOpen={refundDrawerOpen}
          onClose={() => setRefundDrawerOpen(false)}
          onConfirm={confirmRefund}
          payment={items.find((i: any) => i._id === refundTargetId) || null}
          isRefunding={!!refunding}
        />
      </div>
    </>
  );
}



