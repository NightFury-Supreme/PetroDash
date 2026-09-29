import { downloadInvoicePdf } from "@/utils/invoiceDownload";
import React, { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { Download, Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { Pagination } from "@/components/Pagination";

interface InvoicesTabProps {
  invoices: any[];
  invoicePage: number;
  invoiceTotalPages: number;
  invoiceTotal: number;
  setInvoicePage: (page: number) => void;
  loading?: boolean;
}

export function InvoicesTab({
  invoices,
  invoicePage,
  invoiceTotalPages,
  invoiceTotal,
  setInvoicePage,
  loading = false,
}: InvoicesTabProps) {
  const { showError } = useToast();
  const t = useTranslations('Profile');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');
  const tAdminUsers = useTranslations('admin.users');
  const locale = useLocale();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadInvoice = async (id: string) => {
    try {
      setDownloadingId(id);
      await downloadInvoicePdf(id, true);
    } catch (e: any) {
      showError(tErrorBackend.has(e.message) ? tErrorBackend(e.message) : (e.message || tCommon('error')));
    } finally {
      setDownloadingId(null);
    }
  };

  const PAYMENTS_PER_PAGE = 10;

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">{t('paymentHistory')}</h3>
            <p className="mt-2 text-sm text-white/35">{t('paymentHistoryDesc')}</p>
          </div>
        </div>

        {/* TABLE HEADER */}
        <div className="hidden gap-4 grid-cols-[1.8fr_1fr_1.5fr_1fr_1fr_70px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
          <span>{t('paymentId')}</span>
          <span>{t('date')}</span>
          <span>{t('plan')}</span>
          <span>{t('amount')}</span>
          <span>{t('status')}</span>
          <span className="text-right">{t('invoice')}</span>
        </div>

        {/* TABLE LIST */}
        <div className="divide-y divide-white/[0.06]">
          {loading ? (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="grid grid-cols-[1.8fr_1fr_1.5fr_1fr_1fr_70px] gap-4 px-5 py-5 items-center">
                  <div>
                    <div className="h-3 w-32 rounded-sm bg-white/[0.04] animate-pulse" />
                  </div>
                  <div>
                    <div className="h-3 w-20 rounded-sm bg-white/[0.04] animate-pulse" />
                  </div>
                  <div>
                    <div className="h-3 w-24 rounded-sm bg-white/[0.04] animate-pulse" />
                  </div>
                  <div>
                    <div className="h-3 w-16 rounded-sm bg-white/[0.04] animate-pulse" />
                  </div>
                  <div>
                    <div className="h-4 w-20 rounded-full bg-white/[0.04] animate-pulse" />
                  </div>
                  <div className="flex justify-end">
                    <div className="h-3 w-10 rounded-sm bg-white/[0.04] animate-pulse" />
                  </div>
                </div>
              ))}
            </>
          ) : !invoices || invoices.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#666]">{t('noPaymentsYet')}</div>
          ) : (
            invoices.map((inv: any, i: number) => {
              const paymentId = inv.id || inv._id;
              const isPaid = inv.status === "COMPLETED" || inv.status === "PAID";
              const planName = inv.plan?.name || inv.planId?.name || (typeof inv.planId === 'string' ? inv.planId : null) || (inv.type === 'ADD_FUNDS' ? tAdminUsers('addedFunds') : inv.description || tAdminUsers('planPurchase'));

              return (
                <div
                  key={paymentId || i}
                  className="group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] md:grid-cols-[1.8fr_1fr_1.5fr_1fr_1fr_70px] md:items-center"
                >
                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">{t('paymentId')}</p>
                    <span className="block truncate font-mono text-xs text-white/35" title={paymentId}>
                      {paymentId}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">{t('date')}</p>
                    <span className="text-xs text-white/35">
                      {new Date(inv.createdAt).toLocaleDateString(locale)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">{t('plan')}</p>
                    <span className="truncate text-xs font-medium text-white/70">
                      {planName}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">{t('amount')}</p>
                    <span className="text-xs font-medium text-white/70">
                      {typeof inv.amount === 'number' ? inv.amount.toFixed(2) : inv.amount}
                      <span className="ml-1 text-white/25">{inv.currency || 'USD'}</span>
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">{t('status')}</p>
                    <PaymentStatus status={inv.status} t={t} />
                  </div>
                  <div className="min-w-0 md:text-right">
                    {isPaid ? (
                      <button
                        type="button"
                        onClick={() => downloadInvoice(paymentId)}
                        disabled={downloadingId === paymentId}
                        className="inline-flex items-center gap-1 text-xs text-[#FF5722] transition-colors hover:text-[#E64D1F] focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 disabled:opacity-50 disabled:cursor-wait"
                      >
                        {downloadingId === paymentId ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                        PDF
                      </button>
                    ) : (
                      <span className="text-xs text-white/25">—</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PAGINATION */}
        <Pagination
          currentPage={invoicePage}
          totalPages={invoiceTotalPages}
          totalItems={invoiceTotal}
          pageSize={PAYMENTS_PER_PAGE}
          onPageChange={setInvoicePage}
          loading={loading}
          itemName={t('payments')}
        />
      </section>
    </div>
  );
}

function PaymentStatus({ status, t }: { status: string; t?: any }) {
  const normStatus = String(status || "").toUpperCase();
  const label = t ? t(`status${normStatus.charAt(0) + normStatus.slice(1).toLowerCase()}`) : normStatus;
  
  let statusKey = 'neutral';
  if (normStatus === "COMPLETED" || normStatus === "PAID") {
    statusKey = 'completed';
  } else if (normStatus === "FAILED") {
    statusKey = 'failed';
  } else if (normStatus === "REFUNDED") {
    statusKey = 'refunded';
  } else if (normStatus === "VOIDED") {
    statusKey = 'voided';
  } else if (normStatus === "CREATED" || normStatus === "PENDING") {
    statusKey = 'pending';
  }

  return <StatusIndicator status={statusKey} label={label} />;
}

