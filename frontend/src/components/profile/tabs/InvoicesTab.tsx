'use client';

import { Download, Loader2 } from "lucide-react";
import React from 'react';
import { useTranslations } from 'next-intl';
import { Pagination } from '@/components/Pagination';
import { PaymentStatus } from '@/components/ui/PaymentStatus';
import { useInvoices, PaymentItem } from '@/hooks/profile';

export function InvoicesTab({ currency = "USD" }: { currency?: string }) {
  const t = useTranslations('Profile');

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">{t('paymentHistory')}</h3>
            <p className="mt-2 text-sm text-white/35">{t('paymentHistoryDesc')}</p>
          </div>
        </div>
        <PaymentsSection currency={currency} />
      </section>
    </div>
  );
}

function PaymentsSection({ currency }: { currency: string }) {
  const t = useTranslations('Profile');
  const PAYMENTS_PER_PAGE = 10;
  const {
    payments,
    page,
    setPage,
    totalPages,
    totalPayments,
    loading,
    downloadingId,
    downloadInvoice,
  } = useInvoices(PAYMENTS_PER_PAGE);

  return (
    <div>
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
        ) : payments.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#666]">{t('noPaymentsYet')}</div>
        ) : (
          payments.map((payment, i) => (
            <PaymentRow
              key={payment.id || i}
              payment={payment}
              currency={currency}
              isDownloading={downloadingId === payment.id}
              onDownload={() => downloadInvoice(payment.id)}
              t={t}
            />
          ))
        )}
      </div>

      {/* PAGINATION */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalPayments}
        pageSize={PAYMENTS_PER_PAGE}
        onPageChange={setPage}
        loading={loading}
        itemName={t('payments')}
      />
    </div>
  );
}

function PaymentRow({
  payment,
  currency,
  isDownloading,
  onDownload,
  t,
}: {
  payment: PaymentItem;
  currency: string;
  isDownloading: boolean;
  onDownload: () => void;
  t: any;
}) {
  const isPaid = payment.status === "COMPLETED" || payment.status === "PAID";

  return (
    <div className="group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] md:grid-cols-[1.8fr_1fr_1.5fr_1fr_1fr_70px] md:items-center">
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">{t('paymentId')}</p>
        <span className="block truncate font-mono text-xs text-white/35">
          {payment.id}
        </span>
      </div>
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">{t('date')}</p>
        <span className="text-xs text-white/35">
          {new Date(payment.createdAt).toLocaleDateString()}
        </span>
      </div>
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">{t('plan')}</p>
        <span className="truncate text-xs font-medium text-white/70">
          {payment.plan?.name || payment.planId}
        </span>
      </div>
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">{t('amount')}</p>
        <span className="text-xs font-medium text-white/70">
          {typeof payment.amount === 'number' ? payment.amount.toFixed(2) : payment.amount}
          <span className="ml-1 text-white/25">{payment.currency || currency}</span>
        </span>
      </div>
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">{t('status')}</p>
        <PaymentStatus status={payment.status} />
      </div>
      <div className="min-w-0 md:text-right">
        {isPaid ? (
          <button
            type="button"
            onClick={onDownload}
            disabled={isDownloading}
            className="inline-flex items-center gap-1 text-xs text-[#FF5722] transition-colors hover:text-[#E64D1F] focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 disabled:opacity-50 disabled:cursor-wait"
          >
            {isDownloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            PDF
          </button>
        ) : (
          <span className="text-xs text-white/25">—</span>
        )}
      </div>
    </div>
  );
}
