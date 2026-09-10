"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useModal } from "@/components/Modal";
import { useEarn } from "@/hooks/useEarn";
import { EarnMethodCard } from "@/components/earn";
import { PlaySquare, Link as LinkIcon, ListTodo, ClipboardList } from "lucide-react";

function EarnContent() {
  const router = useRouter();
  const modal = useModal();
  const searchParams = useSearchParams();
  const lvSid = searchParams.get("lvSid");
  const lvHash = searchParams.get("hash");
  const didAuto = useRef(false);
  const didAutoClaim = useRef(false);
  const didAutoAdsClaim = useRef(false);

  const { data, loading, error, setError, refresh, start, claim, starting } = useEarn();
  const [lastLvUrl, setLastLvUrl] = useState<string | null>(null);
  const [pendingLvSid, setPendingLvSid] = useState<string | null>(null);

  const lvUrlKey = (sessionId: string) => `earn_lv_url_${sessionId}`;

  const showAds = Boolean(data?.config?.ads?.enabled);
  const showLinkvertise = Boolean(data?.config?.linkvertise?.enabled);
  const showOfferwall = Boolean(data?.config?.offerwall?.enabled);
  const showSurveywall = Boolean(data?.config?.surveywall?.enabled);

  const canShow = useMemo(() => {
    return showAds || showLinkvertise || showOfferwall || showSurveywall;
  }, [showAds, showLinkvertise, showOfferwall, showSurveywall]);

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

  useEffect(() => {
    if (!lvSid) return;
    refresh();
  }, [lvSid, refresh]);

  useEffect(() => {
    const sid = data?.status?.linkvertise?.sessionId;
    if (!sid) {
      setLastLvUrl(null);
      return;
    }
    try {
      const url = localStorage.getItem(lvUrlKey(sid));
      if (url) setLastLvUrl(url);
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (_) {}
  }, [data?.status?.linkvertise?.sessionId]);

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
        await modal.success({ title: "Reward Claimed", body: `You earned ${r.rewardCoins} coins.` });
      } catch (e: any) {
        const msg = String(e?.message || "Failed to claim");
        const lower = msg.toLowerCase();
        const notReady = lower.includes("not ready") || lower.includes("not claimable");
        if (notReady) {
          // Hash verification is done server-side before claimability checks.
          // We retry the claim later without the hash.
          setPendingLvSid(sid);
          return;
        }
        await modal.error({ title: "Claim Error", body: msg });
      }
    })();
  }, [lvSid, lvHash, claim, modal, setError]);

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
        await modal.success({ title: "Reward Claimed", body: `You earned ${r.rewardCoins} coins.` });
      } catch (e: any) {
        didAutoClaim.current = false;
        const msg = String(e?.message || "Failed to claim");
        await modal.error({ title: "Claim Error", body: msg });
      }
    })();
  }, [pendingLvSid, data?.status?.linkvertise, claim, modal, setError]);

  useEffect(() => {
    const st = data?.status?.ads;
    const sid = st?.sessionId;
    if (!sid) {
      didAutoAdsClaim.current = false;
      return;
    }
    if (st?.state !== "claimable") {
      didAutoAdsClaim.current = false;
      return;
    }
    if (didAutoAdsClaim.current) return;
    didAutoAdsClaim.current = true;
    (async () => {
      try {
        const r = await claim("ads", sid);
        await modal.success({ title: "Reward Claimed", body: `You earned ${r.rewardCoins} coins.` });
      } catch (e: any) {
        didAutoAdsClaim.current = false;
        await modal.error({ title: "Claim Error", body: String(e?.message || "Failed to claim") });
      }
    })();
  }, [data?.status?.ads, claim, modal]);

  const onStart = async (method: "ads" | "linkvertise" | "offerwall" | "surveywall") => {
    try {
      if (!canShow) {
        await modal.error({ title: "Earn Disabled", body: "Earn is currently disabled." });
        return;
      }
      if (method === "ads" && !showAds) {
        await modal.error({ title: "Disabled", body: "Watch Ads is currently disabled." });
        return;
      }
      if (method === "linkvertise" && !showLinkvertise) {
        await modal.error({ title: "Disabled", body: "Linkvertise is currently disabled." });
        return;
      }
      if (method === "offerwall" && !showOfferwall) {
        await modal.error({ title: "Disabled", body: "Offerwall is currently disabled." });
        return;
      }
      if (method === "surveywall" && !showSurveywall) {
        await modal.error({ title: "Disabled", body: "Surveywall is currently disabled." });
        return;
      }

      if (method === "offerwall") {
        router.push("/earn/offerwall");
        return;
      }

      if (method === "surveywall") {
        router.push("/earn/surveywall");
        return;
      }

      if (method === "ads") {
        const st = data?.status?.ads;
        const sid = st?.sessionId;
        if (st?.state === "claimable" && sid) {
          await onClaim("ads");
          return;
        }
        router.push("/earn/ads");
        return;
      }

      if (method === "linkvertise") {
        const st = data?.status?.linkvertise;
        const sid = st?.sessionId;
        if (st?.state === "claimable" && sid) {
          await onClaim("linkvertise");
          return;
        }
        // We intentionally do NOT use localStorage here anymore, so that we always get
        // the freshest generated URL from the backend when resuming the session.
      }



      const r = await start(method);
      if (method === "linkvertise" && r?.linkvertise?.url) {
        setLastLvUrl(r.linkvertise.url);
        try {
          window.location.assign(r.linkvertise.url);
        // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (_) {}
      }
    } catch (e: any) {
      const msg = String(e?.message || "Failed to start");
      await modal.error({ title: "Earn Error", body: msg });
    }
  };

  const onClaim = async (method: "ads" | "linkvertise" | "offerwall" | "surveywall") => {
    try {
      const sessionId = data?.status?.[method]?.sessionId;
      if (!sessionId) throw new Error("No active session");
      const r = await claim(method, sessionId);
      await modal.success({ title: "Reward Claimed", body: `You earned ${r.rewardCoins} coins.` });
    } catch (e: any) {
      const msg = String(e?.message || "Failed to claim");
      await modal.error({ title: "Claim Error", body: msg });
    }
  };

  const cols = "lg:grid-cols-[2fr_100px_100px_120px_150px]";

  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-[#0f0f0f] min-h-screen text-white">
        <div className="flex flex-col h-full space-y-6">
          <header>
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="h-8 w-32 bg-white/5 rounded-md animate-pulse mb-2" />
                <div className="h-4 w-64 bg-white/5 rounded-md animate-pulse" />
              </div>
            </div>
          </header>
          <div className="w-full mt-6">
            <div className={`hidden gap-4 lg:grid ${cols} border-b border-white/[0.06] px-5 pb-3`}>
              <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-16 bg-white/5 rounded animate-pulse justify-self-end" />
            </div>
            <div className="divide-y divide-white/[0.06]">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-white/[0.02] animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    
      <div className="p-4 sm:p-6 bg-[#0f0f0f] min-h-screen text-white">
        <div className="flex flex-col h-full space-y-6">
          <header>
            <div className="flex items-start justify-between gap-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Earn</h1>
                <p className="mt-1 text-sm text-white/40">
                  Watch rewarded videos and complete tasks to earn coins.
                </p>
              </div>
            </div>
          </header>

        {!canShow && (
          <div className="bg-[#181818] border border-[#2a2a2a] rounded-2xl p-6">
            <div className="text-white font-semibold">Earn is currently disabled</div>
            <div className="text-[#AAAAAA] text-sm mt-1">Ask an admin to enable earning methods.</div>
          </div>
        )}

        {canShow && data?.config && data?.status && (
          <div className="w-full">
            {/* TABLE HEADER (Desktop) */}
            <div className={`hidden gap-4 lg:grid ${cols} border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30`}>
              <span>Method</span>
              <span>Reward</span>
              <span>Daily Limit</span>
              <span>Cooldown</span>
              <span className="text-right">Action</span>
            </div>

            {/* TABLE LIST */}
            <div className="divide-y divide-white/[0.06]">
            {!showAds && !showLinkvertise && !showOfferwall && !showSurveywall && (
              <div className="py-12 text-center">
                <div className="text-white font-semibold">No earning methods enabled</div>
                <div className="text-[#AAAAAA] text-sm mt-1">Ask an admin to enable at least one earning method.</div>
              </div>
            )}

            {showAds && (
              <EarnMethodCard
                method="ads"
                title="Watch Rewarded Video"
                icon={<PlaySquare size={20} />}
                config={data.config.ads}
                status={data.status.ads}
                starting={starting === "ads"}
                onStart={() => onStart("ads")}
                cols={cols}
              />
            )}

            {showLinkvertise && (
              <EarnMethodCard
                method="linkvertise"
                title="Linkvertise"
                icon={<LinkIcon size={20} />}
                config={data.config.linkvertise}
                status={data.status.linkvertise}
                starting={starting === "linkvertise"}
                onStart={() => onStart("linkvertise")}
                cols={cols}
              />
            )}

            {showOfferwall && (
              <EarnMethodCard
                method="offerwall"
                title="Offerwall Tasks"
                icon={<ListTodo size={20} />}
                config={data.config.offerwall}
                status={data.status.offerwall}
                starting={starting === "offerwall"}
                onStart={() => onStart("offerwall")}
                cols={cols}
              />
            )}

            {showSurveywall && (
              <EarnMethodCard
                method="surveywall"
                title="Surveys"
                icon={<ClipboardList size={20} />}
                config={data.config.surveywall}
                status={data.status.surveywall}
                starting={starting === "surveywall"}
                onStart={() => onStart("surveywall")}
                cols={cols}
              />
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EarnPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white/50"><i className="fas fa-spinner fa-spin text-3xl"></i></div>}>
      <EarnContent />
    </Suspense>
  );
}
