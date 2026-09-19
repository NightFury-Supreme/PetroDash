"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "@/i18n/routing";
import { useToast } from "@/components/ui/ToastProvider";
import { useEarn } from "@/hooks/useEarn";
import { EarnHeader, EarnList } from "@/components/earn";
import { EarnSkeleton } from "@/components/skeletons/earn/EarnSkeleton";
import { ErrorState, DashboardButton, ErrorDescription } from "@/components/ui/ErrorState";
import { Coins, RefreshCw } from "lucide-react";
function EarnContent() {
  const { showSuccess, showError } = useToast();
  const searchParams = useSearchParams();
  const lvSid = searchParams.get("lvSid");
  const lvHash = searchParams.get("hash");
  const didAuto = useRef(false);
  const didAutoClaim = useRef(false);

  const { data, loading, error, setError, refresh, start, claim, starting } = useEarn();
  
  const [pendingLvSid, setPendingLvSid] = useState<string | null>(null);

  const _lvUrlKey = (sessionId: string) => `earn_lv_url_${sessionId}`;

  const showLinkvertise = Boolean(data?.config?.linkvertise?.enabled);

  const canShow = useMemo(() => {
    return showLinkvertise;
  }, [showLinkvertise]);

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
        showSuccess(`You earned ${r.rewardCoins} coins.`);
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
        showError(msg);
      }
    })();
  }, [lvSid, lvHash, claim, showError, showSuccess, setError]);

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
        showSuccess(`You earned ${r.rewardCoins} coins.`);
      } catch (e: any) {
        didAutoClaim.current = false;
        const msg = String(e?.message || "Failed to claim");
        showError(msg);
      }
    })();
  }, [pendingLvSid, data?.status?.linkvertise, claim, showError, showSuccess, setError]);



  const onStart = async (method: "linkvertise") => {
    try {
      if (!canShow) {
        showError("Earn is currently disabled.");
        return;
      }
      if (method === "linkvertise" && !showLinkvertise) {
        showError("Linkvertise is currently disabled.");
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
      showError(msg);
    }
  };

  const onClaim = async (method: "linkvertise") => {
    try {
      const sessionId = data?.status?.[method]?.sessionId;
      if (!sessionId) throw new Error("No active session");
      const r = await claim(method, sessionId);
      showSuccess(`You earned ${r.rewardCoins} coins.`);
    } catch (e: any) {
      const msg = String(e?.message || "Failed to claim");
      showError(msg);
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
          kicker="Load Error"
          title="Failed to Load Earn"
          errorString={error}
          description={<ErrorDescription error={error} topic="Earn" />}
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
