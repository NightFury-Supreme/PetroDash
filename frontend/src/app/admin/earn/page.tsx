"use client";

import { useEffect, useState } from "react";
import { useModal } from "@/components/Modal";
import { useAdminEarn } from "@/hooks/admin/earn/useAdminEarn";
import { AdminEarnHeader } from "@/components/admin/earn/AdminEarnHeader";
import { AdminEarnContent } from "@/components/admin/earn/AdminEarnContent";
import { AdminEarnSkeleton } from "@/components/skeletons/admin/earn/AdminEarnSkeleton";
import type { AdminEarnSettings } from "@/hooks/admin/earn/useAdminEarn";
import { PlayCircle, Link2 } from "lucide-react";

type EarnMethod = "ads" | "linkvertise";

function NavItem({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2
        text-left text-sm transition-colors focus-visible:outline-none
        focus-visible:ring-1 focus-visible:ring-white/30
        ${active ? "bg-white/10 text-white" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"}
      `}
    >
      {Icon && <Icon size={17} strokeWidth={1.75} className="shrink-0" />}
      <span className="truncate flex-1">{children}</span>
    </button>
  );
}

export default function AdminEarnPage() {
  const modal = useModal();
  const { settings, loading, saving, error, setError, save } = useAdminEarn();
  const [form, setForm] = useState<AdminEarnSettings | null>(null);
  const [activeMethod, setActiveMethod] = useState<EarnMethod>("ads");

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  useEffect(() => {
    if (!error) return;
    (async () => {
      try {
        await modal.error({ title: "Error", body: error });
      // eslint-disable-next-line unused-imports/no-unused-vars
      } catch (_) {
      } finally {
        setError(null);
      }
    })();
  }, [error, modal, setError]);

  const setField = (path: string, value: any) => {
    setForm((prev) => {
      if (!prev) return prev;
      const next: any = { ...(prev as any) };
      const parts = path.split(".");
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        cur[p] = { ...(cur[p] || {}) };
        cur = cur[p];
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const onSaveAds = async () => {
    try {
      if (!form) return;
      const next = await save({ ads: form.ads });
      setForm(next);
      await modal.success({ title: "Saved", body: "Watch Ads settings updated." });
    } catch (e: any) {
      const msg = String(e?.message || "Failed to save");
      setError(msg);
      await modal.error({ title: "Save Error", body: msg });
    }
  };

  const onSaveLinkvertise = async () => {
    try {
      if (!form) return;
      const next = await save({ linkvertise: form.linkvertise });
      setForm(next);
      await modal.success({ title: "Saved", body: "Linkvertise settings updated." });
    } catch (e: any) {
      const msg = String(e?.message || "Failed to save");
      setError(msg);
      await modal.error({ title: "Save Error", body: msg });
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
        <AdminEarnSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans">
      <div className="flex flex-col h-full space-y-6">

        {/* Header */}
        <AdminEarnHeader />

        {/* Layout: sidebar + content */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Vertical sidebar nav */}
          <aside className="w-full lg:w-48 shrink-0 pt-1">
            <nav className="space-y-1">
              <NavItem
                active={activeMethod === "ads"}
                onClick={() => setActiveMethod("ads")}
                icon={PlayCircle}
              >
                Watch Ads
              </NavItem>
              <NavItem
                active={activeMethod === "linkvertise"}
                onClick={() => setActiveMethod("linkvertise")}
                icon={Link2}
              >
                Linkvertise
              </NavItem>
            </nav>

            <div className="mt-8 border-t border-[#333] pt-6">
              <p className="text-xs text-[#666]">
                Select a method to configure its earning behavior.
              </p>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {form && (
              <AdminEarnContent
                form={form}
                saving={saving}
                onChange={setField}
                onSaveAds={onSaveAds}
                onSaveLinkvertise={onSaveLinkvertise}
                activeMethod={activeMethod}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
