"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { BookOpen, RefreshCw } from "lucide-react";
import { ErrorState, DashboardButton, ErrorDescription } from "@/components/ui/ErrorState";
import { AdminLedgerSkeleton } from "@/components/skeletons/admin/ledger";
import { AdminLedgerContent, AdminRefundDrawer } from "@/components/admin/ledger";
import { Pagination } from "@/components/Pagination";
import { useModal } from "@/components/Modal";
import { useTranslations } from "next-intl";
import { useAdminLedger } from "@/hooks/admin/ledger";

export default function AdminLedgerTab() {
  const t = useTranslations('Admin.ledger');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');

  const [status, setStatus] = useState<string>("");
  const [provider, setProvider] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [sort, setSort] = useState<string>("-createdAt");
  const [currentPage, setCurrentPage] = useState(1);

  const [refundDrawerOpen, setRefundDrawerOpen] = useState(false);
  const [refundTargetId, setRefundTargetId] = useState<string | null>(null);

  const modal = useModal();
  const { showSuccess, showError } = useToast();

  const {
    items,
    loading,
    error,
    pagination,
    refunding,
    voiding,
    load,
    refundPayment,
    voidPayment,
  } = useAdminLedger();

  const refresh = useCallback((page = currentPage) => {
    load({
      status: status || undefined,
      provider: provider || undefined,
      search: userId || undefined,
      sort,
      page,
      limit: 10,
    });
  }, [load, status, provider, userId, sort, currentPage]);

  useEffect(() => {
    refresh(currentPage);
  }, [refresh, currentPage]);

  const initiateRefund = (id: string) => {
    setRefundTargetId(id);
    setRefundDrawerOpen(true);
  };

  const confirmRefund = async () => {
    if (!refundTargetId) return;
    try {
      await refundPayment(refundTargetId);
      showSuccess(t('success.refunded'));
      setRefundDrawerOpen(false);
      refresh(currentPage);
    } catch (e: any) {
      const errKey = e.message;
      showError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : errKey);
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

    try {
      await voidPayment(id);
      showSuccess(t('success.voided'));
      refresh(currentPage);
    } catch (e: any) {
      const errKey = e.message;
      showError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : errKey);
    }
  };

  if (loading && items.length === 0) {
    return <AdminLedgerSkeleton />;
  }

  if (error && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#161616] border border-[#222] rounded-xl text-center">
        <ErrorState
          icon={<BookOpen className="w-8 h-8 text-white/40" />}
          kicker={tCommon('error')}
          title={t('errors.loadTitle')}
          description={<ErrorDescription error={error} />}
          buttons={
            <>
              <button
                onClick={() => refresh(currentPage)}
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
          refresh(1);
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
  );
}
