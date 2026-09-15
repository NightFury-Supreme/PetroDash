"use client";

import {
  Check,
  Clock,
  Cpu,
  Edit2,
  Flame,
  HardDrive,
  MemoryStick,
  Package,
  Server,
  Crown,
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

interface Plan {
  _id: string;
  name: string;
  description?: string;
  strikeThroughPrice: number;
  pricePerMonth: number;
  pricePerYear: number;
  visibility: "public" | "unlisted";
  enabled?: boolean;
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
        <Crown className="mb-3 h-8 w-8 text-yellow-400/30 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]" />
        <p className="text-sm text-white/40">No plans yet</p>
        <div className="mt-4">
          <button
            onClick={() => onManage?.("")}
            className="bg-[#FF5722] hover:bg-[#F4511E] text-white px-4 py-2 text-sm rounded-lg font-semibold transition-colors"
          >
            Create First Plan
          </button>
        </div>
      </div>
    );
  }

  // Group plans by category
  const groupedPlans = plans.reduce((acc, plan) => {
    const categoryName = (plan.category as any)?.name || 'Uncategorized';
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(plan);
    return acc;
  }, {} as Record<string, Plan[]>);

  const categories = Object.keys(groupedPlans).sort();

  return (
    <div className="w-full space-y-10">
      {categories.map((category) => (
        <div key={category} className="w-full">
          <h2 className="mb-4 px-2 text-xl font-bold text-white tracking-tight">
            {category}
          </h2>
          <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
            {groupedPlans[category].map((plan) => (
              <AdminPlanRow
                key={plan._id}
                plan={plan}
                currency={currency}
                onManage={() => onManage?.(plan._id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   ADMIN PLAN ROW — mirrors PlansView PlanRow with edit button
   ============================================================ */

function AdminPlanRow({
  plan,
  currency,
  onManage,
}: {
  plan: Plan;
  currency: string;
  onManage: () => void;
}) {
  const res = plan.productContent?.recurrentResources || ({} as any);
  const cpu = res.cpuPercent > 0 ? `${res.cpuPercent}%` : "0%";
  const memory = res.memoryMb > 0 ? `${res.memoryMb} MB` : "0 MB";
  const disk = res.diskMb > 0 ? `${res.diskMb} MB` : "0 MB";
  const servers =
    plan.productContent?.serverLimit > 0
      ? `${plan.productContent.serverLimit}`
      : "0";
  const price = plan.pricePerMonth;
  const isLifetime = plan.billingOptions?.lifetime;
  const billing = isLifetime ? "One-time payment" : "per month";
  const isEnabled = plan.enabled !== false;
  const isExpired = plan.availableUntil && new Date(plan.availableUntil).getTime() < Date.now();

  return (
    <article className="group relative flex flex-col gap-5 py-5 transition hover:bg-white/[0.015]">
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute right-0 top-0 z-10 flex items-center justify-center rounded-bl border-b border-l border-[#FF5722]/30 bg-[#FF5722]/10 px-3 py-1 shadow-sm backdrop-blur-md">
          <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider text-[#FF5722]">
            <Flame className="h-3 w-3" />
            POPULAR
          </span>
        </div>
      )}

      <div className="flex w-full flex-col gap-6 px-5 xl:flex-row xl:items-center">
        {/* Plan Identity */}
        <div className="flex min-w-0 items-center gap-3 xl:w-[210px] xl:shrink-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.035]">
            <Crown className="h-4 w-4 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-medium text-white/70">{plan.name}</h2>
              {plan.visibility !== "public" && (
                <span className="text-[9px] font-bold tracking-wider text-[#AAAAAA] border border-[#AAAAAA]/30 bg-[#AAAAAA]/10 px-1.5 py-0.5 rounded-sm">
                  UNLISTED
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-white/35 truncate">
              {typeof plan.description === "string"
                ? plan.description.replace(/<[^>]+>/g, " ").trim()
                : plan.description}
            </p>
          </div>
        </div>

        {/* Resource chips */}
        <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4 xl:min-w-0">
          <Resource icon={<Cpu className="h-3.5 w-3.5" />} label="CPU" value={cpu} />
          <Resource icon={<MemoryStick className="h-3.5 w-3.5" />} label="Memory" value={memory} />
          <Resource icon={<HardDrive className="h-3.5 w-3.5" />} label="Disk" value={disk} />
          <Resource icon={<Server className="h-3.5 w-3.5" />} label="Servers" value={servers} />
        </div>

        {/* Price + Status + Edit */}
        <div className="flex items-center justify-between gap-6 border-t border-white/[0.06] pt-5 sm:justify-end xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0">
          {/* Price */}
          <div className="text-left">
            <p className="text-[9px] uppercase tracking-[0.13em] text-white/20">Price</p>
            <div className="mt-0.5 flex items-baseline">
              {plan.strikeThroughPrice > 0 && (
                <span className="text-xs text-white/30 line-through mr-1">
                  {plan.strikeThroughPrice} {currency}
                </span>
              )}
              <span className="text-lg font-semibold tracking-tight text-white/90">{price}</span>
              <span className="ml-1 text-[10px] text-white/35">{currency}</span>
            </div>
            <p className="text-[10px] text-white/35">{billing}</p>
          </div>

          {/* Status badge + Edit button */}
          <div className="flex items-center gap-2 shrink-0">
            {isExpired ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 text-amber-400 text-[10px] font-medium tracking-wide uppercase border border-amber-500/20">
                Expired
              </span>
            ) : isEnabled ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium tracking-wide uppercase border border-emerald-500/20">
                Enabled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-medium tracking-wide uppercase border border-red-500/20">
                Disabled
              </span>
            )}
            <button
              onClick={onManage}
              className="bg-white/[0.02] border border-white/[0.04] rounded p-1.5 text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Manage Plan"
            >
              <Edit2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between border-t border-white/[0.06] px-5 pt-4 w-full">
        <div className="flex flex-wrap items-center gap-4">
          {isLifetime && (
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-white/40">Lifetime access</span>
            </div>
          )}
          {plan.stock > 0 && (
            <div className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-xs text-white/40">Limited stock</span>
            </div>
          )}
          {plan.availableUntil && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs text-white/40">
                Ends{" "}
                {new Date(plan.availableUntil).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-white/25">
              {plan.currentUsers} users · {plan.stock === -1 ? "∞" : plan.stock} stock · {plan.totalPurchases} purchases
            </span>
          </div>
        </div>
        <span className="text-[11px] text-white/20 shrink-0 ml-4 hidden sm:block">
          {isLifetime ? "One-time purchase" : "Recurring subscription"}
        </span>
      </div>
    </article>
  );
}

function Resource({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.035] text-white/40">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-[0.13em] text-white/20">{label}</p>
        <p className="mt-0.5 truncate text-xs font-medium text-white/70">{value}</p>
      </div>
    </div>
  );
}
