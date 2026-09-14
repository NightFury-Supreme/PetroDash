"use client";

import { useCurrency } from '@/hooks/useCurrency';

interface Plan {
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
  totalPurchases: number;
  currentUsers: number;
  popular: boolean;
  sortOrder: number;
}

interface PlansListProps {
  plans: Plan[];
  deleting: string | null;
  onDelete: (planId: string, planName: string) => Promise<void>;
  onToggleEnabled: (plan: Plan) => Promise<void>;
  onMakeUnlisted: (plan: Plan) => Promise<void>;
  onMakePublic: (plan: Plan) => Promise<void>;
  onManage?: (planId: string) => void;
}

export function PlansList({
  plans,
  deleting: _deleting,
  onDelete: _onDelete,
  onToggleEnabled: _onToggleEnabled,
  onMakeUnlisted: _onMakeUnlisted,
  onMakePublic: _onMakePublic,
  onManage,
}: PlansListProps) {
  const { currency } = useCurrency();
  
  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-white/[0.06] rounded-xl">
        <i className="fas fa-crown mb-3 text-2xl text-yellow-400/50"></i>
        <p className="text-sm text-white/40">No plans yet</p>
        <div className="mt-4">
          <button 
            onClick={() => onManage && onManage("")}
            className="bg-white hover:bg-gray-100 text-black px-4 py-2 text-sm rounded-lg font-semibold transition-colors"
          >
            Create First Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="hidden gap-4 grid-cols-[2fr_2fr_1fr_1fr_120px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
        <span>Plan Name</span>
        <span>Specifications</span>
        <span>Price</span>
        <span>Stats</span>
        <span className="text-right">Action</span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className={`flex flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.015] md:grid md:grid-cols-[2fr_2fr_1fr_1fr_120px] md:items-center ${
              plan.visibility !== 'public' ? 'opacity-70' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.035]">
                <i className="fas fa-crown text-sm text-yellow-500/50"></i>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/80 truncate">
                  {plan.name}
                  {plan.popular && <span className="ml-2 text-[10px] text-yellow-500 border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 rounded-sm">POPULAR</span>}
                  {plan.visibility !== 'public' && <span className="ml-2 text-[10px] text-[#AAAAAA] border border-[#AAAAAA]/30 bg-[#AAAAAA]/10 px-1.5 py-0.5 rounded-sm">UNLISTED</span>}
                </p>
                <p className="text-xs text-white/30 truncate">{plan.description || 'Hosting Plan'}</p>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <span className="text-sm font-semibold text-white/80">
                {plan.productContent.recurrentResources.cpuPercent}% CPU, {plan.productContent.recurrentResources.memoryMb}MB RAM
              </span>
              <span className="text-xs text-white/30 uppercase tracking-wide">
                {plan.productContent.recurrentResources.diskMb}MB Disk, {plan.productContent.serverLimit} Servers
              </span>
            </div>

            <div className="flex flex-col justify-center">
              <span className="text-sm font-semibold text-white/80">{plan.pricePerMonth} {currency}</span>
              <span className="text-[10px] text-white/30 uppercase tracking-wide">{plan.billingOptions?.lifetime ? 'ONCE' : 'PER MONTH'}</span>
            </div>

            <div className="flex flex-col justify-center">
              <span className="text-sm font-semibold text-white/80">{plan.currentUsers} / {plan.stock === -1 ? '∞' : plan.stock}</span>
              <span className="text-[10px] text-white/30 uppercase tracking-wide">USERS / STOCK</span>
            </div>

            <div className="flex justify-end mt-2 md:mt-0">
              <button
                onClick={() => onManage && onManage(plan._id)}
                className="h-8 rounded-md bg-white/[0.05] border border-white/[0.05] px-4 text-xs font-medium text-white transition-all hover:bg-white/[0.1] hover:text-white"
              >
                Manage
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
