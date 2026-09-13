import React from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";

export function InvoicesTab({ invoices, invoicePage, invoiceTotalPages, invoiceTotal, setInvoicePage }: any) {
    const { showError } = useToast();
  const downloadInvoice = async (id: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/payments/${id}/invoice`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error("Failed");
      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `invoice-${id}.pdf`;
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (e: any) {
      showError(e.message || "Failed");
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">Invoices</h3>
            <p className="mt-2 text-sm text-white/35">View payment history.</p>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
            <p className="text-sm text-white/50">No invoices found.</p>
          </div>
        ) : (
          <>
            <div className="hidden gap-4 grid-cols-[100px_1fr_100px_120px_100px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
              <span>Date</span>
              <span>Description</span>
              <span>Amount</span>
              <span>Status</span>
              <span className="text-right">Action</span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {invoices.map((inv: any) => (
                <div key={inv._id} className="grid grid-cols-1 gap-4 px-5 py-4 items-center md:grid-cols-[100px_1fr_100px_120px_100px] transition hover:bg-white/[0.02]">
                  <p className="text-xs text-[#888]">{new Date(inv.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm text-[#D4D4D4]">{inv.type === 'ADD_FUNDS' ? 'Added Funds' : 'Plan Purchase'}</p>
                  <p className="text-sm font-medium text-white">${inv.amount?.toFixed(2)}</p>
                  <div><span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase text-emerald-400">Paid</span></div>
                  <div className="flex justify-end">
                    <button onClick={() => downloadInvoice(inv._id)} className="flex items-center gap-1.5 text-xs text-[#FF5722] hover:text-[#F4511E]">
                      <Download size={14} /> PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {invoiceTotalPages > 1 && (
          <div className="flex items-center justify-between pt-5">
            <p className="text-[11px] text-[#888]">
              Showing {invoices.length > 0 ? (invoicePage - 1) * 5 + 1 : 0}-
              {Math.min(invoicePage * 5, invoiceTotal)} of {invoiceTotal}
            </p>
            <div className="flex items-center gap-1">
              <button disabled={invoicePage === 1} onClick={() => setInvoicePage(invoicePage - 1)} className="flex h-8 w-8 items-center justify-center rounded-md border border-[#333] text-[#888] transition hover:bg-[#222] hover:text-[#D4D4D4] disabled:opacity-30">
                <ChevronLeft size={14} />
              </button>
              <button disabled={invoicePage === invoiceTotalPages} onClick={() => setInvoicePage(invoicePage + 1)} className="flex h-8 w-8 items-center justify-center rounded-md border border-[#333] text-[#888] transition hover:bg-[#222] hover:text-[#D4D4D4] disabled:opacity-30">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
