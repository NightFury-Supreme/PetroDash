"use client";

import { useState, useEffect } from 'react';
import { Drawer } from '@/components/ui/Drawer';

export interface CouponDrawerProps {
  item: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemId: string | null, data: any) => Promise<void>;
  saving: boolean;
  plans: any[];
  currency: string;
}

export function CouponDrawer({
  item,
  isOpen,
  onClose,
  onSave,
  saving,
  plans,
  currency,
}: CouponDrawerProps) {
  const [formData, setFormData] = useState<any>({
    code: '',
    type: 'percentage',
    value: 0,
    validFrom: '',
    validUntil: '',
    maxRedemptions: 0,
    appliesToPlanIds: [],
    enabled: true,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        code: item.code,
        type: item.type,
        value: item.value,
        validFrom: item.validFrom ? new Date(item.validFrom).toISOString().slice(0, 16) : '',
        validUntil: item.validUntil ? new Date(item.validUntil).toISOString().slice(0, 16) : '',
        maxRedemptions: item.maxRedemptions,
        appliesToPlanIds: item.appliesToPlanIds || [],
        enabled: item.enabled,
      });
    } else {
      setFormData({
        code: '',
        type: 'percentage',
        value: 0,
        validFrom: '',
        validUntil: '',
        maxRedemptions: 0,
        appliesToPlanIds: [],
        enabled: true,
      });
    }
  }, [item, isOpen]);

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        code: String(formData.code || '').toUpperCase(),
        validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : undefined,
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : undefined,
      };
      await onSave(item ? item._id : null, data);
      onClose();
    } catch (error) {
      // Error handled in parent
    }
  };

  if (!isOpen) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={item ? `Edit Coupon: ${item.code}` : "Create New Coupon"}
      subtitle={item ? "Update coupon settings" : "Offer discounts on plan purchases"}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {item && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    await onSave(item._id, { enabled: !formData.enabled });
                    setFormData((prev: any) => ({ ...prev, enabled: !prev.enabled }));
                  }}
                  disabled={saving}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    formData.enabled 
                      ? 'border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                      : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                  }`}
                >
                  {formData.enabled ? (
                    <><i className="fas fa-ban mr-2"></i> Disable</>
                  ) : (
                    <><i className="fas fa-check mr-2"></i> Enable</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm("Are you sure you want to delete this coupon?")) {
                      await onSave(item._id, { _delete: true });
                    }
                  }}
                  disabled={saving}
                  className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20"
                >
                  <i className="fas fa-trash mr-2"></i> Delete
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={onClose} 
              className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#ff6939] disabled:opacity-50"
            >
              {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
              {item ? "Save Changes" : "Create Coupon"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">Code <span className="text-[#FF5722]">*</span></label>
            <input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 transition-colors"
              placeholder="SAVE20"
            />
            <p className="text-[11px] text-[#555] mt-2 font-mono">Auto uppercased.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">Type <span className="text-[#FF5722]">*</span></label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 transition-colors"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed amount ({currency})</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">Value <span className="text-[#FF5722]">*</span></label>
            <input
              type="number"
              min="0"
              max={formData.type === 'percentage' ? 100 : undefined}
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) || 0 })}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">Max Redemptions</label>
            <input
              type="number"
              min="0"
              value={formData.maxRedemptions}
              onChange={(e) => setFormData({ ...formData, maxRedemptions: Number(e.target.value) || 0 })}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 transition-colors"
            />
            <p className="text-[11px] text-[#555] mt-2 font-mono">0 means unlimited.</p>
          </div>
        </div>

        <hr className="border-white/[0.06]" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">Valid From</label>
            <input
              type="datetime-local"
              value={formData.validFrom}
              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">Valid Until</label>
            <input
              type="datetime-local"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 transition-colors"
            />
          </div>
        </div>

        <hr className="border-white/[0.06]" />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">Apply to plans</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {plans.map((p) => (
              <label key={p._id} className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.appliesToPlanIds.includes(p._id)}
                  onChange={() => {
                    setFormData((prev: any) => ({
                      ...prev,
                      appliesToPlanIds: prev.appliesToPlanIds.includes(p._id)
                        ? prev.appliesToPlanIds.filter((id: string) => id !== p._id)
                        : [...prev.appliesToPlanIds, p._id]
                    }));
                  }}
                  className="w-4 h-4 text-[#FF5722] bg-[#1A1A1A] border-[#2A2A2A] rounded focus:ring-[#FF5722] focus:ring-2"
                />
                <div>
                  <div className="text-sm font-medium text-white/80">{p.name}</div>
                  <div className="text-xs text-white/40">{p.pricePerMonth ?? 0} {currency}/month</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
