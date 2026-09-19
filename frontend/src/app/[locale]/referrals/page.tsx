"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Pagination } from "@/components/Pagination";
import {
  Users,
  Coins,
  Link2,
  Copy,
  Check,
  Pencil,
  Lock,
  CheckCircle2,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { SummaryItem } from "@/components/referrals/SummaryItem";
import { ReferralRow } from "@/components/referrals/ReferralRow";
import ReferralsSkeleton from "@/components/skeletons/referrals/ReferralsSkeleton";
import { ReferralUser } from "@/components/referrals/types";
import { useToast } from "@/components/ui/ToastProvider";

const USERS_PER_PAGE = 5;

/* --------------------------------------------------------------------------
   PAGE
-------------------------------------------------------------------------- */

export default function ReferralsPage() {
  const t = useTranslations("Referrals");
  const [copied, setCopied] = React.useState(false);
  const [page, setPage] = React.useState(1);

  const [meLoading, setMeLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<ReferralUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);

  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [customCodeUnlocked, setCustomCodeUnlocked] = useState(false);
  const [referralThreshold, setReferralThreshold] = useState(10);
  const [successfulReferrals, setSuccessfulReferrals] = useState(0);
  const [referrerCoins, setReferrerCoins] = useState(50);

  const [editingCode, setEditingCode] = React.useState(false);
  const [draftCode, setDraftCode] = React.useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const { showError, showSuccess } = useToast();

  /* -----------------------------------------------------------------------
     FETCH ME
  ----------------------------------------------------------------------- */

  const fetchMe = useCallback(async () => {
    try {
      setMeLoading(true);
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/referrals/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTotalCoins(data.coinsEarned);
        setReferralCode(data.code);
        setDraftCode(data.code);
        setReferralLink(data.link);
        setCustomCodeUnlocked(data.canCustomize);
        setReferralThreshold(data.minInvites);
        setSuccessfulReferrals(data.referredCount);
        setReferrerCoins(data.referrerCoins || 50);
      } else {
        throw new Error(t("failedToLoadStats"));
      }
    } catch (err: any) {
      showError(err.message || t("unexpectedError"));
    } finally {
      setMeLoading(false);
    }
  }, [t, showError]);

  /* -----------------------------------------------------------------------
     FETCH USERS
  ----------------------------------------------------------------------- */

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      const res = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_BASE || ""}/api/referrals/list?page=${page}&limit=${USERS_PER_PAGE}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalUsers(data.total);
      } else {
        throw new Error(t("failedToLoadUsers"));
      }
    } catch (err: any) {
      showError(err.message || t("unexpectedError"));
    } finally {
      setLoading(false);
    }
  }, [page, t, showError]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(totalUsers / USERS_PER_PAGE));

  /* -----------------------------------------------------------------------
     COPY
  ----------------------------------------------------------------------- */

  function handleCopy() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    showSuccess(t("copiedToClipboard"));
    setTimeout(() => setCopied(false), 2000);
  }

  /* -----------------------------------------------------------------------
     EDIT CODE
  ----------------------------------------------------------------------- */

  function startEditingCode() {
    if (!customCodeUnlocked) return;
    setDraftCode(referralCode);
    setEditingCode(true);
  }

  function cancelEditingCode() {
    setDraftCode(referralCode);
    setEditingCode(false);
    setSaveStatus("idle");
  }

  async function saveReferralCode() {
    const normalized = draftCode
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-_]/g, "");

    if (!normalized) return;

    setSaveStatus("loading");
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/referrals/code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: normalized }),
      });
      const data = await res.json();
      if (res.ok) {
        setReferralCode(data.code);
        setDraftCode(data.code);
        setReferralLink(referralLink.replace(/[^/]+$/, data.code));
        showSuccess(t("codeUpdatedSuccess"));
        setEditingCode(false);
      } else {
        let errorMsg = data.error || t("failedToUpdateCode");
        if (data.details?.fieldErrors) {
          const fields = Object.keys(data.details.fieldErrors);
          if (fields.length > 0) {
            errorMsg = data.details.fieldErrors[fields[0]][0];
          }
        }
        showError(errorMsg);
      }
    } catch {
      showError(t("unexpectedError"));
    } finally {
      setSaveStatus("idle");
    }
  }

  if (meLoading) return <ReferralsSkeleton />;

  return (
    <div className="p-4 sm:p-6 bg-[#0f0f0f] min-h-screen text-white">
      <div className="flex flex-col h-full space-y-6">

        {/* ================================================================
            HEADER
        ================================================================ */}

        <header>
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-orange-500">
                  {t("title")}
                </h1>
              </div>
              <p className="mt-2 text-sm text-white/35">
                {t("subtitle", { coins: referrerCoins })}
              </p>
            </div>
          </div>
        </header>

        {/* ================================================================
            SUMMARY
        ================================================================ */}

        <section className="grid grid-cols-1 border-y border-white/[0.07] sm:grid-cols-3">
          <SummaryItem
            icon={<Users size={16} />}
            label={t("usersReferred")}
            value={totalUsers}
            suffix={t("suffixUsers")}
          />
          <SummaryItem
            icon={<Coins size={16} />}
            label={t("coinsEarned")}
            value={totalCoins}
            suffix={t("suffixCoins")}
          />
          <SummaryItem
            icon={<CheckCircle2 size={16} />}
            label={t("successful")}
            value={successfulReferrals}
            suffix={t("suffixRewards")}
          />
        </section>

        {/* ================================================================
            REFERRAL LINK
        ================================================================ */}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/25">
                {t("yourReferralLink")}
              </p>
              <p className="mt-1 text-xs text-white/20">
                {t("shareWithFriends")}
              </p>
            </div>
            <Link2 size={15} className="text-white/20" />
          </div>

          <div className="flex overflow-hidden rounded-lg border border-white/[0.08] bg-[#141414]">
            <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
              <Link2 size={15} className="shrink-0 text-orange-400/70" />
              <span className="truncate text-sm text-white">
                {referralLink}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? t("copied") : t("copy")}
              className="flex h-12 shrink-0 items-center gap-2 border-l border-white/[0.07] px-5 text-xs font-medium transition hover:bg-white/[0.04]"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-400">{t("copied")}</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="text-white/45" />
                  <span className="text-white/55">{t("copy")}</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* ================================================================
            CUSTOM REFERRAL CODE
        ================================================================ */}

        <section className="border-t border-white/[0.07] pt-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  customCodeUnlocked
                    ? "bg-orange-500/[0.07]"
                    : "bg-white/[0.04]"
                }`}
              >
                {customCodeUnlocked ? (
                  <Pencil size={16} className="text-orange-400" />
                ) : (
                  <Lock size={16} className="text-white/25" />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold">
                    {t("customCode")}
                  </h2>
                  {customCodeUnlocked && (
                    <span className="rounded-full bg-orange-500/[0.08] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-orange-400">
                      {t("unlocked")}
                    </span>
                  )}
                </div>

                {customCodeUnlocked ? (
                  <p className="mt-1 text-xs text-white/30">
                    {t("unlockedDescription", { threshold: referralThreshold })}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-white/30">
                    {t("lockedDescription", { threshold: referralThreshold })}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={!customCodeUnlocked}
              onClick={startEditingCode}
              aria-label={customCodeUnlocked ? t("editCode") : t("locked")}
              className={`flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border px-4 text-[11px] font-medium transition-all ${
                customCodeUnlocked
                  ? "border-[#2A2A2A] bg-[#1A1A1A] text-[#888] hover:border-[#FF5722]/30 hover:bg-[#FF5722]/[0.06] hover:text-[#FF5722]"
                  : "cursor-not-allowed border-white/[0.06] text-white/20 bg-transparent"
              }`}
            >
              {customCodeUnlocked ? (
                <>
                  <Pencil size={13} /> {t("editCode")}
                </>
              ) : (
                <>
                  <Lock size={13} /> {t("locked")}
                </>
              )}
            </button>
          </div>

          {/* EDITOR */}
          {editingCode && customCodeUnlocked && (
            <div className="mt-5 rounded-lg border border-[#222] bg-[#161616] p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex flex-1 items-center overflow-hidden rounded-md border border-white/[0.08] bg-[#101010]">
                  <span className="border-r border-white/[0.06] px-3 text-xs text-white/20">
                    {t("codeLabel")}
                  </span>
                  <input
                    type="text"
                    value={draftCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase().replace(/[^A-Z0-9-_]/g, "");
                      setDraftCode(val);
                    }}
                    maxLength={20}
                    minLength={3}
                    autoFocus
                    aria-label={t("codeLabel")}
                    className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm font-medium tracking-wider text-white outline-none placeholder:text-white/15"
                    placeholder={t("codePlaceholder")}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelEditingCode}
                    disabled={saveStatus === "loading"}
                    className="flex h-10 items-center gap-2 rounded-md border border-white/[0.07] px-4 text-xs text-white/40 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
                  >
                    <X size={13} /> {t("cancel")}
                  </button>

                  <button
                    type="button"
                    onClick={saveReferralCode}
                    disabled={saveStatus === "loading"}
                    className="flex h-10 items-center gap-2 rounded-md px-4 text-xs font-medium text-white transition-all disabled:opacity-50 disabled:bg-[#161616] disabled:text-[#888] disabled:border disabled:border-[#222] bg-[#FF5722] hover:bg-[#E64D1F]"
                  >
                    {saveStatus === "loading" ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        {t("saving")}
                      </>
                    ) : (
                      <>
                        <Save size={13} />
                        {t("saveCode")}
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-white/20">
                {t("linkAutoUpdates")}
              </p>
            </div>
          )}
        </section>

        {/* ================================================================
            REFERRED USERS
        ================================================================ */}

        <section>
          <div className="mb-5 flex items-end justify-between border-t border-white/[0.07] pt-7">
            <div>
              <h2 className="text-base font-semibold">{t("referredUsers")}</h2>
              <p className="mt-1 text-xs text-white/25">
                {t("referredUsersSubtitle")}
              </p>
            </div>
          </div>

          {/* TABLE HEADER */}
          <div className="hidden grid-cols-[minmax(300px,1fr)_180px_140px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
            <span>{t("tableUser")}</span>
            <span>{t("tableJoined")}</span>
            <span className="text-right">{t("tableStatus")}</span>
          </div>

          {/* USER LIST */}
          <div className="divide-y divide-white/[0.06]">
            {loading ? (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="grid grid-cols-[minmax(300px,1fr)_180px_140px] gap-4 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-white/[0.04] animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-3 w-24 rounded-sm bg-white/[0.04] animate-pulse" />
                        <div className="h-2 w-32 rounded-sm bg-white/[0.02] animate-pulse" />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-20 rounded-sm bg-white/[0.04] animate-pulse" />
                    </div>
                    <div className="flex items-center justify-end">
                      <div className="h-4 w-16 rounded-full bg-white/[0.04] animate-pulse" />
                    </div>
                  </div>
                ))}
              </>
            ) : users.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center">
                <Users className="w-8 h-8 text-white/10 mb-3" />
                <p className="text-white/40 text-sm">{t("noReferrals")}</p>
                <p className="text-white/20 text-xs mt-1">{t("noReferralsHint")}</p>
              </div>
            ) : (
              users.map((user, index) => (
                <ReferralRow key={index} user={user} />
              ))
            )}
          </div>

          {/* ==============================================================
              PAGINATION
          ============================================================== */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalUsers}
            pageSize={USERS_PER_PAGE}
            onPageChange={setPage}
            loading={loading}
            itemName={t("suffixUsers")}
          />
        </section>

      </div>
    </div>
  );
}
