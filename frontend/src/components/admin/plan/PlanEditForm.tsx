import { useState } from 'react';

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
  onInputChange: (field: string, value: any) => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
  validationErrors?: Record<string, string>;
}

export function PlanEditForm({
  plan,
  saving,
  onInputChange,
  onSubmit,
  onCancel,
  validationErrors = {},
}: PlanEditFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-[#202020] rounded-lg flex items-center justify-center">
            <i className="fas fa-info-circle text-white text-sm"></i>
          </div>
          <h2 className="text-xl font-semibold text-white">Basic Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#AAAAAA]">
              Plan Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={plan.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              className="w-full bg-[#202020] border border-[#404040] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="e.g., Starter Plan, Pro Plan"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#AAAAAA]">
              Category <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={plan.category}
              onChange={(e) => onInputChange('category', e.target.value)}
              className="w-full bg-[#202020] border border-[#404040] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="e.g., Gaming, Web Hosting"
            />
            {validationErrors?.category && (
              <p className="text-red-400 text-sm">{validationErrors.category}</p>
            )}
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-[#AAAAAA]">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={plan.description || ''}
              onChange={(e) => onInputChange('description', e.target.value)}
              className="w-full bg-[#202020] border border-[#404040] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              rows={3}
              placeholder="Describe what this plan offers..."
            />
            {validationErrors?.description && (
              <p className="text-red-400 text-sm">{validationErrors.description}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#AAAAAA]">
              Available at <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={plan.availableAt ? new Date(plan.availableAt).toISOString().slice(0, 16) : ''}
              onChange={(e) => onInputChange('availableAt', e.target.value ? new Date(e.target.value).toISOString() : null)}
              className="w-full bg-[#202020] border border-[#404040] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            <p className="text-xs text-[#666666]">Countdown time until the plan is available to purchase</p>
            {validationErrors?.availableAt && (
              <p className="text-red-400 text-sm">{validationErrors.availableAt}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#AAAAAA]">
              Available until <span className="text-red-400">*</span>
            </label>
            <div className="space-y-2">
              <input
                type="datetime-local"
                value={plan.availableUntil ? new Date(plan.availableUntil).toISOString().slice(0, 16) : ''}
                onChange={(e) => onInputChange('availableUntil', e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="w-full bg-[#202020] border border-[#404040] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!plan.availableUntil}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onInputChange('availableUntil', null);
                    }
                  }}
                  className="text-blue-500"
                />
                <span className="text-sm text-white">Forever (no expiration)</span>
              </label>
            </div>
            <p className="text-xs text-[#666666]">Countdown time until the plan is unavailable to purchase</p>
            {validationErrors?.availableUntil && (
              <p className="text-red-400 text-sm">{validationErrors.availableUntil}</p>
            )}
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={plan.popular}
                onChange={(e) => onInputChange('popular', e.target.checked)}
                className="text-blue-500"
              />
              <span className="text-white">Mark as Popular</span>
            </label>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-[#202020] rounded-lg flex items-center justify-center">
            <i className="fas fa-dollar-sign text-white text-sm"></i>
          </div>
          <h2 className="text-xl font-semibold text-white">Pricing & Availability</h2>
        </div>
        
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-[#AAAAAA]">
                     {plan.billingOptions.lifetime ? 'Price' : 'Monthly Price'} <span className="text-red-400">*</span>
                   </label>
                   <div className="relative">
                     <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                     <input
                       type="number"
                       value={plan.pricePerMonth}
                       onChange={(e) => onInputChange('pricePerMonth', parseFloat(e.target.value) || 0)}
                       className="w-full bg-[#202020] border border-[#404040] rounded-lg pl-8 pr-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                       min="0"
                       step="0.01"
                     />
                   </div>
                   {plan.billingOptions.lifetime && (
                     <p className="text-xs text-[#AAAAAA]">One-time payment for lifetime access</p>
                   )}
                 </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#AAAAAA]">Strike-through Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={plan.strikeThroughPrice}
                onChange={(e) => onInputChange('strikeThroughPrice', parseFloat(e.target.value) || 0)}
                className="w-full bg-[#202020] border border-[#404040] rounded-lg pl-8 pr-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#AAAAAA]">Stock</label>
            <input
              type="number"
              value={plan.stock}
              onChange={(e) => onInputChange('stock', parseInt(e.target.value) || 0)}
              className="w-full bg-[#202020] border border-[#404040] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              min="-1"
              placeholder="0 = unlimited, -1 = unavailable"
            />
            <p className="text-xs text-[#AAAAAA]">0 = unlimited, -1 = unavailable</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#AAAAAA]">Limit Per Customer</label>
            <input
              type="number"
              value={plan.limitPerCustomer}
              onChange={(e) => onInputChange('limitPerCustomer', parseInt(e.target.value) || 0)}
              className="w-full bg-[#202020] border border-[#404040] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              min="0"
              placeholder="0 = unlimited"
            />
            <p className="text-xs text-[#AAAAAA]">0 = unlimited</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#AAAAAA]">Visibility</label>
            <select
              value={plan.visibility}
              onChange={(e) => onInputChange('visibility', e.target.value)}
              className="w-full bg-[#202020] border border-[#404040] rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            >
              <option value="public">Public - Visible to all users</option>
              <option value="unlisted">Unlisted - Hidden from public view</option>
            </select>
            <p className="text-xs text-[#AAAAAA]">Controls whether this plan is visible to users</p>
          </div>
        </div>
      </div>

      {/* Resource Limits */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-[#202020] rounded-lg flex items-center justify-center">
            <i className="fas fa-server text-white text-sm"></i>
          </div>
          <h2 className="text-xl font-semibold text-white">Resource Limits</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#AAAAAA]">CPU Limit (%)</label>
            <input
              type="number"
              value={plan.productContent.recurrentResources.cpuPercent}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                onInputChange('productContent.recurrentResources.cpuPercent', value);
              }}
              className="w-full bg-[#202020] border border-[#404040] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              min="0"
              step="1"
            />
            <p className="text-xs text-[#AAAAAA]">Maximum CPU usage allowed</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#AAAAAA]">Memory (MB)</label>
            <input
              type="number"
              value={plan.productContent.recurrentResources.memoryMb}
              onChange={(e) => onInputChange('productContent.recurrentResources.memoryMb', parseInt(e.target.value) || 0)}
              className="w-full bg-[#202020] border border-[#404040] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              min="0"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#AAAAAA]">Disk (MB)</label>
            <input
              type="number"
              value={plan.productContent.recurrentResources.diskMb}
              onChange={(e) => onInputChange('productContent.recurrentResources.diskMb', parseInt(e.target.value) || 0)}
              className="w-full bg-[#202020] border border-[#404040] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              min="0"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#AAAAAA]">Backups</label>
            <input
              type="number"
              value={plan.productContent.backups}
              onChange={(e) => onInputChange('productContent.backups', parseInt(e.target.value) || 0)}
              className="w-full bg-[#202020] border border-[#404040] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              min="0"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#AAAAAA]">Databases</label>
            <input
              type="number"
              value={plan.productContent.databases}
              onChange={(e) => onInputChange('productContent.databases', parseInt(e.target.value) || 0)}
              className="w-full bg-[#202020] border border-[#404040] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#AAAAAA]">Ports (Allocations)</label>
            <input
              type="number"
              value={plan.productContent.additionalAllocations}
              onChange={(e) => onInputChange('productContent.additionalAllocations', parseInt(e.target.value) || 0)}
              className="w-full bg-[#202020] border border-[#404040] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              min="0"
            />
            <p className="text-xs text-[#AAAAAA]">Additional ports granted by this plan</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#AAAAAA]">Server Limit</label>
            <input
              type="number"
              value={plan.productContent.serverLimit}
              onChange={(e) => onInputChange('productContent.serverLimit', parseInt(e.target.value) || 1)}
              className="w-full bg-[#202020] border border-[#404040] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              min="1"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#AAAAAA]">Coins</label>
            <input
              type="number"
              value={plan.productContent.coins}
              onChange={(e) => onInputChange('productContent.coins', parseInt(e.target.value) || 0)}
              className="w-full bg-[#202020] border border-[#404040] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              min="0"
            />
            <p className="text-xs text-[#666666]">Coins added to user account when plan is purchased</p>
          </div>
        </div>
      </div>

      {/* Billing Options */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-[#202020] rounded-lg flex items-center justify-center">
            <i className="fas fa-credit-card text-white text-sm"></i>
          </div>
          <h2 className="text-xl font-semibold text-white">Billing Options</h2>
        </div>
        
        <div className="space-y-6">
          {/* Lifetime Plan Toggle */}
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={true}
                disabled={true}
                className="w-4 h-4 text-blue-500 bg-[#202020] border-[#303030] rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-white">Lifetime Plan</span>
            </label>
            <p className="text-xs text-[#666666]">All plans are lifetime (one-time payment)</p>
          </div>


        </div>
      </div>



      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-[#202020] hover:bg-[#272727] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-black px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          {saving ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Saving...
            </>
          ) : (
            <>
              <i className="fas fa-save"></i>
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}
