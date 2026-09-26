"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "@/i18n/routing";
import { useToast } from "@/components/ui/ToastProvider";
import { useEarn } from "@/hooks/earn";
import { EarnHeader, EarnList } from "@/components/earn";
import { EarnSkeleton } from "@/components/skeletons/earn/EarnSkeleton";
import { ErrorState, DashboardButton, ErrorDescription } from "@/components/ui/ErrorState";
import { Coins, RefreshCw } from "lucide-react";

function EarnContent() {
  const t = useTranslations("Earn");
  const tErrorBackend = useTranslations("BackendErrors");
  const { showSuccess, showError } = useToast();
  const searchParams = useSearchParams();
  const lvSid = searchParams.get("lvSid");
  const lvHash = searchParams.get("hash");
  const didAuto = useRef(false);
  const didAutoClaim = useRef(false);

  const { data, loading, error, refresh, start, claim, starting } = useEarn();
  const [pendingLvSid, setPendingLvSid] = useState<string | null>(null);

  const showLinkvertise = Boolean(data?.config?.linkvertise?.enabled);
  const canShow = useMemo(() => showLinkvertise, [showLinkvertise]);

  const translateError = (err: unknown, fallbackKey = "failedToClaim") => {
    const rawMsg = err instanceof Error ? err.message : String(err || "");
    if (tErrorBackend.has(rawMsg)) {
      return tErrorBackend(rawMsg);
    }
    return t(fallbackKey);
  };

  useEffect(() => {
    if (!lvSid) return;
    refresh();
  }, [lvSid, refresh]);

  useEffect(() => {
    const sid = lvSid || data?.status?.linkvertise?.sessionId;
    const hash = lvHash;
    if (!sid || !hash) return;
    if (didAuto.current) return;

    didAuto.current = true;
    (async () => {
      try {
        const r = await claim("linkvertise", sid, { hash });
        didAutoClaim.current = true;
        setPendingLvSid(null);
        showSuccess(t("earnedSuccess", { coins: r.rewardCoins }));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        const lower = msg.toLowerCase();
        const notReady = lower.includes("not ready") || lower.includes("not claimable");
        if (notReady) {
          setPendingLvSid(sid);
          return;
        }
        showError(translateError(e, "failedToClaim"));
      }
    })();
  }, [lvSid, lvHash, claim, showError, showSuccess, t, tErrorBackend]);

  useEffect(() => {
    const sid = pendingLvSid;
    if (!sid) return;
    if (didAutoClaim.current) return;

    const st = data?.status?.linkvertise;
    if (!st) return;
    if (st.sessionId && st.sessionId !== sid) return;
    if (st.state !== "claimable") return;

    didAutoClaim.current = true;
    (async () => {
      try {
        const r = await claim("linkvertise", sid);
        setPendingLvSid(null);
        showSuccess(t("earnedSuccess", { coins: r.rewardCoins }));
      } catch (e: unknown) {
        didAutoClaim.current = false;
        showError(translateError(e, "failedToClaim"));
      }
    })();
  }, [pendingLvSid, data?.status?.linkvertise, claim, showError, showSuccess, t, tErrorBackend]);

  const onStart = async (method: "linkvertise") => {
    try {
      if (!canShow) {
        showError(t("earnDisabledToast"));
        return;
      }
      if (method === "linkvertise" && !showLinkvertise) {
        showError(t("linkvertiseDisabledToast"));
        return;
      }

      if (method === "linkvertise") {
        const st = data?.status?.linkvertise;
        const sid = st?.sessionId;
        if (st?.state === "claimable" && sid) {
          await onClaim("linkvertise");
          return;
        }
      }

      const r = await start(method);
      if (method === "linkvertise" && r?.linkvertise?.url) {
        try {
          window.location.assign(r.linkvertise.url);
        } catch {}
      }
    } catch (e: unknown) {
      showError(translateError(e, "failedToStart"));
    }
  };

  const onClaim = async (method: "linkvertise") => {
    try {
      const sessionId = data?.status?.[method]?.sessionId;
      if (!sessionId) throw new Error("ERR_EARN_SESSION_NOT_FOUND");
      const r = await claim(method, sessionId);
      showSuccess(t("earnedSuccess", { coins: r.rewardCoins }));
    } catch (e: unknown) {
      showError(translateError(e, "failedToClaim"));
    }
  };

  if (loading) {
    return <EarnSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<Coins strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker={t("loadError")}
          title={t("failedToLoadEarn")}
          errorString={error}
          description={<ErrorDescription error={error} topic="Earn" />}
          buttons={
            <>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              >
                <RefreshCw className="w-[14px] h-[14px]" />
                {t("retry")}
              </button>
              <DashboardButton variant="secondary" />
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white">
      <div className="flex flex-col h-full space-y-6">
        {canShow && showLinkvertise && <EarnHeader />}
        <EarnList
          canShow={canShow}
          data={data}
          showLinkvertise={showLinkvertise}
          starting={starting}
          onStart={onStart}
        />
      </div>
    </div>
  );
}

export default function EarnPage() {
  return (
    <Suspense fallback={<EarnSkeleton />}>
      <EarnContent />
    </Suspense>
  );
}
