'use client';

import React from 'react';
import { Package, Download, RotateCcw, Ban, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { StatusIndicator, UserAvatar, RowActionButton } from '@/components/ui';
import type { LedgerItem } from '@/hooks/admin/ledger';

interface AdminLedgerTableRowProps {
  item: LedgerItem;
  onRefund: (id: string) => void;
  onVoid: (id: string) => void;
  onDownloadInvoice: (id: string) => void;
  refunding: string | null;
  voiding: string | null;
  downloading: string | null;
}

export function AdminLedgerTableRow({
  item,
  onRefund,
  onVoid,
  onDownloadInvoice,
  refunding,
  voiding,
  downloading,
}: AdminLedgerTableRowProps) {
  const t = useTranslations('Admin.ledger');
  const tCommon = useTranslations('Common');

  const normStatus = String(item.status || '').toLowerCase();
  let currentStatus = 'unknown';
  let statusLabel = normStatus.toUpperCase();

  if (normStatus === 'completed' || normStatus === 'paid') {
    currentStatus = 'success';
    statusLabel = t('completed');
  } else if (normStatus === 'failed') {
    currentStatus = 'error';
    statusLabel = t('failed');
  } else if (normStatus === 'refunded') {
    currentStatus = 'warning';
    statusLabel = t('refunded');
  } else if (normStatus === 'voided') {
    currentStatus = 'neutral';
    statusLabel = t('voided');
  } else if (normStatus === 'created' || normStatus === 'pending') {
    currentStatus = 'pending';
    statusLabel = t('created');
  }

  const userAvatar =
    item.userId?.profilePicture ||
    item.userId?.oauthProviders?.discord?.avatar ||
    item.userId?.oauthProviders?.google?.picture;

  const planName =
    (typeof item.planId === 'object' && item.planId ? item.planId.name : null) ||
    (typeof item.planId === 'string' ? item.planId : null) ||
    tCommon('unknown');

  const canRefund = item.status === 'COMPLETED' && item.provider === 'paypal';
  const canVoid = item.status === 'CREATED' && item.provider === 'paypal';
  const canInvoice = item.status === 'COMPLETED';

  const cols = 'lg:grid-cols-[1.3fr_1.5fr_1.2fr_100px_100px_110px_90px]';

  return (
    <div className={`group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] ${cols} lg:items-center`}>
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('orderInfo')}
        </p>
        <span className="block truncate text-sm text-[#DDDDDD] font-medium" title={item.id}>
          {item.id}
        </span>
        <span className="block truncate text-[10px] text-[#666] mt-0.5">
          {new Date(item.createdAt).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {tCommon('user')}
        </p>
        {item.userId?.id ? (
          <Link
            href={`/admin/users/${item.userId.id}`}
            className="flex items-center gap-2 group/link w-fit"
          >
            <UserAvatar
              src={userAvatar}
              username={item.userId.username}
              email={item.userId.email}
              size="sm"
              rounded="full"
            />
            <div className="min-w-0">
              <p className="text-xs text-[#D4D4D4] group-hover/link:text-[#FF5722] transition-colors truncate">
                {item.userId.username}
              </p>
              <p className="text-[10px] text-[#555] truncate">
                {item.userId.email}
              </p>
            </div>
          </Link>
        ) : (
          <span className="text-xs text-[#666]">-</span>
        )}
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {tCommon('plan')}
        </p>
        <div className="flex items-center gap-2 text-[#AAAAAA] text-sm">
          <Package size={14} className="text-white/40 shrink-0" />
          <span className="truncate">{planName}</span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('provider')}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-[#AAAAAA]">
          <span className="capitalize">{item.provider || t('system')}</span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('amount')}
        </p>
        <div className="flex items-center gap-1 font-normal text-[#E0E0E0] text-sm">
          <span className="font-semibold text-white/90">
            {Number(item.amount || 0).toFixed(2)}
          </span>
          <span className="text-[10px] text-white/40">
            {item.currency || 'USD'}
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {tCommon('status')}
        </p>
        <div>
          <StatusIndicator status={currentStatus} label={statusLabel} />
        </div>
      </div>

      <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
        <div className="flex lg:justify-end gap-1.5">
          {canInvoice && (
            <RowActionButton
              variant="default"
              onClick={() => onDownloadInvoice(item.id)}
              disabled={downloading === item.id}
              title={t('downloadInvoice')}
            >
              {downloading === item.id ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            </RowActionButton>
          )}
          {canRefund && (
            <RowActionButton
              variant="default"
              onClick={() => onRefund(item.id)}
              disabled={refunding === item.id}
              title={t('refundPayment')}
              className="text-yellow-500/80 hover:text-yellow-500 hover:bg-yellow-500/10"
            >
              {refunding === item.id ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
            </RowActionButton>
          )}
          {canVoid && (
            <RowActionButton
              variant="danger"
              onClick={() => onVoid(item.id)}
              disabled={voiding === item.id}
              title={t('voidCheckout')}
            >
              {voiding === item.id ? <Loader2 size={15} className="animate-spin" /> : <Ban size={15} />}
            </RowActionButton>
          )}
          {!canInvoice && !canRefund && !canVoid && (
            <span className="text-white/20 text-xs">-</span>
          )}
        </div>
      </div>
    </div>
  );
}
