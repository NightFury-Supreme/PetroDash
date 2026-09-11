"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useModal } from "@/components/Modal";
import { useEarn } from "@/hooks/useEarn";
import { EarnHeader, EarnList } from "@/components/earn";
import { EarnSkeleton } from "@/components/skeletons/earn/EarnSkeleton";
function EarnContent() {
  const modal = useModal();
  const searchParams = useSearchParams();
  const lvSid = searchParams.get("lvSid");
  const lvHash = searchParams.get("hash");
  const didAuto = useRef(false);
  const didAutoClaim = useRef(false);

  const { data, loading, error, setError, refresh, start, claim, starting } = useEarn();
  
  const [pendingLvSid, setPendingLvSid] = useState<string | null>(null);

  const lvUrlKey = (sessionId: string) => `earn_lv_url_${sessionId}`;

  const showLinkvertise = Boolean(data?.config?.linkvertise?.enabled);

  const canShow = useMemo(() => {
    return showLinkvertise;
  }, [showLinkvertise]);

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
      
      return;
    }
    try {
      const url = localStorage.getItem(lvUrlKey(sid));
      
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



  const onStart = async (method: "ads" | "linkvertise" | "offerwall" | "surveywall") => {
    try {
      if (!canShow) {
        await modal.error({ title: "Earn Disabled", body: "Earn is currently disabled." });
        return;
      }
      if (method === "linkvertise" && !showLinkvertise) {
        await modal.error({ title: "Disabled", body: "Linkvertise is currently disabled." });
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

  
  if (loading) {
    return <EarnSkeleton />;
  }

  return (
    <div className="p-4 sm:p-6 bg-[#0f0f0f] min-h-screen text-white">
      <div className="flex flex-col h-full space-y-6">
        <EarnHeader />
        
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
