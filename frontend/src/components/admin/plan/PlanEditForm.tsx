import { useCurrency } from '@/hooks/useCurrency';
import { FieldLabel, FieldHint } from './PlanFormFields';
import React from 'react';
import { Select } from '@/components/ui/Select';
import { PlanCategorySelect } from './PlanCategorySelect';
import type { PlanFormData } from '@/hooks/admin/plan/usePlanEdit';
import { useTranslations } from 'next-intl';

interface PlanEditFormProps {
  plan: PlanFormData;
  saving: boolean;
  validationErrors?: Record<string, string>;
  onInputChange: (path: string, value: any) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onCancel: () => void;
  onDelete?: () => void;
  /** Pre-loaded categories from the parent list — avoids a redundant /categories API call */
  initialCategories?: Array<{ id: string; name: string; planCount: number }>;
}

export function PlanEditForm({
  plan,
  saving: _saving,
  validationErrors = {},
  onInputChange,
  onSubmit,
  initialCategories,
}: PlanEditFormProps) {
  const { currency } = useCurrency();
  const t = useTranslations('Admin.plan');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(e);
  };

  const inputClass = "w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 transition-colors disabled:opacity-50";

  return (
    <form id="edit-plan-form" onSubmit={handleSubmit} className="space-y-6">
      
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white mb-4">{t('basicInfo')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>{t('planName')} <span className="text-red-500">*</span></FieldLabel>
            <input
              type="text"
              value={plan.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              className={inputClass}
              placeholder={t('planNamePlaceholder')}
            />
          </div>
          <div>
            <FieldLabel>{t('category')} <span className="text-red-500">*</span></FieldLabel>
            <PlanCategorySelect 
              value={plan.category || ''} 
              onChange={(v) => onInputChange('category', v)}
              initialCategories={initialCategories}
            />
            {validationErrors?.category && <p className="text-red-400 text-xs mt-1">{validationErrors.category}</p>}
          </div>
          <div className="md:col-span-2">
            <FieldLabel>{t('description')} <span className="text-red-500">*</span></FieldLabel>
            <textarea
              value={plan.description || ''}
              onChange={(e) => onInputChange('description', e.target.value)}
              className={inputClass}
              rows={3}
              placeholder={t('descriptionPlaceholder')}
            />
            {validationErrors?.description && <p className="text-red-400 text-xs mt-1">{validationErrors.description}</p>}
          </div>

          <div>
            <FieldLabel>{t('validFrom')}</FieldLabel>
            <input
              type="datetime-local"
              value={plan.availableAt ? new Date(plan.availableAt).toISOString().slice(0, 16) : ''}
              onChange={(e) => onInputChange('availableAt', e.target.value ? new Date(e.target.value).toISOString() : null)}
              className={inputClass}
            />
            <FieldHint>{t('validFromHint')}</FieldHint>
          </div>
          
          <div>
            <FieldLabel>{t('validUntil')}</FieldLabel>
            <input
              type="datetime-local"
              value={plan.availableUntil ? new Date(plan.availableUntil).toISOString().slice(0, 16) : ''}
              onChange={(e) => onInputChange('availableUntil', e.target.value ? new Date(e.target.value).toISOString() : null)}
              className={inputClass}
            />
            <FieldHint>{t('validUntilHint')}</FieldHint>
          </div>

          <div className="md:col-span-2 flex items-center justify-between py-2">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white mb-0.5">{t('markAsPopular')}</span>
              <span className="text-[11px] text-[#888]">{t('markAsPopularHint')}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={plan.popular}
                onChange={(e) => onInputChange('popular', e.target.checked)}
              />
              <div className="w-11 h-6 bg-[#2A2A2A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#111] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
            </label>
          </div>
        </div>
      </div>

      <hr className="border-white/[0.06]" />

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white mb-4">{t('pricingAndAvailability')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>{plan.billingOptions.lifetime ? t('price') : t('monthlyPrice')} ({currency}) <span className="text-red-500">*</span></FieldLabel>
            <input
              type="number"
              value={plan.pricePerMonth}
              onChange={(e) => onInputChange('pricePerMonth', e.target.value === '' ? '' : parseFloat(e.target.value))}
              className={inputClass}
              min="0" step="0.01"
            />
          </div>
          <div>
            <FieldLabel>{t('strikeThroughPrice')} ({currency})</FieldLabel>
            <input
              type="number"
              value={plan.strikeThroughPrice}
              onChange={(e) => onInputChange('strikeThroughPrice', e.target.value === '' ? '' : parseFloat(e.target.value))}
              className={inputClass}
              min="0" step="0.01"
            />
          </div>
          <div>
            <FieldLabel>{t('stock')}</FieldLabel>
            <input
              type="number"
              value={plan.stock}
              onChange={(e) => onInputChange('stock', e.target.value === '' ? '' : parseInt(e.target.value))}
              className={inputClass}
              min="-1"
            />
            <FieldHint>{t('stockHint')}</FieldHint>
          </div>
          <div>
            <FieldLabel>{t('limitPerCustomer')}</FieldLabel>
            <input
              type="number"
              value={plan.limitPerCustomer}
              onChange={(e) => onInputChange('limitPerCustomer', e.target.value === '' ? '' : parseInt(e.target.value))}
              className={inputClass}
              min="0"
            />
            <FieldHint>{t('limitHint')}</FieldHint>
          </div>
          <div className="md:col-span-2">
            <FieldLabel>{t('visibility')}</FieldLabel>
            <Select
              value={plan.visibility}
              onChange={(val) => onInputChange('visibility', val)}
              options={[
                { value: 'public', label: t('publicVis') },
                { value: 'unlisted', label: t('unlistedVis') }
              ]}
            />
          </div>
        </div>
      </div>

      <hr className="border-white/[0.06]" />

      {/* Resource Limits */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white mb-4">{t('resourceLimits')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <FieldLabel>{t('cpuLimit')} <span className="text-red-500">*</span></FieldLabel>
            <input
              type="number"
              value={plan.productContent.recurrentResources.cpuPercent}
              onChange={(e) => onInputChange('productContent.recurrentResources.cpuPercent', e.target.value === '' ? '' : parseInt(e.target.value))}
              className={inputClass}
              min="0" step="1"
            />
          </div>
          <div>
            <FieldLabel>{t('memoryLimit')} <span className="text-red-500">*</span></FieldLabel>
            <input
              type="number"
              value={plan.productContent.recurrentResources.memoryMb}
              onChange={(e) => onInputChange('productContent.recurrentResources.memoryMb', e.target.value === '' ? '' : parseInt(e.target.value))}
              className={inputClass}
              min="0"
            />
          </div>
          <div>
            <FieldLabel>{t('diskLimit')} <span className="text-red-500">*</span></FieldLabel>
            <input
              type="number"
              value={plan.productContent.recurrentResources.diskMb}
              onChange={(e) => onInputChange('productContent.recurrentResources.diskMb', e.target.value === '' ? '' : parseInt(e.target.value))}
              className={inputClass}
              min="0"
            />
          </div>
          <div>
            <FieldLabel>{t('backupLimit')} <span className="text-red-500">*</span></FieldLabel>
            <input
              type="number"
              value={plan.productContent.backups}
              onChange={(e) => onInputChange('productContent.backups', e.target.value === '' ? '' : parseInt(e.target.value))}
              className={inputClass}
              min="0"
            />
          </div>
          <div>
            <FieldLabel>{t('databaseLimit')} <span className="text-red-500">*</span></FieldLabel>
            <input
              type="number"
              value={plan.productContent.databases}
              onChange={(e) => onInputChange('productContent.databases', e.target.value === '' ? '' : parseInt(e.target.value))}
              className={inputClass}
              min="0"
            />
          </div>
          <div>
            <FieldLabel>{t('allocationLimit')}</FieldLabel>
            <input
              type="number"
              value={plan.productContent.additionalAllocations}
              onChange={(e) => onInputChange('productContent.additionalAllocations', e.target.value === '' ? '' : parseInt(e.target.value))}
              className={inputClass}
              min="0"
            />
          </div>
          <div>
            <FieldLabel>{t('serverLimit')} <span className="text-red-500">*</span></FieldLabel>
            <input
              type="number"
              value={plan.productContent.serverLimit}
              onChange={(e) => onInputChange('productContent.serverLimit', e.target.value === '' ? '' : parseInt(e.target.value))}
              className={inputClass}
              min="1"
            />
          </div>
          <div>
            <FieldLabel>{t('coins')}</FieldLabel>
            <input
              type="number"
              value={plan.productContent.coins}
              onChange={(e) => onInputChange('productContent.coins', e.target.value === '' ? '' : parseInt(e.target.value))}
              className={inputClass}
              min="0"
            />
          </div>
        </div>
      </div>

    </form>
  );
}
