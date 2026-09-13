"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import React, { useState, useEffect } from "react";
import { Copy, ExternalLink, KeyRound, Link2, Mail, RefreshCw } from "lucide-react";
import { ErrorState, DashboardButton } from "@/components/ui/ErrorState";
import { useModal } from "@/components/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import { CredentialRow } from "./CredentialRow";
import { PanelSkeleton } from "@/components/skeletons";

export function PanelContent() {
  const [panelData, setPanelData] = useState<{ email: string; panelUrl: string } | null>(null);
  const [password, setPassword] = useState("••••••••••••••••");
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modal = useModal();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const fetchPanelData = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) return;

        const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/panel`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch panel data");
        }

        const data = await res.json();
        setPanelData(data);
      } catch (err: any) {
        setError(err.message);
        if (!err.message?.toLowerCase().includes("pending")) {
          showError(err.message || "Failed to fetch panel data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPanelData();
  }, [showError]);

  const copyText = async (text: string, type: "email" | "password") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "email") {
        showSuccess("Email copied to clipboard.");
      } else {
        showSuccess("Password copied to clipboard.");
      }
    } catch {
      showError("Failed to copy to clipboard.");
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
      title: "Reset Panel Password",
      body: "Are you sure you want to reset your panel password? Your old password will stop working immediately.",
      danger: true,
      confirmText: "Reset Password",
    });

    if (!confirmed) return;

    setResetting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/panel/reset-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reset password");
      }

      const data = await res.json();
      setPassword(data.password);
      showSuccess("Password reset successfully!");
    } catch (err: any) {
      showError(err.message || 'Failed to reset password.');
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <PanelSkeleton />;

  if (error) {
    return (
      <ErrorState
        icon={
          (error.includes("Pending") || error.includes("pending")) ? (
            <RefreshCw strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px] animate-spin" />
          ) : (
            <KeyRound strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />
          )
        }
        kicker={(error.includes("Pending") || error.includes("pending")) ? "Provisioning" : "Failed to Fetch"}
        title={error}
        description={
          <p>
            {(error.includes("Pending") || error.includes("pending")) 
              ? "If you just registered, your account may still be provisioning. Please wait a moment and try refreshing the page."
              : "There was an issue retrieving your panel credentials. Please check your connection or contact support if the problem persists."}
          </p>
        }
        buttons={
          <>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
            >
              <RefreshCw className="w-[14px] h-[14px]" />
              Refresh
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
            <h1 className="text-2xl font-semibold tracking-tight text-orange-500">Control Panel</h1>
            <p className="mt-2 text-sm text-white/35">
              Manage access to your Pterodactyl control panel.
            </p>
          </div>
        </div>

        <div className="hidden gap-4 grid-cols-[minmax(250px,1fr)_1fr_120px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
          <span>Credential</span>
          <span>Value</span>
          <span className="text-right">Action</span>
        </div>

        <div className="divide-y divide-white/[0.06]">
              {/* EMAIL */}
              <CredentialRow
                icon={<Mail className="h-4 w-4" />}
                label="Email address"
                description="Your Pterodactyl login"
                value={panelData?.email || "No email linked"}
                action={
                  <button
                    type="button"
                    onClick={() => copyText(panelData?.email || "", "email")}
                    className="
                        inline-flex h-8 items-center gap-2
                        rounded-md
                        border border-[#222]
                        bg-[#1a1a1a]
                        px-3
                        text-[11px]
                        font-medium
                        text-[#888888]
                        transition
                        hover:border-[#333]
                        hover:text-[#E0E0E0]
                      "
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                }
              />

              {/* PASSWORD */}
              <CredentialRow
                icon={<KeyRound className="h-4 w-4" />}
                label="Password"
                description="Your panel authentication password"
                value={password}
                action={
                  <div className="flex items-center gap-2">
                    {password !== "••••••••••••••••" && (
                      <button
                        type="button"
                        onClick={() => copyText(password, "password")}
                        className="
                            inline-flex h-8 items-center gap-2
                            rounded-md
                            border border-[#222]
                            bg-[#1a1a1a]
                            px-3
                            text-[11px]
                            font-medium
                            text-[#888888]
                            transition
                            hover:border-[#333]
                            hover:text-[#E0E0E0]
                          "
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={resetPassword}
                      disabled={resetting}
                      className="
                          inline-flex h-8 items-center gap-2
                          rounded-md
                          border border-[#222]
                          bg-[#1a1a1a]
                          px-3
                          text-[11px]
                          font-medium
                          text-[#888888]
                          transition
                          hover:border-[#FF5722]/30
                          hover:text-[#FF5722]
                          disabled:opacity-50
                          disabled:cursor-not-allowed
                        "
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${resetting ? "animate-spin" : ""}`}
                      />
                      {resetting ? "Resetting..." : "Reset"}
                    </button>
                  </div>
                }
              />

              {/* PANEL URL */}
              <CredentialRow
                icon={<Link2 className="h-4 w-4" />}
                label="Panel URL"
                description="Open your Pterodactyl control panel"
                value={panelData?.panelUrl || "http://localhost"}
                mono
                action={
                  <button
                    type="button"
                    onClick={launchPanel}
                    disabled={!panelData?.panelUrl}
                    className="
                        inline-flex h-8 items-center gap-2
                        rounded-md
                        border border-[#FF5722]/20
                        bg-[#FF5722]/10
                        px-3
                        text-[11px]
                        font-medium
                        text-[#FF5722]
                        transition
                        hover:border-[#FF5722]/40
                        hover:bg-[#FF5722]/20
                        disabled:opacity-50
                      "
                  >
                    Launch
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                }
              />
        </div>
      </section>
    </div>
  );
}


