"use client";

import React from "react";
import { PauseCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ServerInfo } from "../../dashboard/types";

interface SuspendedServerCardProps {
  server: ServerInfo;
}

export function SuspendedServerCard({ server }: SuspendedServerCardProps) {
  const t = useTranslations("Dashboard");
  const serverId = server._id;

  return (
    <div className="bg-[#202020] border border-[#303030] rounded-2xl p-6 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white truncate">{server.name}</h3>
      </div>
      
      <div className="text-center flex-1 flex flex-col justify-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-[#1a1a1a] rounded-full flex items-center justify-center">
          <PauseCircle className="text-[#AAAAAA] w-8 h-8" />
        </div>
        <h4 className="text-[#AAAAAA] font-medium mb-2">{t("serverSuspended")}</h4>
        <p className="text-[#AAAAAA] text-sm mb-4">{t("serverSuspendedDesc")}</p>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3">
          <p className="text-white font-mono text-sm">{t("serverId")}: {serverId}</p>
        </div>
      </div>
    </div>
  );
}

export default SuspendedServerCard;
