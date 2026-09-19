"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Copy, ExternalLink, KeyRound, Link2, Mail, RefreshCw } from "lucide-react";
import { ErrorState, DashboardButton } from "@/components/ui/ErrorState";
import { useModal } from "@/components/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import { CredentialRow } from "./CredentialRow";
import { PanelSkeleton } from "@/components/skeletons";
import { usePanel } from "./hooks/usePanel";

export function PanelContent() {
  const t = useTranslations("Panel");
  const { showSuccess, showError } = useToast();
  const modal = useModal();
  
  const {
    panelData,
    password,
    loading,
    error,
    resetting,
    resetPassword: hookResetPassword
  } = usePanel();

  const copyText = async (text: string, type: "email" | "password") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "email") {
        showSuccess(t("emailCopied"));
      } else {
        showSuccess(t("passwordCopied"));
      }
    } catch {
      showError(t("failedToCopy"));
    }
  };

  const launchPanel = () => {
    if (panelData?.panelUrl) {
      window.open(panelData.panelUrl, "_blank", "noopener,noreferrer");
    }
  };

  const resetPassword = async () => {
    if (resetting) return;

    const confirmed = await modal.confirm({
      title: t("resetPanelPasswordTitle"),
      body: t("resetPanelPasswordBody"),
      danger: true,
      confirmText: t("resetPasswordConfirm"),
    });

    if (!confirmed) return;

    try {
      await hookResetPassword();
      showSuccess(t("passwordResetSuccess"));
    } catch (err: any) {
      showError(err.message || t("failedToCopy")); // Fallback if no error message
    }
  };

  if (loading) return <PanelSkeleton />;

  if (error) {
    const isPending = error.toLowerCase().includes("pending");
    return (
      <ErrorState
        icon={
          isPending ? (
            <RefreshCw strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px] animate-spin" />
          ) : (
            <KeyRound strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />
          )
        }
        kicker={isPending ? t("provisioning") : t("failedToFetch")}
        title={error}
        description={
          <p>
            {isPending ? t("provisioningDesc") : t("fetchErrorDesc")}
          </p>
        }
        buttons={
          <>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
            >
              <RefreshCw className="w-[14px] h-[14px]" />
              {t("refresh")}
            </button>
            <DashboardButton variant="secondary" />
          </>
        }
      />
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-orange-500">{t("controlPanel")}</h1>
            <p className="mt-2 text-sm text-white/35">
              {t("controlPanelDesc")}
            </p>
          </div>
        </div>

        <div className="hidden gap-4 grid-cols-[minmax(250px,1fr)_1fr_120px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
          <span>{t("colCredential")}</span>
          <span>{t("colValue")}</span>
          <span className="text-right">{t("colAction")}</span>
        </div>

        <div className="divide-y divide-white/[0.06]">
              {/* EMAIL */}
              <CredentialRow
                icon={<Mail className="h-4 w-4" />}
                label={t("emailAddress")}
                description={t("emailAddressDesc")}
                value={panelData?.email || t("noEmailLinked")}
                action={
                  <button
                    type="button"
                    onClick={() => copyText(panelData?.email || "", "email")}
                    className="inline-flex h-8 items-center gap-2 rounded-md border border-[#222] bg-[#1a1a1a] px-3 text-[11px] font-medium text-[#888888] transition hover:border-[#333] hover:text-[#E0E0E0]"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {t("copy")}
                  </button>
                }
              />

              {/* PASSWORD */}
              <CredentialRow
                icon={<KeyRound className="h-4 w-4" />}
                label={t("password")}
                description={t("passwordDesc")}
                value={password}
                action={
                  <div className="flex items-center gap-2">
                    {password !== "••••••••••••••••" && (
                      <button
                        type="button"
                        onClick={() => copyText(password, "password")}
                        className="inline-flex h-8 items-center gap-2 rounded-md border border-[#222] bg-[#1a1a1a] px-3 text-[11px] font-medium text-[#888888] transition hover:border-[#333] hover:text-[#E0E0E0]"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {t("copy")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={resetPassword}
                      disabled={resetting}
                      className="inline-flex h-8 items-center gap-2 rounded-md border border-[#222] bg-[#1a1a1a] px-3 text-[11px] font-medium text-[#888888] transition hover:border-[#FF5722]/30 hover:text-[#FF5722] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${resetting ? "animate-spin" : ""}`} />
                      {resetting ? t("resetting") : t("reset")}
                    </button>
                  </div>
                }
              />

              {/* PANEL URL */}
              <CredentialRow
                icon={<Link2 className="h-4 w-4" />}
                label={t("panelUrl")}
                description={t("panelUrlDesc")}
                value={panelData?.panelUrl || "http://localhost"}
                mono
                action={
                  <button
                    type="button"
                    onClick={launchPanel}
                    disabled={!panelData?.panelUrl}
                    className="inline-flex h-8 items-center gap-2 rounded-md border border-[#FF5722]/20 bg-[#FF5722]/10 px-3 text-[11px] font-medium text-[#FF5722] transition hover:border-[#FF5722]/40 hover:bg-[#FF5722]/20 disabled:opacity-50"
                  >
                    {t("launch")}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                }
              />
        </div>
      </section>
    </div>
  );
}


