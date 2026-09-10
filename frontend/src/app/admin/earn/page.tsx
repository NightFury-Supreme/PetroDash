"use client";

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

  const onSaveAds = async (override?: Partial<AdminEarnSettings['ads']>) => {
    try {
      if (!form) return;
      const next = await save({ ads: { ...form.ads, ...override } });
      setForm(next);
    } catch (e: any) {
      const msg = String(e?.message || "Failed to save");
      setError(msg);
      throw e;
    }
  };

  const onSaveLinkvertise = async (override?: Partial<AdminEarnSettings['linkvertise']>) => {
    try {
      if (!form) return;
      const next = await save({ linkvertise: { ...form.linkvertise, ...override } });
      setForm(next);
    } catch (e: any) {
      const msg = String(e?.message || "Failed to save");
      setError(msg);
      throw e;
    }
  };

  const onSaveOfferwall = async (override?: Partial<AdminEarnSettings['offerwall']>) => {
    try {
      if (!form) return;
      const next = await save({ offerwall: { ...form.offerwall, ...override } });
      setForm(next);
    } catch (e: any) {
      const msg = String(e?.message || "Failed to save");
      setError(msg);
      throw e;
    }
  };

  const onSaveSurveywall = async (override?: Partial<AdminEarnSettings['surveywall']>) => {
    try {
      if (!form) return;
      const next = await save({ surveywall: { ...form.surveywall, ...override } });
      setForm(next);
    } catch (e: any) {
      const msg = String(e?.message || "Failed to save");
      setError(msg);
      throw e;
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans">
      <AdminEarnHeader />

      {error && (
        <div className="mt-4 rounded-md bg-red-500/10 p-4 border border-red-500/20">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {loading && !form ? (
        <AdminEarnSkeleton />
      ) : (
        form && (
          <AdminEarnContent 
            form={form} 
            saving={saving} 
            onChange={setField}
            onSaveAds={onSaveAds}
            onSaveLinkvertise={onSaveLinkvertise}
            onSaveOfferwall={onSaveOfferwall}
            onSaveSurveywall={onSaveSurveywall}
          />
        )
      )}
    </div>
  );
}
