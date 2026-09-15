import { useCurrency } from '@/hooks/useCurrency';
import { FieldLabel, FieldHint } from '@/components/admin/earn/EarnUI';

interface PlanFormData {
  _id: string;
  name: string;
  description?: string;
  strikeThroughPrice: number;
  pricePerMonth: number;
  pricePerYear: number;
  visibility: 'public' | 'unlisted';
  availableAt?: string;
  availableUntil?: string;
  stock: number;
  limitPerCustomer: number;
  category: string;
  redirectionLink?: string;
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
  enabled: boolean;
  sortOrder: number;
}

interface PlanEditFormProps {
  plan: PlanFormData;
  saving: boolean;
  validationErrors?: Record<string, string>;
  onInputChange: (path: string, value: any) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function PlanEditForm({
  plan,
  saving,
  validationErrors = {},
  onInputChange,
  onSubmit,
}: PlanEditFormProps) {
  const { currency } = useCurrency();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(e);
  };

  const inputClass = "w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF5722]/50 transition-colors disabled:opacity-50";

  return (
    <form id="edit-plan-form" onSubmit={handleSubmit} className="space-y-6">
      
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Plan Name</FieldLabel>
            <input
              type="text"
              value={plan.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              className={inputClass}
              placeholder="e.g., Starter Plan"
            />
          </div>
          <div>
            <FieldLabel>Category</FieldLabel>
            <input
              type="text"
              value={plan.category}
              onChange={(e) => onInputChange('category', e.target.value)}
              className={inputClass}
              placeholder="e.g., Gaming"
            />
            {validationErrors?.category && <p className="text-red-400 text-xs mt-1">{validationErrors.category}</p>}
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={plan.description || ''}
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
              value={plan.availableAt ? new Date(plan.availableAt).toISOString().slice(0, 16) : ''}
              onChange={(e) => onInputChange('availableAt', e.target.value ? new Date(e.target.value).toISOString() : null)}
              className={inputClass}
            />
            <FieldHint>Countdown time until plan is available</FieldHint>
          </div>
          
          <div>
            <FieldLabel>Available until</FieldLabel>
            <input
              type="datetime-local"
              value={plan.availableUntil ? new Date(plan.availableUntil).toISOString().slice(0, 16) : ''}
              onChange={(e) => onInputChange('availableUntil', e.target.value ? new Date(e.target.value).toISOString() : null)}
              className={inputClass}
              disabled={!plan.availableUntil}
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={!plan.availableUntil}
                onChange={(e) => {
                  if (e.target.checked) onInputChange('availableUntil', null);
                }}
                className="text-[#FF5722] rounded border-[#333] bg-[#222]"
              />
              <span className="text-[11px] text-[#888]">Forever (no expiration)</span>
            </div>
          </div>

          <div className="md:col-span-2 pt-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={plan.popular}
                onChange={(e) => onInputChange('popular', e.target.checked)}
                className="text-[#FF5722] rounded border-[#333] bg-[#222]"
              />
              <span className="text-sm text-white">Mark as Popular</span>
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
            <FieldLabel>{plan.billingOptions.lifetime ? 'Price' : 'Monthly Price'} ({currency})</FieldLabel>
            <input
              type="number"
              value={plan.pricePerMonth}
              onChange={(e) => onInputChange('pricePerMonth', parseFloat(e.target.value) || 0)}
              className={inputClass}
              min="0" step="0.01"
            />
          </div>
          <div>
            <FieldLabel>Strike-through Price ({currency})</FieldLabel>
            <input
              type="number"
              value={plan.strikeThroughPrice}
              onChange={(e) => onInputChange('strikeThroughPrice', parseFloat(e.target.value) || 0)}
              className={inputClass}
              min="0" step="0.01"
            />
          </div>
          <div>
            <FieldLabel>Stock</FieldLabel>
            <input
              type="number"
              value={plan.stock}
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
              value={plan.limitPerCustomer}
              onChange={(e) => onInputChange('limitPerCustomer', parseInt(e.target.value) || 0)}
              className={inputClass}
              min="0"
            />
            <FieldHint>0 = unlimited</FieldHint>
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Visibility</FieldLabel>
            <select
              value={plan.visibility}
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
              value={plan.productContent.recurrentResources.cpuPercent}
              onChange={(e) => onInputChange('productContent.recurrentResources.cpuPercent', parseInt(e.target.value) || 0)}
              className={inputClass}
              min="0" step="1"
            />
          </div>
          <div>
            <FieldLabel>Memory (MB)</FieldLabel>
            <input
              type="number"
              value={plan.productContent.recurrentResources.memoryMb}
              onChange={(e) => onInputChange('productContent.recurrentResources.memoryMb', parseInt(e.target.value) || 0)}
              className={inputClass}
              min="0"
            />
          </div>
          <div>
            <FieldLabel>Disk (MB)</FieldLabel>
            <input
              type="number"
              value={plan.productContent.recurrentResources.diskMb}
              onChange={(e) => onInputChange('productContent.recurrentResources.diskMb', parseInt(e.target.value) || 0)}
              className={inputClass}
              min="0"
            />
          </div>
          <div>
            <FieldLabel>Backups</FieldLabel>
            <input
              type="number"
              value={plan.productContent.backups}
              onChange={(e) => onInputChange('productContent.backups', parseInt(e.target.value) || 0)}
              className={inputClass}
              min="0"
            />
          </div>
          <div>
            <FieldLabel>Databases</FieldLabel>
            <input
              type="number"
              value={plan.productContent.databases}
              onChange={(e) => onInputChange('productContent.databases', parseInt(e.target.value) || 0)}
              className={inputClass}
              min="0"
            />
          </div>
          <div>
            <FieldLabel>Ports</FieldLabel>
            <input
              type="number"
              value={plan.productContent.additionalAllocations}
              onChange={(e) => onInputChange('productContent.additionalAllocations', parseInt(e.target.value) || 0)}
              className={inputClass}
              min="0"
            />
          </div>
          <div>
            <FieldLabel>Server Limit</FieldLabel>
            <input
              type="number"
              value={plan.productContent.serverLimit}
              onChange={(e) => onInputChange('productContent.serverLimit', parseInt(e.target.value) || 1)}
              className={inputClass}
              min="1"
            />
          </div>
          <div>
            <FieldLabel>Coins</FieldLabel>
            <input
              type="number"
              value={plan.productContent.coins}
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
