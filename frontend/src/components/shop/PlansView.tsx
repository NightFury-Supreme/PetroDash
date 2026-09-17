import React from "react";
import { useTranslations } from "next-intl";
import {
  Check,
  Cpu,
  HardDrive,
  MemoryStick,
  Server,
  Crown,
  ArrowUpRight,
  Flame,
  Package,
  Clock,
} from "lucide-react";

export interface PlansViewProps {
  plans: any[];
  activePlans: any[];
  currency: string;
  onPurchasePlan: (plan: any) => void;
}

export function PlansView({
  plans,
  activePlans,
  currency,
  onPurchasePlan,
}: PlansViewProps) {
  const t = useTranslations('Shop');


  // Group active plans
  const groups: Record<string, any> = {};
  for (const ap of activePlans) {
    const name: string = ap?.planId?.name || ap?.planId || "Plan";
    const label: string = ap?.isLifetime ? "LIFETIME" : "MONTHLY";
    const key = `${name}__${label}`;
    if (!groups[key]) groups[key] = { name, label, count: 0, planData: ap?.planId };
    groups[key].count += 1;
  }
  const groupedPlans = Object.values(groups);

  const groupedAvailablePlans = plans.reduce((acc, plan) => {
    const categoryName = typeof plan.category === 'string' 
      ? plan.category 
      : (plan.category?.name || t('uncategorized'));
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(plan);
    return acc;
  }, {} as Record<string, any[]>);
  
  const availableCategories = Object.keys(groupedAvailablePlans).sort();


  return (
    <div className="w-full bg-[#0F0F0F] text-white">
      <div className="w-full">
        {/* ================================================================
           HEADER
        ================================================================= */}
        {/* We skip the header because StoreHeader already handles it outside, or we keep it?
            The user put "Plans" header inside. Let's keep it but subdued since StoreHeader has "Store".
            Wait, StoreHeader has "Store" on the left and Tabs on the bottom. The user's snippet 
            has a <header> here. I'll include it. */}
        
        {/* ================================================================
           AVAILABLE PLANS
        ================================================================= */}
        <section className="mt-8">
          <SectionTitle
            icon={<Package className="text-orange-500" />}
            title="Available Plans"
            description={`${plans.length} ${
              plans.length === 1 ? "plan" : "plans"
            } available.`}
          />

          <div className="mt-6 space-y-10">
            {availableCategories.map((category) => (
              <div key={category} className="w-full">
                <h2 className="mb-4 px-2 text-xl font-bold text-white tracking-tight">
                  {category}
                </h2>
                <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
                  {groupedAvailablePlans[category].map((plan: any) => (
                    <PlanRow
                      key={plan._id || plan.id}
                      plan={plan}
                      currency={currency}
                      onPurchase={() => onPurchasePlan(plan)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {plans.length === 0 && <div className="py-8 text-center text-xs text-[#666]">{t('noAvailablePlans')}</div>}
          </div>
        </section>

        {/* ================================================================
           YOUR PLAN
        ================================================================= */}
        <section className="mt-10">
          <SectionTitle
            icon={<Check className="h-3.5 w-3.5" />}
            title="Your Plan"
            description="Your currently active subscriptions."
          />

          {/* ACTIVE PLAN LIST */}
          <div className="mt-4 divide-y divide-white/[0.06]">
            {groupedPlans.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#666]">{t('noActivePlans')}</div>
            ) : (
              groupedPlans.map((g, i) => {
                const res = g.planData?.productContent?.recurrentResources || {};
                const cpu = res.cpuPercent > 0 ? `${res.cpuPercent}% CPU` : "";
                const mem = res.memoryMb > 0 ? `${res.memoryMb} MB memory` : "";
                const dsk = res.diskMb > 0 ? `${res.diskMb} MB disk` : "";
                const srv = g.planData?.productContent?.serverLimit > 0 ? `${g.planData.productContent.serverLimit} server(s)` : "";
                const resString = [cpu, mem, dsk, srv].filter(Boolean).join(" · ");

                return (
                  <div key={i} className="group flex min-h-[72px] flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.015] sm:flex-row sm:items-center">
                    {/* ICON */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.035]">
                      <Crown className="h-4 w-4 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                    </div>

                    {/* INFO */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-white/70">
                          {g.name} <span className="text-xs text-white/25 font-normal ml-1">({g.count} active)</span>
                        </span>
                      </div>
                      {resString && (
                        <p className="mt-1 text-xs text-white/25">
                          {resString}
                        </p>
                      )}
                    </div>

                    <div className="sm:ml-4 flex items-center">
                      <span className="rounded border border-[#FF5722]/30 bg-[#FF5722]/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#FF5722]">
                        {g.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

/* ==========================================================================
   PLAN ROW
========================================================================== */

function PlanRow({
  plan,
  currency,
  onPurchase,
}: {
  plan: any;
  currency: string;
  onPurchase: (plan: any) => void;
}) {
  const t = useTranslations('Shop');
  const res = plan.productContent?.recurrentResources || {};
  const cpu = res.cpuPercent > 0 ? `${res.cpuPercent}%` : "0%";
  const memory = res.memoryMb > 0 ? `${res.memoryMb} MB` : "0 MB";
  const disk = res.diskMb > 0 ? `${res.diskMb} MB` : "0 MB";
  const servers = plan.productContent?.serverLimit > 0 ? `${plan.productContent.serverLimit}` : "0";
  const price = plan.pricePerMonth || plan.price;
  const planCurrency = plan.currency || currency;
  const billing = plan.lifetime ? "One-time payment" : "per month";

  return (
    <article className="group relative flex flex-col gap-5 py-5 transition hover:bg-white/[0.015]">
      {plan.popular && (
        <div className="absolute right-0 top-0 z-10 flex items-center justify-center rounded-bl border-b border-l border-[#FF5722]/30 bg-[#FF5722]/10 px-3 py-1 shadow-sm backdrop-blur-md">
          <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider text-[#FF5722]">
            <Flame className="h-3 w-3" />
            POPULAR
          </span>
        </div>
      )}
      <div className="flex w-full flex-col gap-6 px-5 xl:flex-row xl:items-center">
        {/* PLAN IDENTITY */}
        <div className="flex min-w-0 items-center gap-3 xl:w-[210px] xl:shrink-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.035]">
            <Crown className="h-4 w-4 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-medium text-white/70">
                {plan.name}
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-white/35">
              {typeof plan.description === "string" ? plan.description.replace(/<[^>]+>/g, " ").trim() : plan.description}
            </p>
          </div>
        </div>

        {/* RESOURCES */}
        <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4 xl:min-w-0">
          <Resource icon={<Cpu className="h-3.5 w-3.5" />} label="CPU" value={cpu} />
          <Resource icon={<MemoryStick className="h-3.5 w-3.5" />} label="Memory" value={memory} />
          <Resource icon={<HardDrive className="h-3.5 w-3.5" />} label="Disk" value={disk} />
          <Resource icon={<Server className="h-3.5 w-3.5" />} label="Servers" value={servers} />
        </div>

        {/* PRICE + ACTION */}
        <div className="flex items-center justify-between gap-6 border-t border-white/[0.06] pt-5 sm:justify-end xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0">
          <div className="text-left">
            <p className="text-[9px] uppercase tracking-[0.13em] text-white/20">
              Price
            </p>
            <div className="mt-0.5 flex items-baseline">
              {plan.strikeThroughPrice > 0 && (
                <span className="text-xs text-white/30 line-through mr-1">{plan.strikeThroughPrice} {planCurrency}</span>
              )}
              <span className="text-lg font-semibold tracking-tight text-white/90">
                {price}
              </span>
              <span className="ml-1 text-[10px] text-white/35">
                {planCurrency}
              </span>
            </div>
            <p className="text-[10px] text-white/35">
              {billing}
            </p>
          </div>

          <button
            type="button"
            onClick={onPurchase}
            disabled={plan.stock > 0 && plan.stockLeft === 0}
            className={`group flex h-9 shrink-0 items-center gap-2 rounded-md px-4 text-xs font-semibold transition-all focus:outline-none focus:ring-2 ${
              plan.stock > 0 && plan.stockLeft === 0
                ? 'bg-[#333] text-[#777] cursor-not-allowed'
                : 'bg-[#FF5722] text-white hover:bg-[#E64D1F] focus:ring-[#FF5722]/40'
            }`}
          >
            {plan.stock > 0 && plan.stockLeft === 0 ? "Out of Stock" : (plan.lifetime ? "Purchase" : "Subscribe")}
            {!(plan.stock > 0 && plan.stockLeft === 0) && (
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.06] px-5 pt-4 w-full">
        <div className="flex flex-wrap items-center gap-4">
          {plan.lifetime && (
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-white/40">{t('lifetimeAccess')}</span>
            </div>
          )}
          {plan.stock > 0 && (
            <div className="flex items-center gap-1.5">
              <Package className={`h-3.5 w-3.5 ${plan.stockLeft === 0 ? 'text-red-500' : 'text-orange-400'}`} />
              <span className="text-xs text-white/40">
                {plan.stockLeft === 0 ? (
                  <span className="text-red-500 font-medium">{t('soldOut')}</span>
                ) : plan.stockLeft <= 5 ? (
                  <span className="text-orange-400 font-medium">{plan.stockLeft} {t('stock')} left</span>
                ) : (
                  <span>{t('limitedStock')}</span>
                )}
              </span>
            </div>
          )}
          {plan.availableUntil && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs text-white/40">
                Ends {new Date(plan.availableUntil).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              </span>
            </div>
          )}
        </div>
        <span className="text-[11px] text-white/20 shrink-0 ml-4 hidden sm:block">
          {plan.lifetime ? "One-time purchase" : "Recurring subscription"}
        </span>
      </div>
    </article>
  );
}

function Resource({ icon, label, value }: { icon: React.ReactNode; label: string; value: string; }) {
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

function SectionTitle({ icon, title, description }: { icon: React.ReactNode; title: string; description: string; }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 text-[#FF5722]">{icon}</div>
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-xs text-[#555]">{description}</p>
      </div>
    </div>
  );
}
