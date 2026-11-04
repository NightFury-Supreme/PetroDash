"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

interface UnreachableServerCardProps {
  serverId: string;
  serverName: string;
  className?: string;
}

export function UnreachableServerCard({
  serverId,
  serverName,
  className = "",
}: UnreachableServerCardProps) {
  const t = useTranslations("Dashboard");

  return (
    <div className={`bg-[#202020] border border-[#303030] rounded-2xl p-6 h-full flex flex-col ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white truncate">{serverName}</h3>
      </div>
      
      <div className="text-center flex-1 flex flex-col justify-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-[#1a1a1a] rounded-full flex items-center justify-center">
          <AlertTriangle className="text-[#AAAAAA] w-8 h-8" />
        </div>
        <h4 className="text-[#AAAAAA] font-medium mb-2">{t("serverUnreachable")}</h4>
        <p className="text-[#AAAAAA] text-sm mb-4">{t("serverUnreachableDesc")}</p>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3">
          <p className="text-white font-mono text-sm">{t("serverId")}: {serverId}</p>
        </div>
      </div>
    </div>
  );
}

export default UnreachableServerCard;
