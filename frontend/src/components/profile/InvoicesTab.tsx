import React, { useState, useEffect } from "react";
import { Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useModal } from "@/components/Modal";

export function InvoicesTab({ currency = "USD" }: { currency?: string }) {
  const modal = useModal();
  
  const downloadInvoice = async (id: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Not authenticated");
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/payments/${id}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error((d as any)?.error || "Failed");
      }
      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      await modal.error({ title: "Download Error", body: String(e?.message || "Failed") });
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">Payment History</h3>
            <p className="mt-2 text-sm text-white/35">Your recent plan purchases and payment history.</p>
          </div>
        </div>
        <PaymentsSection currency={currency} onDownload={downloadInvoice} />
      </section>
    </div>
  );
}

function PaymentsSection({ currency, onDownload }: { currency: string; onDownload: (id: string) => void; }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [loading, setLoading] = useState(true);
  const PAYMENTS_PER_PAGE = 10;

  useEffect(() => {
    let active = true;
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/payments?paginate=true&page=${page}&pageSize=${PAYMENTS_PER_PAGE}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (active && res.ok) {
          setPayments(data.data || []);
          setTotalPayments(data.meta?.total || 0);
          setTotalPages(Math.ceil((data.meta?.total || 0) / (data.meta?.pageSize || PAYMENTS_PER_PAGE)) || 1);
        }
      } catch (err) {
        console.error("Failed to fetch payments:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchPayments();
    return () => { active = false; };
  }, [page]);

  return (
    <div>
      {/* TABLE HEADER */}
      <div className="hidden gap-4 grid-cols-[1.8fr_1fr_1.5fr_1fr_1fr_70px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
        <span>Payment ID</span>
        <span>Date</span>
        <span>Plan</span>
        <span>Amount</span>
        <span>Status</span>
        <span className="text-right">Invoice</span>
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
          <div className="py-8 text-center text-xs text-[#666]">No payments yet.</div>
        ) : (
          payments.map((payment, i) => (
            <PaymentRow key={payment.id || i} payment={payment} currency={currency} onDownload={onDownload} />
          ))
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5">
          <p className="text-[11px] text-white/20">
            Showing {payments.length > 0 ? (page - 1) * PAYMENTS_PER_PAGE + 1 : 0}
            {"–"}
            {Math.min(page * PAYMENTS_PER_PAGE, totalPayments)} of {totalPayments} payments
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                disabled={loading}
                className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs transition ${
                  page === pageNumber
                    ? "bg-orange-500 text-black font-medium"
                    : "text-white/30 hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
                }`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              disabled={page === totalPages || loading}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentRow({ payment, currency, onDownload }: { payment: any; currency: string; onDownload: (id: string) => void | Promise<void>; }) {
  const [downloading, setDownloading] = useState(false);
  const isPaid = payment.status === "COMPLETED" || payment.status === "PAID";
  
  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await onDownload(payment.id);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] md:grid-cols-[1.8fr_1fr_1.5fr_1fr_1fr_70px] md:items-center">
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Payment ID</p>
        <span className="block truncate font-mono text-xs text-white/35">
          {payment.id}
        </span>
      </div>
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Date</p>
        <span className="text-xs text-white/35">
          {new Date(payment.createdAt || payment.date).toLocaleDateString()}
        </span>
      </div>
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Plan</p>
        <span className="truncate text-xs font-medium text-white/70">
          {payment.plan?.name || payment.planId || payment.plan}
        </span>
      </div>
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Amount</p>
        <span className="text-xs font-medium text-white/70">
          {payment.amount?.toFixed ? payment.amount.toFixed(2) : payment.amount}
          <span className="ml-1 text-white/25">{payment.currency || currency}</span>
        </span>
      </div>
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Status</p>
        <PaymentStatus status={payment.status} />
      </div>
      <div className="min-w-0 md:text-right">
        {isPaid ? (
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1 text-xs text-[#FF5722] transition-colors hover:text-[#E64D1F] focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 disabled:opacity-50 disabled:cursor-wait"
          >
            {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            PDF
          </button>
        ) : (
          <span className="text-xs text-white/25">—</span>
        )}
      </div>
    </div>
  );
}

function PaymentStatus({ status }: { status: string; }) {
  const normStatus = String(status || "").toUpperCase();
  const isPaid = normStatus === "COMPLETED" || normStatus === "PAID";
  const isRefunded = normStatus === "REFUNDED" || normStatus === "VOIDED";
  
  let styles = "border-yellow-500/20 bg-yellow-500/[0.04] text-yellow-500";
  let label = normStatus;
  
  if (isPaid) {
    styles = "border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-500";
  } else if (isRefunded) {
    styles = "border-red-500/20 bg-red-500/[0.04] text-red-500";
  } else if (normStatus === "PENDING" || normStatus === "CREATED") {
    label = "PROCESSING";
  }

  return (
    <span className={`inline-flex w-fit rounded border px-2 py-1 text-xs font-medium ${styles}`}>
      {label}
    </span>
  );
}
