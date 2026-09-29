import { downloadInvoicePdf } from "@/utils/invoiceDownload";
import React from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { Download } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { useCurrency } from "@/hooks/useCurrency";
import { Pagination } from "@/components/Pagination";

interface InvoicesTabProps {
  invoices: any[];
  invoicePage: number;
  invoiceTotalPages: number;
  invoiceTotal: number;
  setInvoicePage: (page: number) => void;
}

export function InvoicesTab({
  invoices,
  invoicePage,
  invoiceTotalPages,
  invoiceTotal,
  setInvoicePage,
}: InvoicesTabProps) {
  const { showError } = useToast();
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');
  const { formatPrice } = useCurrency();
  const locale = useLocale();

  const downloadInvoice = async (id: string) => {
    try {
      await downloadInvoicePdf(id, false);
    } catch (e: any) {
      showError(tErrorBackend.has(e.message) ? tErrorBackend(e.message) : (e.message || tCommon('error')));
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">{t('invoices')}</h3>
            <p className="mt-2 text-sm text-white/35">{t('invoicesDesc')}</p>
          </div>
        </div>

        {(!invoices || invoices.length === 0) ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
            <p className="text-sm text-white/50">{t('noInvoicesFound')}</p>
          </div>
        ) : (
          <>
            <div className="hidden gap-4 grid-cols-[100px_1fr_100px_120px_100px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
              <span>{t('date')}</span>
              <span>{t('descriptionCol')}</span>
              <span>{t('amount')}</span>
              <span>{t('status')}</span>
              <span className="text-right">{t('action')}</span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {invoices.map((inv: any) => (
                <div
                  key={inv._id}
                  className="grid grid-cols-1 gap-4 px-5 py-4 items-center md:grid-cols-[100px_1fr_100px_120px_100px] transition hover:bg-white/[0.02]"
                >
                  <p className="text-xs text-[#888]">{new Date(inv.createdAt).toLocaleDateString(locale)}</p>
                  <p className="text-sm text-[#D4D4D4]">
                    {inv.type === 'ADD_FUNDS' ? t('addedFunds') : t('planPurchase')}
                  </p>
                  <p className="text-sm font-medium text-white">{formatPrice(inv.amount || 0)}</p>
                  <div>
                    <StatusIndicator status="success" label={t('paid')} />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => downloadInvoice(inv._id)}
                      className="flex items-center gap-1.5 text-xs text-[#FF5722] hover:text-[#F4511E]"
                    >
                      <Download size={14} /> {t('pdf')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Pagination
          currentPage={invoicePage}
          totalPages={invoiceTotalPages}
          totalItems={invoiceTotal}
          pageSize={5}
          onPageChange={setInvoicePage}
          itemName="invoices"
        />
      </section>
    </div>
  );
}
