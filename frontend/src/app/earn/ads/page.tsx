"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useEarn } from "@/hooks/useEarn";
import { useModal } from "@/components/Modal";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function EarnAdsPage() {
  const router = useRouter();
  const modal = useModal();
  const { data, loading, start, claim, refresh } = useEarn();

  const [adsSessionId, setAdsSessionId] = useState<string | null>(null);
  const [adsProvider, setAdsProvider] = useState<{ placementId: number; adslotName: string } | null>(null);
  const [adsStep, setAdsStep] = useState<
    "idle" | "loading" | "ready" | "requesting" | "playing" | "rewarded" | "verifying" | "claiming" | "error"
  >("idle");
  const [adsStepMessage, setAdsStepMessage] = useState<string>("");

  const decodedUserId = useMemo(() => {
    try {
      const t = localStorage.getItem("auth_token") || "";
      const [, payload] = t.split(".");
      if (!payload) return null;
      const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      const obj = JSON.parse(json);
      return String(obj?.sub || obj?.userId || "").trim() || null;
    } catch {
      return null;
    }
  }, []);

  const loadAyetSdk = async () => {
    if (typeof window === "undefined") return;
    if ((window as any).AyetVideoSdk) return;

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[data-ayet-sdk="1"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Failed to load rewarded video SDK")));
        return;
      }

      const s = document.createElement("script");
      s.src = "https://cdn.ayet.io/offerwall/js/ayetvideosdk.min.js";
      s.async = true;
      s.dataset.ayetSdk = "1";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load rewarded video SDK"));
      document.head.appendChild(s);
    });
  };

  const ensureAyetReady = async (sessionId: string, provider: { placementId: number; adslotName: string }) => {
    setAdsStep("loading");
    setAdsStepMessage("Preparing rewarded video...");
    await loadAyetSdk();

    const sdk = (window as any).AyetVideoSdk;
    if (!sdk) throw new Error("Rewarded video SDK not available");

    const externalIdentifier = decodedUserId || sessionId;
    await sdk.init(Number(provider.placementId), String(externalIdentifier), null);

    try {
      sdk.setCustomParameter("custom_1", sessionId);
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (_) {}

    sdk.callbackError = (e: any) => {
      const msg = typeof e === "string" ? e : JSON.stringify(e || {});
      setAdsStep("error");
      setAdsStepMessage(msg || "Ad error");
    };

    sdk.callbackRewarded = async (details: any) => {
      try {
        setAdsStep("verifying");
        setAdsStepMessage("Verifying reward...");

        const t = localStorage.getItem("auth_token");
        if (!t) throw new Error("Not authenticated");

        const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/earn/ads/ayet/rewarded`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${t}`,
          },
          body: JSON.stringify({ sessionId, details }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(String(d?.error || "Reward verification failed"));

        setAdsStep("claiming");
        setAdsStepMessage("Claiming coins...");
        const cr = await claim("ads", sessionId);
        await modal.success({ title: "Reward Claimed", body: `You earned ${cr.rewardCoins} coins.` });
        router.push("/earn");
      } catch (e: any) {
        setAdsStep("error");
        setAdsStepMessage(String(e?.message || "Failed"));
        try {
          await modal.error({ title: "Reward Error", body: String(e?.message || "Failed") });
        // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (_) {}
      } finally {
        await refresh();
      }
    };

    setAdsStep("ready");
    setAdsStepMessage("");
  };

  const handleStart = async () => {
    try {
      setAdsStep("requesting");
      setAdsStepMessage("Starting session...");
      const r = await start("ads");
      if (!r?.session?.id) throw new Error("Failed to create session");
      
      const sid = r.session.id;
      setAdsSessionId(sid);
      
      const providerInfo = {
        placementId: Number(r?.ads?.placementId || data?.config?.ads?.ayetPlacementId || 0),
        adslotName: String(r?.ads?.adslotName || data?.config?.ads?.ayetAdslotName || "")
      };
      setAdsProvider(providerInfo);

      await ensureAyetReady(sid, providerInfo);

      const sdk = (window as any).AyetVideoSdk;
      if (!sdk) throw new Error("Rewarded video SDK not available");

      setAdsStep("requesting");
      setAdsStepMessage("Loading an ad...");

      sdk.requestAd(
        String(providerInfo.adslotName),
        () => {
          try {
            setAdsStep("playing");
            setAdsStepMessage("Playing...");
            sdk.playFullsizeAd();
          } catch (e: any) {
            setAdsStep("error");
            setAdsStepMessage(String(e?.message || "Failed to play"));
          }
        },
        (msg: any) => {
          setAdsStep("error");
          setAdsStepMessage(String(msg || "No fill"));
        }
      );
    } catch (e: any) {
      setAdsStep("error");
      setAdsStepMessage(String(e?.message || "Failed"));
      await modal.error({ title: "Ad Error", body: String(e?.message || "Failed") });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-white/50"><i className="fas fa-spinner fa-spin text-3xl"></i></div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 mt-8">
      <Link href="/earn" className="flex items-center gap-2 text-[#AAAAAA] hover:text-white transition-colors mb-6">
        <ChevronLeft size={18} />
        <span className="text-sm font-semibold">Back to Earn</span>
      </Link>

      <div className="bg-[#181818] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[#2a2a2a] flex items-center gap-3">
          <div className="w-10 h-10 bg-[#202020] rounded-xl flex items-center justify-center shadow">
            <i className="fas fa-rectangle-ad text-blue-300"></i>
          </div>
          <h1 className="text-xl font-bold text-white">Watch Rewarded Video</h1>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="rounded-xl border border-[#303030] bg-[#0F0F0F] p-5 space-y-3">
            <div className="text-white font-semibold flex items-center gap-2">
              <i className="fas fa-info-circle text-[#AAAAAA]"></i> How it works
            </div>
            <div className="text-[#AAAAAA] text-sm leading-relaxed">
              You will see a rewarded video. After completion, your reward is verified server-side and coins are credited automatically.
            </div>
            <div className="text-xs text-[#666666] bg-[#1a1a1a] p-2 rounded-lg border border-[#2a2a2a]">
              Proof-based: reward requires a verified callback and cannot be claimed without it.
            </div>
          </div>

          <div className="rounded-xl border border-[#303030] bg-[#0F0F0F] p-3">
            <div id="ayet_video_container" className="w-full" />
          </div>

          <div className="flex flex-col items-center gap-3 pt-4">
            <button
              className="w-full sm:w-auto px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={adsStep === "loading" || adsStep === "requesting" || adsStep === "playing" || adsStep === "verifying" || adsStep === "claiming"}
              onClick={handleStart}
            >
              {adsStep === "loading" ? "Preparing..." : 
               adsStep === "requesting" ? "Loading..." : 
               adsStep === "playing" ? "Playing..." : 
               adsStep === "verifying" ? "Verifying..." : 
               adsStep === "claiming" ? "Claiming..." : 
               "Watch Video"}
            </button>
            {adsStep !== "idle" && adsStep !== "ready" && (
              <div className="text-sm text-[#AAAAAA] flex items-center gap-2 animate-pulse">
                {adsStep !== "error" && <i className="fas fa-spinner fa-spin"></i>}
                {adsStepMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
