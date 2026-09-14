"use client";

import { useState, useEffect } from 'react';
import { ShopItem } from '@/hooks/admin/shop/useAdminShop';
import { Drawer } from '@/components/ui/Drawer';

interface EditShopItemModalProps {
  item: ShopItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemId: string, updates: Partial<ShopItem>) => Promise<void>;
  saving: boolean;
}

export function EditShopItemModal({
  item,
  isOpen,
  onClose,
  onSave,
  saving,
}: EditShopItemModalProps) {
  const [formData, setFormData] = useState<Partial<ShopItem>>({});

  useEffect(() => {
    if (item) {
      setFormData({
        amountPerUnit: item.amountPerUnit,
        pricePerUnit: item.pricePerUnit,
        description: item.description,
        enabled: item.enabled,
        maxPerPurchase: item.maxPerPurchase,
      });
    }
  }, [item]);

  const handleSubmit = async () => {
    if (!item) return;
    try {
      await onSave(item._id, formData);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleInputChange = (field: keyof ShopItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen || !item) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${item.name}`}
      subtitle={`Configure pricing, limits, and behavior for ${item.name}`}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                await onSave(item._id, { enabled: !formData.enabled });
                setFormData(prev => ({ ...prev, enabled: !prev.enabled }));
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
              Save Changes
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">Amount per unit</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.amountPerUnit ?? ''}
              onChange={(e) => handleInputChange('amountPerUnit', Number(e.target.value))}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 transition-colors disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">Price per unit (Coins)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.pricePerUnit ?? ''}
              onChange={(e) => handleInputChange('pricePerUnit', Number(e.target.value))}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 transition-colors disabled:opacity-50"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">Max Per Purchase</label>
          <input
            type="number"
            min="1"
            step="1"
            value={formData.maxPerPurchase ?? ''}
            onChange={(e) => handleInputChange('maxPerPurchase', Number(e.target.value))}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 transition-colors disabled:opacity-50"
            required
          />
          <p className="text-[11px] text-[#555] mt-2 font-mono">Maximum quantity a user can buy in one transaction.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">Description</label>
          <textarea
            value={formData.description ?? ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 transition-colors disabled:opacity-50 min-h-[100px] resize-y"
            placeholder="Item description..."
          />
        </div>
      </div>
    </Drawer>
  );
}
