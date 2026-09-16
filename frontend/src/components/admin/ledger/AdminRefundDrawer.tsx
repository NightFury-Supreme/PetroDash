import React, { useState, useEffect } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { AlertTriangle, Loader2, Undo } from 'lucide-react';

interface AdminRefundDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  payment: any | null;
  isRefunding: boolean;
}

export function AdminRefundDrawer({
  isOpen,
  onClose,
  onConfirm,
  payment,
  isRefunding
}: AdminRefundDrawerProps) {
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (isOpen) {
      setConfirmText("");
    }
  }, [isOpen]);

  const isConfirmDisabled = confirmText.trim().toUpperCase() !== "REFUND";

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Refund Payment"
      subtitle="This will reverse the transaction and return the funds to the original payment method."
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg border border-[#222] bg-transparent px-5 py-2 text-sm font-medium text-[#888] transition-colors hover:border-[#333] hover:text-[#D4D4D4]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isRefunding || isConfirmDisabled}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
              isRefunding || isConfirmDisabled
                ? "bg-[#111] text-[#555] cursor-not-allowed"
                : "bg-yellow-500 text-black hover:bg-yellow-600 shadow-sm"
            }`}
          >
            {isRefunding ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Undo size={16} />
            )}
            Refund Payment
          </button>
        </div>
      }
    >
      <div className="border-b border-white/[0.07] pb-6 mb-8 mt-1">
        <div className="flex flex-col mb-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-500 mb-1.5">Order ID</span>
          <span className="text-[13px] font-mono text-zinc-300 bg-white/[0.03] border border-white/[0.05] px-2.5 py-1.5 rounded-md w-fit">
            {payment?._id || "Unknown"}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col p-3.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-500 mb-1">Refund Amount</span>
            <span className="text-[17px] font-bold text-zinc-100">
              {Number(payment?.amount || 0).toFixed(2)} <span className="text-[13px] text-zinc-500 font-medium">{payment?.currency || 'USD'}</span>
            </span>
          </div>
          <div className="flex flex-col p-3.5 rounded-lg border border-white/[0.06] bg-white/[0.02] min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-500 mb-1">Customer</span>
            <span className="text-[14px] font-semibold text-zinc-200 truncate">{payment?.userId?.username || 'Unknown'}</span>
            <span className="text-[12px] text-zinc-500 truncate mt-0.5">{payment?.userId?.email || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="border-l-2 border-yellow-500 pl-5 py-1 mb-10">
        <div className="flex items-center gap-2 text-yellow-500 mb-4">
          <AlertTriangle size={14} />
          <span className="text-xs font-bold uppercase tracking-wider">BEFORE YOU CONTINUE</span>
        </div>
        <ul className="space-y-3">
          <li className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-yellow-500"></span>
            <span>The customer will receive their money back on their original payment method.</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-zinc-400">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-yellow-500"></span>
            <span>This action is irreversible.</span>
          </li>
        </ul>
      </div>

      <div>
        <h2 className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500 mb-4">
          Type <span className="text-zinc-100">REFUND</span> to confirm
        </h2>
        <div className="flex overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#161616] focus-within:border-yellow-500/50 transition-colors">
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="REFUND"
            className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-[13px] text-white outline-none placeholder:text-zinc-600"
          />
        </div>
      </div>
    </Drawer>
  );
}
