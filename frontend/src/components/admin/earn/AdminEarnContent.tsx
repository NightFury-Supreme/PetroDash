"use client";

import { useState } from "react";
import type { AdminEarnSettings } from "@/hooks/admin/earn/useAdminEarn";
import { EarnMethodRow } from "./EarnMethodRow";
import { AdsConfigDrawer } from "./drawers/AdsConfigDrawer";
import { LinkvertiseConfigDrawer } from "./drawers/LinkvertiseConfigDrawer";
import { AyetWallDrawer } from "./drawers/AyetWallDrawer";

export function AdminEarnContent({
  form, saving, onChange, onSaveAds, onSaveLinkvertise, onSaveOfferwall, onSaveSurveywall
}: {
  form: AdminEarnSettings; saving: boolean;
  onChange: (path: string, value: any) => void;
  onSaveAds: (override?: { enabled: boolean }) => Promise<void>; 
  onSaveLinkvertise: (override?: { enabled: boolean }) => Promise<void>;
  onSaveOfferwall: (override?: { enabled: boolean }) => Promise<void>;
  onSaveSurveywall: (override?: { enabled: boolean }) => Promise<void>;
}) {
  const [editing, setEditing] = useState<"ads" | "linkvertise" | "offerwall" | "surveywall" | null>(null);
  const cols = "lg:grid-cols-[1.5fr_2fr_100px_100px_100px_80px]";

  return (
    <div className="mt-8">
      <div className="w-full">
        {/* TABLE HEADER (Desktop) */}
        <div className={`hidden gap-4 lg:grid ${cols} border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30`}>
          <span>Method</span>
          <span>Description</span>
          <span>Reward</span>
          <span>Daily Limit</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {/* TABLE LIST */}
        <div className="divide-y divide-[#222]">
          <EarnMethodRow
            methodName="Watch Ads"
            methodSubtitle="ayeT Studios"
            description="Proof-based rewarded video via ayeT callbacks."
            rewardStr={`${form.ads?.coins || 0} coins`}
            limitStr={`${form.ads?.maxClaimsPerDay || 0} claims`}
            enabled={form.ads?.enabled || false}
            cols={cols}
            onEdit={() => setEditing("ads")}
          />

          <EarnMethodRow
            methodName="Linkvertise"
            methodSubtitle="Shortlinks"
            description="Link tasks with anti-bypass protection."
            rewardStr={`${form.linkvertise?.coins || 0} coins`}
            limitStr={`${form.linkvertise?.maxClaimsPerDay || 0} claims`}
            enabled={form.linkvertise?.enabled || false}
            cols={cols}
            onEdit={() => setEditing("linkvertise")}
          />

          <EarnMethodRow
            methodName="Offerwall"
            methodSubtitle="ayeT Studios"
            description="High-paying tasks, surveys, and app installs."
            rewardStr="Dynamic"
            limitStr="Unlimited"
            enabled={form.offerwall?.enabled || false}
            cols={cols}
            onEdit={() => setEditing("offerwall")}
          />

          <EarnMethodRow
            methodName="Surveywall"
            methodSubtitle="ayeT Studios"
            description="Targeted surveys with dynamic rewards."
            rewardStr="Dynamic"
            limitStr="Unlimited"
            enabled={form.surveywall?.enabled || false}
            cols={cols}
            onEdit={() => setEditing("surveywall")}
          />
        </div>
      </div>

      <AdsConfigDrawer
        isOpen={editing === "ads"}
        onClose={() => setEditing(null)}
        form={form}
        saving={saving}
        onChange={onChange}
        onSaveAds={onSaveAds}
      />

      <LinkvertiseConfigDrawer
        isOpen={editing === "linkvertise"}
        onClose={() => setEditing(null)}
        form={form}
        saving={saving}
        onChange={onChange}
        onSaveLinkvertise={onSaveLinkvertise}
      />

      <AyetWallDrawer
        type="offerwall"
        isOpen={editing === "offerwall"}
        onClose={() => setEditing(null)}
        form={form}
        saving={saving}
        onChange={onChange}
        onSave={onSaveOfferwall}
      />

      <AyetWallDrawer
        type="surveywall"
        isOpen={editing === "surveywall"}
        onClose={() => setEditing(null)}
        form={form}
        saving={saving}
        onChange={onChange}
        onSave={onSaveSurveywall}
      />
    </div>
  );
}
