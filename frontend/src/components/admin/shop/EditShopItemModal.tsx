"use client";
import { ActionButton } from '@/components/admin/earn/EarnUI';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';

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
  const { showSuccess, showError } = useToast();
  const t = useTranslations('AdminShop');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');

  useEffect(() => {
    if (item) {
      setFormData({
        amountPerUnit: item.amountPerUnit,
        pricePerUnit: item.pricePerUnit,
        
        enabled: item.enabled,
        maxPerPurchase: item.maxPerPurchase,
      });
    }
  }, [item]);

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
      title={t('editItem', { name: item.name })}
      subtitle={t('editItemDescription', { name: item.name })}
      footer={
        formData.enabled ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <ActionButton
                onClick={async () => {
                  await onSave(item._id, { enabled: false });
                  setFormData(prev => ({ ...prev, enabled: false }));
                }}
                loading={saving}
                label={tCommon('disable')}
                variant="danger"
                icon={<i className="fas fa-ban mr-2"></i>}
                onSuccess={() => { showSuccess(t('itemDisabled', { name: item.name })); onClose(); }}
                onError={(e) => showError(tErrorBackend.has(e) ? tErrorBackend(e) : e)}
              />
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tCommon('cancel')}
              </button>
              <ActionButton
                onClick={async () => { await onSave(item._id, formData); }}
                loading={saving}
                label={tCommon('saveChanges')}
                icon={<i className="fas fa-save mr-2"></i>}
                onSuccess={() => { showSuccess(t('itemSaved', { name: item.name })); onClose(); }}
                onError={(e) => showError(tErrorBackend.has(e) ? tErrorBackend(e) : e)}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end w-full gap-2">
            <button 
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {tCommon('cancel')}
            </button>
            <ActionButton
              onClick={async () => {
                await onSave(item._id, { enabled: true });
                setFormData(prev => ({ ...prev, enabled: true }));
              }}
              loading={saving}
              label={t('enableItem')}
              onSuccess={() => { showSuccess(t('itemEnabled', { name: item.name })); onClose(); }}
              onError={(e) => showError(tErrorBackend.has(e) ? tErrorBackend(e) : e)}
            />
          </div>
        )
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">{t('amountPerUnit')}</label>
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">{t('pricePerUnit')}</label>
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
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#888] mb-2">{t('maxPerPurchase')}</label>
          <input
            type="number"
            min="1"
            step="1"
            value={formData.maxPerPurchase ?? ''}
            onChange={(e) => handleInputChange('maxPerPurchase', Number(e.target.value))}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 transition-colors disabled:opacity-50"
            required
          />
          <p className="text-[11px] text-[#555] mt-2 font-mono">{t('maxPerPurchaseDescription')}</p>
        </div>

        
      </div>
    </Drawer>
  );
}


