"use client";
import { ActionButton } from '@/components/admin/earn/EarnUI';
import { useToast } from '@/components/ui/ToastProvider';

import { useState, useEffect } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Check } from 'lucide-react';

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
  const { showSuccess, showError } = useToast();

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

  const buildSaveData = () => ({
    ...formData,
    code: String(formData.code || '').toUpperCase(),
    validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : undefined,
    validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : undefined,
  });

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
                {formData.enabled && (
                  <ActionButton
                    onClick={async () => {
                      await onSave(item._id, { enabled: false });
                      setFormData((prev: any) => ({ ...prev, enabled: false }));
                    }}
                    loading={saving}
                    label="Disable"
                    variant="danger"
                    icon={<i className="fas fa-ban mr-2"></i>}
                    onSuccess={() => { showSuccess(`Coupon ${item.code} disabled.`); onClose(); }}
                    onError={(e) => showError(e)}
                  />
                )}
                  <ActionButton
                    onClick={async () => {
                      if (confirm("Are you sure you want to delete this coupon?")) {
                        await onSave(item._id, { _delete: true });
                      }
                    }}
                    loading={saving}
                    disabled={item.redeemedCount > 0}
                    title={item.redeemedCount > 0 ? "Cannot delete coupon that has been used" : undefined}
                    label="Delete"
                    variant="danger"
                    icon={<i className="fas fa-trash mr-2"></i>}
                    onSuccess={() => { showSuccess(`Coupon ${item.code} deleted.`); onClose(); }}
                    onError={(e) => showError(e)}
                  />
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            {item && !formData.enabled ? (
              <ActionButton
                onClick={async () => {
                  await onSave(item._id, { enabled: true });
                  setFormData((prev: any) => ({ ...prev, enabled: true }));
                }}
                loading={saving}
                label="Enable Item"
                onSuccess={() => { showSuccess(`Coupon ${item.code} enabled.`); onClose(); }}
                onError={(e) => showError(e)}
              />
            ) : (
              <ActionButton
                onClick={async () => {
                  await onSave(item ? item._id : null, buildSaveData());
                }}
                loading={saving}
                label={item ? "Save Changes" : "Create Coupon"}
                icon={<i className="fas fa-save mr-2"></i>}
                onSuccess={() => { showSuccess(item ? `Coupon ${item.code} saved.` : "Coupon created."); onClose(); }}
                onError={(e) => showError(e)}
              />
            )}
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
            <p className="text-[11px] text-[#555] mt-2 font-mono">Leave blank to start immediately</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">Valid Until</label>
            <input
              type="datetime-local"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 transition-colors"
            />
            <p className="text-[11px] text-[#555] mt-2 font-mono">Leave blank to never expire</p>
          </div>
        </div>

        <hr className="border-white/[0.06]" />

          <div>
            <h3 className="text-sm font-medium text-white mb-1">Allowed Plans</h3>
            <p className="text-xs text-[#888] mb-4">Select which plans this coupon can be applied to. Leave empty to allow all plans.</p>
            <div className="border-t border-white/[0.06] divide-y divide-white/[0.06]">
              {plans.map((p) => {
                const id = String(p._id || p.id);
                const name = p.name || id;
                const price = p.pricePerMonth !== undefined ? Number(p.pricePerMonth) : 0;
                const planCurrency = p.currency || currency;
                const selected = (formData.appliesToPlanIds || []).includes(id);

                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => {
                      setFormData((prev: any) => ({
                        ...prev,
                        appliesToPlanIds: selected
                          ? prev.appliesToPlanIds.filter((v: string) => v !== id)
                          : [...(prev.appliesToPlanIds || []), id]
                      }));
                    }}
                    className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${selected ? 'bg-[#FF5722]/[0.06]' : 'hover:bg-white/[0.015]'}`}
                  >
                    <div className="min-w-0 pr-4">
                      <span className={`block text-sm font-medium ${selected ? 'text-white/90' : 'text-white/70'}`}>
                        {name}
                      </span>
                      <span className="block mt-0.5 font-mono text-[11px] text-white/35">
                        {id}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.13em] text-white/20 text-right">Price</p>
                        <p className={`text-sm font-semibold tracking-tight mt-0.5 ${selected ? 'text-white/90' : 'text-white/60'}`}>
                          {price > 0 ? price.toFixed(2) : "0.00"} <span className="text-[10px] font-normal text-white/25">{planCurrency}</span>
                        </p>
                      </div>

                      <div className={`flex items-center justify-center w-5 h-5 rounded-full border transition-colors shrink-0 ${
                        selected ? 'bg-[#FF5722] border-[#FF5722] text-black' : 'border-white/15 text-transparent'
                      }`}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                    </div>
                  </button>
                );
              })}
              {plans.length === 0 && (
                <div className="py-6 text-center text-xs text-white/25 italic">No plans available.</div>
              )}
            </div>
          </div>
      </div>
    </Drawer>
  );
}
