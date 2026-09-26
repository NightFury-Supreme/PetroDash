"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { RESOURCE_FIELDS, ResourceInputCard } from "../ResourceInputCard";
import type { CreateFormData } from "@/hooks/server";

interface CreateServerResourcesStepProps {
  form: CreateFormData;
  remaining: Record<string, number>;
  violations: Record<string, string>;
  exceeds: Record<string, boolean>;
  updateValue: (key: keyof CreateFormData, v: number | string) => void;
}

export function CreateServerResourcesStep({
  form,
  remaining,
  violations,
  exceeds,
  updateValue,
}: CreateServerResourcesStepProps) {
  const t = useTranslations("Dashboard");

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <section>
        <h2 className="text-base font-semibold text-white">{t("serverDetails")}</h2>
        <p className="mt-0.5 text-sm text-[#888]">{t("configBasicInfo")}</p>

        <label className="mb-2 mt-5 block text-sm font-medium text-[#D4D4D4]">
          {t("serverName")} <span className="text-[#FF5722]">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => updateValue("name", e.target.value)}
          placeholder={t("enterServerName")}
          className="w-full rounded-lg border border-[#222] bg-[#161616] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60"
        />
        {violations.name && <p className="mt-1.5 text-xs text-red-400">{violations.name}</p>}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between mb-0.5">
          <h2 className="text-base font-semibold text-white">{t("resourceLimits")}</h2>
        </div>
        <p className="text-sm text-[#888]">{t("configResourceAlloc")}</p>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {RESOURCE_FIELDS.map((field) => (
            <ResourceInputCard
              key={field.key}
              field={field}
              value={form[field.key] as number}
              remaining={remaining[field.key]}
              violation={violations[field.key]}
              isExceeding={Boolean(exceeds[field.key])}
              updateValue={(k, v) => updateValue(k as keyof CreateFormData, v)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
