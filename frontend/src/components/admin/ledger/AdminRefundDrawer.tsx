import React from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface AdminRefundDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  paymentId: string | null;
  isRefunding: boolean;
}

export function AdminRefundDrawer({
  isOpen,
  onClose,
  onConfirm,
  paymentId,
  isRefunding
}: AdminRefundDrawerProps) {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Refund"
      subtitle={Are you sure you want to refund payment \?}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            onClick={onClose}
            disabled={isRefunding}
            className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isRefunding}
            className="flex items-center justify-center gap-2 rounded-lg bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-500 transition-colors hover:bg-yellow-500/20 hover:text-yellow-400 disabled:opacity-50"
          >
            {isRefunding ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Refunding...
              </>
            ) : (
              <>
                <AlertTriangle size={16} />
                Confirm Refund
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 text-sm text-[#AAAAAA]">
        <div className="rounded-lg border border-yellow-500/10 bg-yellow-500/[0.02] p-4 text-yellow-500/80">
          <h4 className="mb-2 font-semibold text-yellow-500 flex items-center gap-2">
            <AlertTriangle size={16} />
            Warning: Irreversible Action
          </h4>
          <p>
            Refunding this payment will reverse the transaction and return the funds to the original payment method. 
            This action cannot be undone.
          </p>
        </div>
      </div>
    </Drawer>
  );
}
