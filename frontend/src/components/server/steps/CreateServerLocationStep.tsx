"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Globe, Crown, Activity, Server, Check } from "lucide-react";
import type { LocationOption } from "@/hooks/server";

interface CreateServerLocationStepProps {
  locations: LocationOption[];
  selectedLocationId: string;
  violations: Record<string, string>;
  onSelectLocation: (locationId: string) => void;
}

export function CreateServerLocationStep({
  locations,
  selectedLocationId,
  violations,
  onSelectLocation,
}: CreateServerLocationStepProps) {
  const t = useTranslations("Dashboard");

  return (
    <section className="animate-in fade-in slide-in-from-right-4 duration-300">
      <h2 className="text-base font-semibold text-white">{t("location")}</h2>
      <p className="mt-0.5 text-sm text-[#888]">{t("selectDeploymentLoc")}</p>

      <div className="mt-5 border-t border-white/[0.06] divide-y divide-white/[0.06]">
        {locations.map((loc) => {
          const selected = selectedLocationId === loc._id;
          const flagSource = loc.flag || loc.flagUrl;
          return (
            <button
              type="button"
              key={loc._id}
              onClick={() => loc.isPlanAllowed && onSelectLocation(loc._id)}
              disabled={!loc.isPlanAllowed}
              className={`w-full flex items-center justify-between py-3 px-2 group transition-colors ${
                !loc.isPlanAllowed ? "cursor-not-allowed" : "hover:bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 flex items-center justify-center shrink-0 relative ${
                    !loc.isPlanAllowed ? "opacity-40 grayscale" : ""
                  }`}
                >
                  {flagSource ? (
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
                  ) : null}
                  <Globe
                    className="text-[#888] absolute inset-0 m-auto"
                    size={18}
                    style={{ display: flagSource ? "none" : "block" }}
                  />
                </div>
                <div className="text-left flex flex-col items-start gap-0.5">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm font-medium transition-colors ${
                        !loc.isPlanAllowed ? "text-zinc-500" : "text-[#E0E0E0] group-hover:text-white"
                      }`}
                    >
                      {loc.name}
                    </h3>
                    {loc.allowedPlanNames && loc.allowedPlanNames.length > 0 && (
                      <div
                        title={`Requires plan: ${loc.allowedPlanNames.join(", ")}`}
                        className="text-yellow-400 cursor-help drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"
                      >
                        <Crown size={14} fill="currentColor" />
                      </div>
                    )}
                  </div>
                  {(loc.description || loc.shortCode) && (
                    <p className={`text-[11px] ${!loc.isPlanAllowed ? "text-zinc-600" : "text-[#888]"}`}>
                      {loc.description
                        ? loc.description.length > 60
                          ? loc.description.slice(0, 60) + "..."
                          : loc.description
                        : loc.shortCode}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 pl-4 shrink-0">
                <div className={`flex flex-col items-end gap-1 text-xs ${!loc.isPlanAllowed ? "opacity-40 grayscale" : ""}`}>
                  {typeof loc.ping === "number" && (
                    <div
                      className={`flex items-center gap-1.5 font-medium ${
                        loc.ping < 100
                          ? "text-green-400"
                          : loc.ping < 200
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      <Activity size={12} />
                      {loc.ping}ms
                    </div>
                  )}
                  {typeof loc.serverCount === "number" && (
                    <div className="text-[#888] flex items-center gap-1.5">
                      <Server size={12} className="opacity-70" />
                      <span>
                        {loc.serverCount}
                        {loc.serverLimit ? ` / ${loc.serverLimit}` : ""} {t("servers")}
                      </span>
                    </div>
                  )}
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    selected
                      ? "border-[#FF5722] bg-[#FF5722]"
                      : "border-white/20 group-hover:border-white/40 bg-transparent"
                  }`}
                >
                  {selected && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {violations.locationId && <p className="mt-2 text-xs text-red-400">{violations.locationId}</p>}
    </section>
  );
}
