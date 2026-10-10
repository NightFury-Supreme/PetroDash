"use client";

import { useEffect, useState } from "react";
import { Coins, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { useAdminEarn } from "@/hooks/admin/earn/useAdminEarn";
import { AdminEarnHeader } from "@/components/admin/earn/AdminEarnHeader";
import { AdminEarnContent } from "@/components/admin/earn/AdminEarnContent";
import { AdminEarnSkeleton } from "@/components/skeletons/admin/earn/AdminEarnSkeleton";
import { ErrorState, DashboardButton, ErrorDescription } from "@/components/ui/ErrorState";
import type { AdminEarnSettings } from "@/hooks/admin/earn/useAdminEarn";

export default function AdminEarnPage() {
  const { showError } = useToast();
  const { settings, loading, saving, error, setError, save } = useAdminEarn();
  const [form, setForm] = useState<AdminEarnSettings | null>(null);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  useEffect(() => {
    if (!error) return;
    (async () => {
      try {
        showError(error);
      // eslint-disable-next-line unused-imports/no-unused-vars
      } catch (_) {
      } finally {
        setError(null);
      }
    })();
  }, [error, showError, setError]);

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



  if (error) {
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<Coins strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker="Load Error"
          title="Failed to Load Earn Settings"
          errorString={error}
          description={<ErrorDescription error={error} topic="Earn Settings" />}
          buttons={
            <>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              >
                <RefreshCw className="w-[14px] h-[14px]" />
                Retry
              </button>
              <DashboardButton variant="secondary" />
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans">
      <AdminEarnHeader />

      {loading && !form ? (
        <AdminEarnSkeleton />
      ) : (
        form && (
          <AdminEarnContent 
            form={form} 
            saving={saving} 
            onChange={setField}
            onSaveLinkvertise={onSaveLinkvertise}
          />
        )
      )}
    </div>
  );
}
