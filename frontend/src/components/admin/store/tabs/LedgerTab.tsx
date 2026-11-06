"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { BookOpen, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { ErrorState, DashboardButton, ErrorDescription } from "@/components/ui/ErrorState";
import { AdminStoreLedgerSkeleton } from "@/components/skeletons/admin/store";
import { AdminLedgerContent, AdminRefundDrawer } from "@/components/admin/ledger";
import { DeleteDrawer } from "@/components/ui/DeleteDrawer";
import { useTranslations } from "next-intl";
import { useAdminLedger } from "@/hooks/admin/ledger";

export default function AdminLedgerTab() {
  const t = useTranslations('Admin.ledger');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');

  const [status, setStatus] = useState<string>("");
  const [provider, setProvider] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [sort, setSort] = useState<string>("-createdAt");
  const [currentPage, setCurrentPage] = useState(1);

  const [refundDrawerOpen, setRefundDrawerOpen] = useState(false);
  const [refundTargetId, setRefundTargetId] = useState<string | null>(null);
  const [voidTargetId, setVoidTargetId] = useState<string | null>(null);

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

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const refresh = useCallback((page = currentPage, query = debouncedSearch) => {
    load({
      status: status || undefined,
      provider: provider || undefined,
      search: query || undefined,
      sort,
      page,
      limit: 10,
    });
  }, [load, status, provider, sort, currentPage, debouncedSearch]);

  useEffect(() => {
    refresh(currentPage, debouncedSearch);
  }, [refresh, currentPage, debouncedSearch, status, provider, sort]);

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
      refresh(currentPage, debouncedSearch);
    } catch (e: unknown) {
      const errKey = e instanceof Error ? e.message : tCommon('error');
      showError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : (errKey || tCommon('error')));
    }
  };

  const handleVoid = (id: string) => {
    setVoidTargetId(id);
  };

  const confirmVoid = async () => {
    if (!voidTargetId) return;
    try {
      await voidPayment(voidTargetId);
      showSuccess(t('success.voided'));
      setVoidTargetId(null);
      refresh(currentPage, debouncedSearch);
    } catch (e: unknown) {
      const errKey = e instanceof Error ? e.message : tCommon('error');
      showError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : (errKey || tCommon('error')));
    }
  };

  if (loading && items.length === 0) {
    return <AdminStoreLedgerSkeleton />;
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
                onClick={() => refresh(currentPage, debouncedSearch)}
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

  const startItem = pagination.total > 0 ? (pagination.page - 1) * 10 + 1 : 0;
  const endItem = Math.min(pagination.page * 10, pagination.total);

  return (
    <div className="space-y-6">
      <AdminLedgerContent
        items={items}
        status={status}
        provider={provider}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sort={sort}
        error={error}
        loading={loading}
        refunding={refunding}
        voiding={voiding}
        onStatusChange={(v) => { setStatus(v); setCurrentPage(1); }}
        onProviderChange={(v) => { setProvider(v); setCurrentPage(1); }}
        onSortChange={(v) => { setSort(v); setCurrentPage(1); }}
        onFilter={() => {
          setCurrentPage(1);
          refresh(1, debouncedSearch);
        }}
        onRefund={initiateRefund}
        onVoid={handleVoid}
      />

      {pagination.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5">
          <p className="text-[11px] text-white/20">
            {tCommon('showing')} {startItem} - {endItem} {tCommon('of')} {pagination.total}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pagination.page === 1 || loading}
              onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={tCommon('previousPage')}
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex items-center px-2">
              <span className="text-xs font-medium text-white/40">
                {pagination.page} <span className="text-white/20 mx-1">/</span> {pagination.totalPages}
              </span>
            </div>
            <button
              type="button"
              disabled={pagination.page === pagination.totalPages || loading}
              onClick={() => setCurrentPage((c) => Math.min(pagination.totalPages, c + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={tCommon('nextPage')}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <AdminRefundDrawer
        isOpen={refundDrawerOpen}
        onClose={() => setRefundDrawerOpen(false)}
        onConfirm={confirmRefund}
        payment={items.find((i) => i.id === refundTargetId) || null}
        isRefunding={!!refunding}
      />

      <DeleteDrawer
        isOpen={Boolean(voidTargetId)}
        onClose={() => setVoidTargetId(null)}
        onConfirm={confirmVoid}
        entityType={t('drawers.voidTitle')}
        entityName={voidTargetId || ''}
        entitySubText={t('drawers.voidBody')}
        requireConfirmText={false}
      />
    </div>
  );
}
