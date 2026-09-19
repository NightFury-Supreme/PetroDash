import React from 'react';
import { EarnMethodCard } from "./EarnMethodCard";
import { Link as LinkIcon, Coins } from "lucide-react";
import { ErrorState, DashboardButton, GoBackButton } from "@/components/ui/ErrorState";

interface EarnListProps {
  canShow: boolean;
  data: any;
  showLinkvertise: boolean;
  starting: string | null;
  onStart: (method: "linkvertise") => void;
}

export function EarnList({ canShow, data, showLinkvertise, starting, onStart }: EarnListProps) {
  const cols = "lg:grid-cols-[2fr_100px_100px_120px_150px]";

  if (!canShow) {
    return (
      <ErrorState
        icon={<Coins strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
        kicker="Not Available"
        title="Earn is Disabled"
        description={<p>Earning methods are currently disabled globally. Ask an administrator to enable earning methods to start collecting coins.</p>}
        buttons={<><DashboardButton /><GoBackButton /></>}
      />
    );
  }

  if (canShow && data?.config && data?.status) {
    if (!showLinkvertise) {
      return (
        <ErrorState
          icon={<Coins strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker="Empty"
          title="No Methods Available"
          description={<p>There are currently no active earning methods enabled on the platform. Please check back later.</p>}
          buttons={<><DashboardButton /><GoBackButton /></>}
        />
      );
    }

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
