"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Check, Crown, Package } from "lucide-react";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import type { ShopPlan } from "@/hooks/shop";
import { PlanRow } from "./PlanRow";

export interface PlansViewProps {
  plans: ShopPlan[];
  activePlans: unknown[];
  currency: string;
  onPurchasePlan: (plan: ShopPlan) => void;
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
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

export function PlansView({
  plans,
  activePlans,
  currency,
  onPurchasePlan,
}: PlansViewProps) {
  const t = useTranslations("Shop");

  // Group active plans
  const groups: Record<
    string,
    { name: string; label: string; count: number; planData?: ShopPlan }
  > = {};

  for (const ap of activePlans as Array<{
    planId?: ShopPlan | string;
    isLifetime?: boolean;
  }>) {
    const planObj = typeof ap?.planId === "object" ? ap.planId : null;
    const name: string = planObj?.name || (typeof ap?.planId === "string" ? ap.planId : "Plan");
    const label: string = ap?.isLifetime ? t("lifetimeBadge") : t("monthlyBadge");
    const key = `${name}__${label}`;
    if (!groups[key]) groups[key] = { name, label, count: 0, planData: planObj || undefined };
    groups[key].count += 1;
  }
  const groupedPlans = Object.values(groups);

  const groupedAvailablePlans = plans.reduce((acc, plan) => {
    const rawCategory = (plan as unknown as { category?: string | { name?: string } }).category;
    const categoryName =
      typeof rawCategory === "string"
        ? rawCategory
        : rawCategory?.name || t("uncategorized");
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(plan);
    return acc;
  }, {} as Record<string, ShopPlan[]>);

  const availableCategories = Object.keys(groupedAvailablePlans).sort();

  return (
    <div className="w-full bg-[#0F0F0F] text-white">
      <div className="w-full">
        {/* Available Plans */}
        <section className="mt-8">
          <SectionTitle
            icon={<Package className="text-orange-500" />}
            title={t("availablePlans")}
            description={
              plans.length === 1
                ? t("planAvailable", { count: plans.length })
                : t("plansAvailable", { count: plans.length })
            }
          />

          <div className="mt-6 space-y-10">
            {availableCategories.map((category) => (
              <div key={category} className="w-full">
                <h2 className="mb-4 px-2 text-xl font-bold text-white tracking-tight">
                  {category}
                </h2>
                <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
                  {groupedAvailablePlans[category].map((plan) => (
                    <PlanRow
                      key={plan._id}
                      plan={plan}
                      currency={currency}
                      onPurchase={() => onPurchasePlan(plan)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {plans.length === 0 && (
              <div className="py-8 text-center text-xs text-[#666]">
                {t("noAvailablePlans")}
              </div>
            )}
          </div>
        </section>

        {/* Your Active Plan */}
        <section className="mt-10">
          <SectionTitle
            icon={<Check className="h-3.5 w-3.5" />}
            title={t("yourPlan")}
            description={t("yourCurrentlyActiveSubscriptions")}
          />

          <div className="mt-4 divide-y divide-white/[0.06]">
            {groupedPlans.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#666]">
                {t("noActivePlans")}
              </div>
            ) : (
              groupedPlans.map((g, i) => {
                const res = g.planData?.productContent?.recurrentResources || {};
                const cpu =
                  res.cpuPercent && res.cpuPercent > 0
                    ? t("cpuResource", { amount: res.cpuPercent })
                    : "";
                const mem =
                  res.memoryMb && res.memoryMb > 0
                    ? t("memoryResource", { amount: res.memoryMb })
                    : "";
                const dsk =
                  res.diskMb && res.diskMb > 0
                    ? t("diskResource", { amount: res.diskMb })
                    : "";
                const srv =
                  g.planData?.productContent?.serverLimit &&
                  g.planData.productContent.serverLimit > 0
                    ? t("serverResource", { amount: g.planData.productContent.serverLimit })
                    : "";
                const resString = [cpu, mem, dsk, srv].filter(Boolean).join(" · ");

                return (
                  <div
                    key={i}
                    className="group flex min-h-[72px] flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.015] sm:flex-row sm:items-center"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.035]">
                      <Crown className="h-4 w-4 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-white/70">
                          {g.name}{" "}
                          <span className="text-xs text-white/25 font-normal ml-1">
                            {t("activeCount", { count: g.count })}
                          </span>
                        </span>
                      </div>
                      {resString && (
                        <p className="mt-1 text-xs text-white/25">{resString}</p>
                      )}
                    </div>

                    <div className="sm:ml-4 flex items-center">
                      <StatusIndicator status="warning" label={g.label} />
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
