import { useCurrency } from '@/hooks/useCurrency';
import { FieldLabel, FieldHint } from '@/components/admin/earn/EarnUI';

interface PlanFormData {
  name: string;
  description: string;
  strikeThroughPrice: number;
  pricePerMonth: number;
  pricePerYear: number;
  visibility: 'public' | 'unlisted';
  availableAt: string;
  availableUntil: string;
  stock: number;
  limitPerCustomer: number;
  category: string;
  redirectionLink: string;
  billingOptions: {
    renewable: boolean;
    nonRenewable: boolean;
    lifetime: boolean;
  };
  availableBillingCycles: string[];
  productContent: {
    recurrentResources: {
      cpuPercent: number;
      memoryMb: number;
      diskMb: number;
      swapMb: number;
      blockIoProportion: number;
      cpuPinning: string;
    };
    additionalAllocations: number;
    databases: number;
    backups: number;
    coins: number;
    serverLimit: number;
  };
  staffNotes: string;
  popular: boolean;
  sortOrder: number;
}

interface PlanFormProps {
  formData: PlanFormData;
  validationErrors: Record<string, string>;
  saving: boolean;
  onInputChange: (field: string, value: any) => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
}

export function PlanForm({
  formData,
  validationErrors,
  saving,
  onInputChange,
  onSubmit,
}: PlanFormProps) {
  const { currency } = useCurrency();

  const inputClass = "w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 transition-colors disabled:opacity-50";

  return (
    <form id="create-plan-form" onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
      
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Plan Name</FieldLabel>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              className={inputClass}
              placeholder="e.g., Starter Plan"
            />
          </div>
          <div>
            <FieldLabel>Category</FieldLabel>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => onInputChange('category', e.target.value)}
              className={inputClass}
              placeholder="e.g., Gaming"
            />
            {validationErrors?.category && <p className="text-red-400 text-xs mt-1">{validationErrors.category}</p>}
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={formData.description || ''}
              onChange={(e) => onInputChange('description', e.target.value)}
              className={inputClass}
              rows={3}
              placeholder="Describe what this plan offers..."
            />
            {validationErrors?.description && <p className="text-red-400 text-xs mt-1">{validationErrors.description}</p>}
          </div>

          <div>
            <FieldLabel>Available at</FieldLabel>
            <input
              type="datetime-local"
              value={formData.availableAt ? new Date(formData.availableAt).toISOString().slice(0, 16) : ''}
              onChange={(e) => onInputChange('availableAt', e.target.value ? new Date(e.target.value).toISOString() : null)}
              className={inputClass}
            />
            <FieldHint>Countdown time until plan is available</FieldHint>
          </div>
          
          <div>
            <FieldLabel>Available until</FieldLabel>
            <input
              type="datetime-local"
              value={formData.availableUntil ? new Date(formData.availableUntil).toISOString().slice(0, 16) : ''}
              onChange={(e) => onInputChange('availableUntil', e.target.value ? new Date(e.target.value).toISOString() : null)}
              className={inputClass}
              disabled={!formData.availableUntil}
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={!formData.availableUntil}
                onChange={(e) => {
                  if (e.target.checked) onInputChange('availableUntil', null);
                }}
                className="text-[#FF5722] rounded border-[#333] bg-[#222]"
              />
              <span className="text-[11px] text-[#888]">Forever (no expiration)</span>
            </div>
          </div>

          <div className="md:col-span-2 flex items-center justify-between bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3.5">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white mb-0.5">Mark as Popular</span>
              <span className="text-[11px] text-[#888]">Highlight this plan with a popular badge to attract users.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.popular}
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
        <h3 className="text-sm font-medium text-white mb-4">Pricing & Availability</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>{formData.billingOptions.lifetime ? 'Price' : 'Monthly Price'} ({currency})</FieldLabel>
            <input
              type="number"
              value={formData.pricePerMonth}
              onChange={(e) => onInputChange('pricePerMonth', parseFloat(e.target.value) || 0)}
              className={inputClass}
              min="0" step="0.01"
            />
          </div>
          <div>
            <FieldLabel>Strike-through Price ({currency})</FieldLabel>
            <input
              type="number"
              value={formData.strikeThroughPrice}
              onChange={(e) => onInputChange('strikeThroughPrice', parseFloat(e.target.value) || 0)}
              className={inputClass}
              min="0" step="0.01"
            />
          </div>
          <div>
            <FieldLabel>Stock</FieldLabel>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => onInputChange('stock', parseInt(e.target.value) || 0)}
              className={inputClass}
              min="-1"
            />
            <FieldHint>0 = unlimited, -1 = unavailable</FieldHint>
          </div>
          <div>
            <FieldLabel>Limit Per Customer</FieldLabel>
            <input
              type="number"
              value={formData.limitPerCustomer}
              onChange={(e) => onInputChange('limitPerCustomer', parseInt(e.target.value) || 0)}
              className={inputClass}
              min="0"
            />
            <FieldHint>0 = unlimited</FieldHint>
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Visibility</FieldLabel>
            <select
              value={formData.visibility}
              onChange={(e) => onInputChange('visibility', e.target.value)}
              className={inputClass}
            >
              <option value="public">Public - Visible to all users</option>
              <option value="unlisted">Unlisted - Hidden from public view</option>
            </select>
          </div>
        </div>
      </div>

      <hr className="border-white/[0.06]" />

      {/* Resource Limits */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white mb-4">Resource Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <FieldLabel>CPU Limit (%)</FieldLabel>
            <input
              type="number"
              value={formData.productContent.recurrentResources.cpuPercent}
              onChange={(e) => onInputChange('productContent.recurrentResources.cpuPercent', parseInt(e.target.value) || 0)}
              className={inputClass}
              min="0" step="1"
            />
          </div>
          <div>
            <FieldLabel>Memory (MB)</FieldLabel>
            <input
              type="number"
              value={formData.productContent.recurrentResources.memoryMb}
              onChange={(e) => onInputChange('productContent.recurrentResources.memoryMb', parseInt(e.target.value) || 0)}
              className={inputClass}
              min="0"
            />
          </div>
          <div>
            <FieldLabel>Disk (MB)</FieldLabel>
            <input
              type="number"
              value={formData.productContent.recurrentResources.diskMb}
              onChange={(e) => onInputChange('productContent.recurrentResources.diskMb', parseInt(e.target.value) || 0)}
              className={inputClass}
              min="0"
            />
          </div>
          <div>
            <FieldLabel>Backups</FieldLabel>
            <input
              type="number"
              value={formData.productContent.backups}
              onChange={(e) => onInputChange('productContent.backups', parseInt(e.target.value) || 0)}
              className={inputClass}
              min="0"
            />
          </div>
          <div>
            <FieldLabel>Databases</FieldLabel>
            <input
              type="number"
              value={formData.productContent.databases}
              onChange={(e) => onInputChange('productContent.databases', parseInt(e.target.value) || 0)}
              className={inputClass}
              min="0"
            />
          </div>
          <div>
            <FieldLabel>Ports</FieldLabel>
            <input
              type="number"
              value={formData.productContent.additionalAllocations}
              onChange={(e) => onInputChange('productContent.additionalAllocations', parseInt(e.target.value) || 0)}
              className={inputClass}
              min="0"
            />
          </div>
          <div>
            <FieldLabel>Server Limit</FieldLabel>
            <input
              type="number"
              value={formData.productContent.serverLimit}
              onChange={(e) => onInputChange('productContent.serverLimit', parseInt(e.target.value) || 1)}
              className={inputClass}
              min="1"
            />
          </div>
          <div>
            <FieldLabel>Coins</FieldLabel>
            <input
              type="number"
              value={formData.productContent.coins}
              onChange={(e) => onInputChange('productContent.coins', parseInt(e.target.value) || 0)}
              className={inputClass}
              min="0"
            />
          </div>
        </div>
      </div>

    </form>
  );
}
