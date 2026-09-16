import React, { useState } from 'react';
import { fetchWithRetry } from "@/utils/fetchWithRetry";



interface AdminLedgerTableProps {
  items: any[];
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
  voiding
}: AdminLedgerTableProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  
  const getStatusBadge = (status: string) => {
    const normStatus = String(status || "").toUpperCase();
    
    let styles = "border-gray-500/20 bg-gray-500/[0.04] text-gray-400";
    
    if (normStatus === "COMPLETED" || normStatus === "PAID") {
      styles = "border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-500";
    } else if (normStatus === "FAILED") {
      styles = "border-red-500/20 bg-red-500/[0.04] text-red-500";
    } else if (normStatus === "REFUNDED") {
      styles = "border-yellow-500/20 bg-yellow-500/[0.04] text-yellow-500";
    } else if (normStatus === "VOIDED") {
      styles = "border-gray-500/20 bg-gray-500/[0.04] text-gray-500";
    } else if (normStatus === "CREATED" || normStatus === "PENDING") {
      styles = "border-blue-500/20 bg-blue-500/[0.04] text-blue-500";
    }

    return (
      <span className={`inline-flex w-fit rounded border px-2 py-1 text-xs font-medium uppercase ${styles}`}>
        {normStatus}
      </span>
    );
  };

  const getActionMenu = (item: any) => {
    const canRefund = item.status === 'COMPLETED' && item.provider === 'paypal';
    const canVoid = item.status === 'CREATED' && item.provider === 'paypal';
    const canInvoice = item.status === 'COMPLETED';

    const handleDownloadInvoice = async (paymentId: string) => {
      setDownloading(paymentId);
      try {
        const token = localStorage.getItem('auth_token');
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE || '';
        const res = await fetchWithRetry(`${baseUrl}/api/admin/payments/${paymentId}/invoice`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to download invoice');
        
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${paymentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } catch (err) {
        console.error(err);
        alert('Failed to download invoice');
      } finally {
        setDownloading(null);
      }
    };

    if (!canRefund && !canVoid && !canInvoice) {
      return <span className="text-white/20 text-xs">-</span>;
    }

    return (
      <div className="flex items-center gap-1 justify-end">
        {canInvoice && (
          <button
            onClick={() => handleDownloadInvoice(item._id)}
            disabled={downloading === item._id}
            title="Download Invoice"
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent hover:bg-white/[0.08] text-[#AAAAAA] hover:text-white transition-colors disabled:opacity-50"
          >
            {downloading === item._id ? <i className="fas fa-spinner fa-spin text-[13px]"></i> : <i className="fas fa-download text-[13px]"></i>}
          </button>
        )}
        {canRefund && (
          <button
            onClick={() => onRefund(item._id)}
            disabled={refunding === item._id}
            title="Refund Payment"
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent hover:bg-yellow-500/10 text-yellow-500 transition-colors disabled:opacity-50"
          >
            {refunding === item._id ? <i className="fas fa-spinner fa-spin text-[13px]"></i> : <i className="fas fa-undo text-[13px]"></i>}
          </button>
        )}
        {canVoid && (
          <button
            onClick={() => onVoid(item._id)}
            disabled={voiding === item._id}
            title="Void Checkout"
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent hover:bg-red-500/10 text-red-500 transition-colors disabled:opacity-50"
          >
            {voiding === item._id ? <i className="fas fa-spinner fa-spin text-[13px]"></i> : <i className="fas fa-ban text-[13px]"></i>}
          </button>
        )}
      </div>
    );
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-white/[0.06] rounded-xl">
        <i className="fas fa-inbox mb-3 text-2xl text-white/20"></i>
        <p className="text-sm text-white/40">No payments found</p>
        <p className="text-xs text-white/30 mt-1">Try adjusting your filters or check back later.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Column headers */}
      <div className="hidden gap-4 grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_80px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
        <span>User</span>
        <span>Order Info</span>
        <span>Provider</span>
        <span>Amount</span>
        <span>Status</span>
        <span className="text-right">Action</span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {items.map((item) => (
          <div
            key={item._id}
            className="flex flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.015] md:grid md:grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_80px] md:items-center"
          >
            {/* User */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.035] text-[#D4D4D4] overflow-hidden">
                {(() => {
                  const avatarUrl =
                    item.userId?.profilePicture ||
                    item.userId?.oauthProviders?.discord?.avatar ||
                    item.userId?.oauthProviders?.google?.picture;
                  return avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={item.userId?.username || 'User'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          (e.target as HTMLImageElement).style.display = 'none';
                          parent.innerHTML = `<span class="text-xs font-bold text-[#D4D4D4]">${(item.userId?.username?.charAt(0) || 'U').toUpperCase()}</span>`;
                        }
                      }}
                    />
                  ) : (
                    <span className="text-xs font-bold text-[#D4D4D4]">
                      {item.userId?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  );
                })()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-[#D4D4D4]">{item.userId?.username || 'Unknown'}</p>
                <p className="mt-0.5 truncate text-xs text-[#888]">{item.userId?.email || item.userId || ''}</p>
              </div>
            </div>

            {/* Order Info */}
            <div className="flex flex-col justify-center">
              <span className="block truncate font-mono text-xs text-white/60" title={item._id}>
                {item._id.substring(0, 16)}...
              </span>
              <span className="text-[10px] text-white/30 tracking-wide mt-0.5">
                {new Date(item.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Item & Provider */}
            <div className="flex flex-col justify-center">
              <span className="text-sm font-semibold text-white/80 truncate">
                {item.planId?.name || item.planId || 'Unknown'}
              </span>
              <span className="text-[10px] text-white/30 uppercase tracking-wide mt-0.5">
                {item.provider || 'system'}
              </span>
            </div>

            {/* Amount */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white/80">{Number(item.amount || 0).toFixed(2)} {item.currency || 'USD'}</span>
            </div>

            {/* Status */}
            <div className="flex items-center">
              {getStatusBadge(item.status)}
            </div>

            {/* Action */}
            <div className="flex justify-end mt-2 md:mt-0">
              {getActionMenu(item)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
