import React from 'react';
import { EarnMethodCard } from "./EarnMethodCard";
import { Link as LinkIcon } from "lucide-react";

interface EarnListProps {
  canShow: boolean;
  data: any;
  showLinkvertise: boolean;
  starting: string | null;
  onStart: (method: "ads" | "linkvertise" | "offerwall" | "surveywall") => void;
}

export function EarnList({ canShow, data, showLinkvertise, starting, onStart }: EarnListProps) {
  const cols = "lg:grid-cols-[2fr_100px_100px_120px_150px]";

  if (!canShow) {
    return (
      <div className="bg-[#181818] border border-[#2a2a2a] rounded-2xl p-6">
        <div className="text-white font-semibold">Earn is currently disabled</div>
        <div className="text-[#AAAAAA] text-sm mt-1">Ask an admin to enable earning methods.</div>
      </div>
    );
  }

  if (canShow && data?.config && data?.status) {
    return (
      <div className="w-full">
        {/* TABLE HEADER (Desktop) */}
        <div className={`hidden gap-4 lg:grid ${cols} border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30`}>
          <span>Method</span>
          <span>Reward</span>
          <span>Daily Limit</span>
          <span>Cooldown</span>
          <span className="text-right">Action</span>
        </div>

        {/* TABLE LIST */}
        <div className="divide-y divide-white/[0.06]">
          {!showLinkvertise && (
            <div className="py-12 text-center">
              <div className="text-white font-semibold">No earning methods enabled</div>
              <div className="text-[#AAAAAA] text-sm mt-1">Ask an admin to enable at least one earning method.</div>
            </div>
          )}

          {showLinkvertise && (
            <EarnMethodCard
              method="linkvertise"
              title="Linkvertise"
              icon={<LinkIcon size={20} />}
              config={data.config.linkvertise}
              status={data.status.linkvertise}
              starting={starting === "linkvertise"}
              onStart={() => onStart("linkvertise")}
              cols={cols}
            />
          )}
        </div>
      </div>
    );
  }

  return null;
}
