"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Box, Server, Crown, Check, Lock } from "lucide-react";
import { SafeImage } from "@/components/ui";
import type { EggOption } from "@/hooks/server";

interface CreateServerSoftwareStepProps {
  groupedEggs: Record<string, EggOption[]>;
  selectedEggId: string;
  violations: Record<string, string>;
  onSelectEgg: (eggId: string) => void;
}

export function CreateServerSoftwareStep({
  groupedEggs,
  selectedEggId,
  violations,
  onSelectEgg,
}: CreateServerSoftwareStepProps) {
  const t = useTranslations("Dashboard");

  return (
    <section className="animate-in fade-in slide-in-from-right-4 duration-300">
      <h2 className="text-base font-semibold text-white">{t("software")}</h2>
      <p className="mt-0.5 text-sm text-[#888]">{t("selectSoftware")}</p>
      <div className="mt-5 space-y-6">
        {Object.entries(groupedEggs).map(([category, categoryEggs]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-medium text-white px-2">{category}</h3>
            <div className="border-t border-white/[0.06] divide-y divide-white/[0.06]">
              {categoryEggs.map((egg) => {
                const isAllowed = Boolean(egg.isPlanAllowed);
                const selected = isAllowed && selectedEggId === egg.id;
                return (
                  <button
                    type="button"
                    key={egg.id}
                    onClick={() => isAllowed && onSelectEgg(egg.id)}
                    disabled={!isAllowed}
                    className={`w-full flex items-center justify-between py-3 px-2 group transition-colors ${
                      !isAllowed ? "cursor-not-allowed opacity-50" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 flex items-center justify-center shrink-0 relative ${
                          !isAllowed ? "opacity-40 grayscale" : ""
                        }`}
                      >
                        <SafeImage
                          src={
                            egg.icon
                              ? egg.icon.startsWith("http")
                                ? egg.icon
                                : `${process.env.NEXT_PUBLIC_API_BASE || ""}${egg.icon.startsWith("/") ? "" : "/"}${egg.icon}`
                              : null
                          }
                          alt=""
                          className="w-full h-full object-contain"
                          fallback={<Box className="text-[#888] m-auto" size={18} />}
                        />
                      </div>
                      <div className="text-left flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-sm font-medium transition-colors ${
                              !isAllowed ? "text-zinc-500" : "text-[#E0E0E0] group-hover:text-white"
                            }`}
                          >
                            {egg.name}
                          </h3>
                          {egg.allowedPlanNames && egg.allowedPlanNames.length > 0 && (
                            <div
                              title={t('requiresPlan', { plans: egg.allowedPlanNames.join(", ") })}
                              className="text-yellow-400 cursor-help drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"
                            >
                              <Crown size={14} fill="currentColor" />
                            </div>
                          )}
                          {egg.recommended && (
                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${
                                !isAllowed
                                  ? "bg-emerald-500/5 text-emerald-500/50"
                                  : "bg-emerald-500/10 text-emerald-500"
                              }`}
                            >
                              {t("recommended")}
                            </span>
                          )}
                        </div>
                        <div
                          className={`flex flex-col gap-1.5 text-[11px] ${
                            !isAllowed ? "text-zinc-600" : "text-[#888]"
                          }`}
                        >
                          <p className="line-clamp-2 leading-snug">{egg.description}</p>
                          {typeof egg.serverCount === "number" && egg.serverCount > 0 && (
                            <span className="flex items-center gap-1 text-zinc-400">
                              <Server size={10} />
                              {egg.serverCount} {egg.serverCount === 1 ? t("server") : t("servers")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pl-4 shrink-0">
                      {!isAllowed ? (
                        <div className="w-5 h-5 rounded flex items-center justify-center bg-white/[0.04] text-zinc-500">
                          <Lock size={12} />
                        </div>
                      ) : (
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            selected
                              ? "border-[#FF5722] bg-[#FF5722]"
                              : "border-white/20 group-hover:border-white/40 bg-transparent"
                          }`}
                        >
                          {selected && <Check size={10} className="text-white" strokeWidth={3} />}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {violations.eggId && <p className="mt-2 text-xs text-red-400">{violations.eggId}</p>}
    </section>
  );
}
