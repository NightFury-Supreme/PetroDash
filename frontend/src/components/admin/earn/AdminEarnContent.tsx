"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { AdminEarnSettings } from "@/hooks/admin/earn/useAdminEarn";
import { EarnMethodRow } from "./EarnMethodRow";
import { LinkvertiseConfigDrawer } from "./drawers/LinkvertiseConfigDrawer";

import { Link as LinkIcon } from "lucide-react";

export function AdminEarnContent({
  form, saving, onChange, onSaveLinkvertise
}: {
  form: AdminEarnSettings; saving: boolean;
  onChange: (path: string, value: any) => void;
  onSaveLinkvertise: (override?: { enabled: boolean }) => Promise<void>;
}) {
  const t = useTranslations('AdminEarn');
  const tCommon = useTranslations('Common');
  const [editing, setEditing] = useState<"linkvertise" | null>(null);
  const cols = "lg:grid-cols-[1.5fr_2fr_100px_100px_100px_80px]";

  return (
    <div className="mt-8">
      <div className="w-full">
        {/* TABLE HEADER (Desktop) */}
        <div className={`hidden gap-4 lg:grid ${cols} border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30`}>
          <span>{tCommon('method')}</span>
          <span>{tCommon('description')}</span>
          <span>{tCommon('reward')}</span>
          <span>{tCommon('dailyLimit')}</span>
          <span>{tCommon('status')}</span>
          <span className="text-right">{tCommon('actions')}</span>
        </div>

        {/* TABLE LIST */}
        <div className="divide-y divide-[#222]">
          <EarnMethodRow
            methodName="Linkvertise"
            methodSubtitle={t('shortlinksSubtitle')}
            icon={<LinkIcon size={18} />}
            description={t('linkvertiseDesc')}
            rewardStr={`${form.linkvertise?.coins || 0} ${tCommon('coins')}`}
            limitStr={`${form.linkvertise?.maxClaimsPerDay || 0} ${tCommon('claims')}`}
            enabled={form.linkvertise?.enabled || false}
            cols={cols}
            onEdit={() => setEditing("linkvertise")}
          />
        </div>
      </div>

      <LinkvertiseConfigDrawer
        isOpen={editing === "linkvertise"}
        onClose={() => setEditing(null)}
        form={form}
        saving={saving}
        onChange={onChange}
        onSaveLinkvertise={onSaveLinkvertise}
      />
    </div>
  );
}
