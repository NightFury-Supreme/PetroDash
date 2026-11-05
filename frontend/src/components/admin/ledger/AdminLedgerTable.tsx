'use client';

import React, { useState } from 'react';
import { useAdminLedger, type LedgerItem } from '@/hooks/admin/ledger';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/ToastProvider';
import { Receipt } from 'lucide-react';
import { AdminLedgerTableRow } from './AdminLedgerTableRow';

interface AdminLedgerTableProps {
  items: LedgerItem[];
  onRefund: (id: string) => void;
  onVoid: (id: string) => void;
  refunding: string | null;
  voiding: string | null;
}

export function AdminLedgerTable({
  items,
  onRefund,
  onVoid,
  refunding,
  voiding,
}: AdminLedgerTableProps) {
  const t = useTranslations('Admin.ledger');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');
  const { showError } = useToast();
  const { downloadInvoice } = useAdminLedger();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownloadInvoice = async (paymentId: string) => {
    setDownloading(paymentId);
    try {
      await downloadInvoice(paymentId);
    } catch (err: unknown) {
      const errKey = err instanceof Error ? err.message : '';
      showError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : t('failedToDownloadInvoice'));
    } finally {
      setDownloading(null);
    }
  };

  const cols = 'lg:grid-cols-[1.3fr_1.5fr_1.2fr_100px_100px_110px_90px]';

  return (
    <div>
      <div className="w-full">
        <div
          className={`hidden gap-4 lg:grid ${cols} border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30`}
        >
          <span>{t('orderInfo')}</span>
          <span>{tCommon('user')}</span>
          <span>{tCommon('plan')}</span>
          <span>{t('provider')}</span>
          <span>{t('amount')}</span>
          <span>{tCommon('status')}</span>
          <span className="text-right">{tCommon('action')}</span>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="mb-3 h-8 w-8 text-white/20" strokeWidth={1.5} />
              <p className="text-xs text-[#555]">{t('noPaymentsFound')}</p>
            </div>
          ) : (
            items.map((item) => (
              <AdminLedgerTableRow
                key={item.id}
                item={item}
                onRefund={onRefund}
                onVoid={onVoid}
                onDownloadInvoice={handleDownloadInvoice}
                refunding={refunding}
                voiding={voiding}
                downloading={downloading}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminLedgerTable;
