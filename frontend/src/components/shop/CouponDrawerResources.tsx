"use client";

import React from "react";
import {
  Cpu,
  Database,
  Download,
  HardDrive,
  MemoryStick,
  Server,
  Network,
  Coins,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ShopPlan } from "@/hooks/shop";

export function CheckoutSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
      {children}
    </h2>
  );
}

export function ResourceRow({
  resource,
  index,
  total,
}: {
  resource: { label: string; value: string; icon: React.ReactNode };
  index: number;
  total: number;
}) {
  const isLastOdd = index === total - 1 && total % 2 !== 0;

  return (
    <div
      className={`flex items-center justify-between px-4 py-4 ${
        index % 2 === 1 && !isLastOdd ? "sm:border-l sm:border-white/[0.05]" : ""
      } ${index >= 2 ? "border-t border-white/[0.05]" : ""} ${
        index === 1 ? "border-t border-white/[0.05] sm:border-t-0" : ""
      } ${isLastOdd ? "sm:col-span-2" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.025] text-zinc-400">
          {resource.icon}
        </div>
        <span className="text-[10px] text-zinc-500">{resource.label}</span>
      </div>
      <span className="text-[10px] font-semibold text-white">{resource.value}</span>
    </div>
  );
}

export function usePlanResourceItems(plan?: ShopPlan) {
  const t = useTranslations("Shop");
  const res = plan?.productContent?.recurrentResources || {};
  const cpu = res.cpuPercent && res.cpuPercent > 0 ? `${res.cpuPercent}%` : "0%";
  const memory = res.memoryMb && res.memoryMb > 0 ? `${res.memoryMb} MB` : "0 MB";
  const disk = res.diskMb && res.diskMb > 0 ? `${res.diskMb} MB` : "0 MB";
  const servers =
    plan?.productContent?.serverLimit && plan.productContent.serverLimit > 0
      ? `${plan.productContent.serverLimit}`
      : "0";

  const resources: Array<{ label: string; value: string; icon: React.ReactNode }> = [];
  if (res.cpuPercent && res.cpuPercent > 0)
    resources.push({ label: t("nameCpu"), value: cpu, icon: <Cpu className="h-3.5 w-3.5" /> });
  if (res.memoryMb && res.memoryMb > 0)
    resources.push({ label: t("nameMemory"), value: memory, icon: <MemoryStick className="h-3.5 w-3.5" /> });
  if (res.diskMb && res.diskMb > 0)
    resources.push({ label: t("nameDisk"), value: disk, icon: <HardDrive className="h-3.5 w-3.5" /> });
  if (plan?.productContent?.serverLimit && plan.productContent.serverLimit > 0)
    resources.push({ label: t("nameServerSlots"), value: servers, icon: <Server className="h-3.5 w-3.5" /> });
  if (plan?.productContent?.databases && plan.productContent.databases > 0)
    resources.push({
      label: t("nameDatabases"),
      value: String(plan.productContent.databases),
      icon: <Database className="h-3.5 w-3.5" />,
    });
  if (plan?.productContent?.backups && plan.productContent.backups > 0)
    resources.push({
      label: t("nameBackups"),
      value: String(plan.productContent.backups),
      icon: <Download className="h-3.5 w-3.5" />,
    });
  if (plan?.productContent?.additionalAllocations && plan.productContent.additionalAllocations > 0)
    resources.push({
      label: t("nameAllocations"),
      value: String(plan.productContent.additionalAllocations),
      icon: <Network className="h-3.5 w-3.5" />,
    });
  if (plan?.productContent?.coins && plan.productContent.coins > 0)
    resources.push({
      label: t("coins"),
      value: String(plan.productContent.coins),
      icon: <Coins className="h-3.5 w-3.5" />,
    });

  return resources;
}
