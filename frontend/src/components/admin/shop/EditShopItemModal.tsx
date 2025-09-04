"use client";

import { useState, useEffect } from 'react';
import { ShopItem } from '@/hooks/admin/shop/useAdminShop';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-panel">
        <div className="modal-header">
          <span className="icon-badge" style={{ transform: 'scale(.9)' }}>
            <i className="fas fa-edit text-blue-300"></i>
          </span>
          <h3 className="font-semibold text-sm">Edit {item.name}</h3>
        </div>
        
        <div className="modal-body text-sm text-gray-300">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Per Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount per unit
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.amountPerUnit ?? ''}
                onChange={(e) => handleInputChange('amountPerUnit', Number(e.target.value))}
                className="w-full bg-[#202020] border border-[#404040] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Enter amount"
              />
            </div>

            {/* Price Per Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Price per unit (coins)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.pricePerUnit ?? ''}
                onChange={(e) => handleInputChange('pricePerUnit', Number(e.target.value))}
                className="w-full bg-[#202020] border border-[#404040] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Enter price"
              />
            </div>

            {/* Max Per Purchase */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max per purchase
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.maxPerPurchase ?? ''}
                onChange={(e) => handleInputChange('maxPerPurchase', Number(e.target.value))}
                className="w-full bg-[#202020] border border-[#404040] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Enter max purchase limit"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description ?? ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full bg-[#202020] border border-[#404040] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                placeholder="Enter description"
              />
            </div>

            {/* Enabled Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled ?? false}
                onChange={(e) => handleInputChange('enabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-[#202020] border-[#404040] rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="enabled" className="text-sm font-medium text-gray-300">
                Enable this item
              </label>
            </div>
          </form>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
