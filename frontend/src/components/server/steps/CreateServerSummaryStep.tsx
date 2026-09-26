"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Server,
  Box,
  Globe,
  Cpu,
  CircuitBoard,
  HardDrive,
  Database,
  Archive,
  Network,
} from "lucide-react";
import type { CreateFormData, EggOption, LocationOption } from "@/hooks/useServerCreate";

interface CreateServerSummaryStepProps {
  form: CreateFormData;
  eggs: EggOption[];
  locations: LocationOption[];
}

export function CreateServerSummaryStep({
  form,
  eggs,
  locations,
}: CreateServerSummaryStepProps) {
  const t = useTranslations("Dashboard");

  const selectedEgg = eggs.find((e) => e._id === form.eggId);
  const selectedLocation = locations.find((l) => l._id === form.locationId);
  const flagSource = selectedLocation?.flag || selectedLocation?.flagUrl;

  const generalRows = [
    {
      label: t("serverName"),
      value: form.name || t("unnamedServer"),
      icon: <Server size={14} strokeWidth={2} />,
    },
    {
      label: t("software"),
      value: selectedEgg?.name || t("noneSelected"),
      icon: selectedEgg?.icon ? (
        <img
          src={
            selectedEgg.icon.startsWith("http")
              ? selectedEgg.icon
              : `${process.env.NEXT_PUBLIC_API_BASE || ""}${selectedEgg.icon.startsWith("/") ? "" : "/"}${selectedEgg.icon}`
          }
          alt="Icon"
          className="w-full h-full object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            if (e.currentTarget.nextElementSibling) {
              (e.currentTarget.nextElementSibling as HTMLElement).style.display = "block";
            }
          }}
        />
      ) : (
        <Box size={14} strokeWidth={2} className="text-[#888]" />
      ),
    },
    {
      label: t("location"),
      value: selectedLocation?.name || t("noneSelected"),
      icon: flagSource ? (
        <img
          src={
            flagSource.startsWith("http")
              ? flagSource
              : `${process.env.NEXT_PUBLIC_API_BASE || ""}${flagSource.startsWith("/") ? "" : "/"}${flagSource}`
          }
          alt="Flag"
          className="w-full h-full object-contain rounded-[2px]"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            if (e.currentTarget.nextElementSibling) {
              (e.currentTarget.nextElementSibling as HTMLElement).style.display = "block";
            }
          }}
        />
      ) : (
        <Globe size={14} strokeWidth={2} className="text-[#888]" />
      ),
    },
  ];

  const resourceRows = [
    { label: t("cpu"), value: `${form.cpuPercent}%`, icon: <Cpu size={14} strokeWidth={2} /> },
    { label: t("memory"), value: `${form.memoryMb} MB`, icon: <CircuitBoard size={14} strokeWidth={2} /> },
    { label: t("disk"), value: `${form.diskMb} MB`, icon: <HardDrive size={14} strokeWidth={2} /> },
    { label: t("servers"), value: "1", icon: <Server size={14} strokeWidth={2} /> },
    { label: t("databases"), value: form.databases.toString(), icon: <Database size={14} strokeWidth={2} /> },
    { label: t("backups"), value: form.backups.toString(), icon: <Archive size={14} strokeWidth={2} /> },
    { label: t("ports"), value: form.allocations.toString(), icon: <Network size={14} strokeWidth={2} /> },
  ];

  const renderGrid = (rows: Array<{ label: string; value: string; icon: React.ReactNode }>) => (
    <div className="grid border-y border-white/[0.07] sm:grid-cols-2">
      {rows.map((resource, index, arr) => {
        const total = arr.length;
        const isLastOdd = index === total - 1 && total % 2 !== 0;
        return (
          <div
            key={resource.label}
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
      })}
    </div>
  );

  return (
    <section className="animate-in fade-in slide-in-from-right-4 duration-300">
      <h2 className="text-base font-semibold text-white">{t("summary")}</h2>
      <p className="mt-0.5 text-sm text-[#888]">{t("reviewConfig")}</p>

      <div className="mt-6 space-y-8">
        <div>
          <h2 className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500 mb-4">
            {t("generalInformation")}
          </h2>
          {renderGrid(generalRows)}
        </div>

        <div>
          <h2 className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500 mb-4">
            {t("includedResources")}
          </h2>
          {renderGrid(resourceRows)}
        </div>
      </div>
    </section>
  );
}
