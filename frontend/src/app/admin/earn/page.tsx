"use client";

import Shell from "@/components/Shell";
import { useEffect, useState } from "react";
import { useModal } from "@/components/Modal";
import { useAdminEarn } from "@/hooks/admin/earn/useAdminEarn";
import { AdminEarnHeader } from "@/components/admin/earn/AdminEarnHeader";
import { AdminEarnContent } from "@/components/admin/earn/AdminEarnContent";
import { AdminEarnSkeleton } from "@/components/skeletons/admin/earn/AdminEarnSkeleton";
import type { AdminEarnSettings } from "@/hooks/admin/earn/useAdminEarn";

export default function AdminEarnPage() {
  const modal = useModal();
  const { settings, loading, saving, error, setError, save } = useAdminEarn();

  const [form, setForm] = useState<AdminEarnSettings | null>(null);

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

  const onToggleEnabled = async (nextEnabled: boolean) => {
    try {
      const next = await save({ enabled: nextEnabled });
      setForm(next);
    } catch (e: any) {
      const msg = String(e?.message || "Failed to save");
      setError(msg);
      setForm((prev) => (prev ? { ...(prev as any), enabled: !nextEnabled } : prev));
      await modal.error({ title: "Save Error", body: msg });
    }
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
      <Shell>
        <div className="p-6">
          <AdminEarnSkeleton />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="p-4 sm:p-6 space-y-6" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <AdminEarnHeader />
        {form && (
          <AdminEarnContent
            form={form}
            saving={saving}
            onChange={setField}
            onToggleEnabled={onToggleEnabled}
            onSaveAds={onSaveAds}
            onSaveLinkvertise={onSaveLinkvertise}
          />
        )}
      </div>
    </Shell>
  );
}
