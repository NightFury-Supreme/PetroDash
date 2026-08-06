"use client";

import Shell from "@/components/Shell";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useModal } from "@/components/Modal";
import { useEarn } from "@/hooks/useEarn";
import { EarnMethodCard } from "@/components/earn";

export default function EarnPage() {
  const modal = useModal();
  const searchParams = useSearchParams();
  const lvSid = searchParams.get("lvSid");
  const lvHash = searchParams.get("hash");
  const didAuto = useRef(false);
  const didAutoClaim = useRef(false);
  const didAutoAdsClaim = useRef(false);

  const { data, loading, error, setError, refresh, start, claim, starting, claiming } = useEarn();
  const [lastLvUrl, setLastLvUrl] = useState<string | null>(null);
  const [pendingLvSid, setPendingLvSid] = useState<string | null>(null);

  const [adsOpen, setAdsOpen] = useState(false);
  const [adsSessionId, setAdsSessionId] = useState<string | null>(null);
  const [adsProvider, setAdsProvider] = useState<{ placementId: number; adslotName: string } | null>(null);
  const [adsStep, setAdsStep] = useState<
    "idle" | "loading" | "ready" | "requesting" | "playing" | "rewarded" | "verifying" | "claiming" | "error"
  >("idle");
  const [adsStepMessage, setAdsStepMessage] = useState<string>("");

  const lvUrlKey = (sessionId: string) => `earn_lv_url_${sessionId}`;

  const canShow = useMemo(() => {
    return Boolean(data?.config?.enabled);
  }, [data?.config?.enabled]);

  const showAds = Boolean(data?.config?.ads?.enabled);
  const showLinkvertise = Boolean(data?.config?.linkvertise?.enabled);

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

        const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/earn/ads/ayet/rewarded`, {
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
        setAdsOpen(false);
        await modal.success({ title: "Reward Claimed", body: `You earned ${cr.rewardCoins} coins.` });
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
    const sid = lvSid;
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

  const onStart = async (method: "ads" | "linkvertise") => {
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

      if (method === "ads") {
        const st = data?.status?.ads;
        const sid = st?.sessionId;
        if (st?.state === "claimable" && sid) {
          await onClaim("ads");
          return;
        }
        const canContinue = (st?.state === "waiting" || st?.state === "claimable") && Boolean(sid);
        if (canContinue && sid) {
          setAdsSessionId(sid);
          setAdsProvider({
            placementId: Number(data?.config?.ads?.ayetPlacementId || 0),
            adslotName: String(data?.config?.ads?.ayetAdslotName || ""),
          });
          setAdsOpen(true);
          setAdsStep("idle");
          setAdsStepMessage("");
          return;
        }
      }

      if (method === "linkvertise") {
        const st = data?.status?.linkvertise;
        const sid = st?.sessionId;
        const canContinue = (st?.state === "waiting" || st?.state === "claimable") && Boolean(sid);
        if (canContinue && sid) {
          const url = lastLvUrl || localStorage.getItem(lvUrlKey(sid));
          if (url) {
            window.location.assign(url);
            return;
          }
        }
      }

      const r = await start(method);
      if (method === "ads" && r?.session?.id) {
        setAdsSessionId(r.session.id);
        if (r?.ads?.provider === "ayet") {
          setAdsProvider({ placementId: Number(r.ads.placementId || 0), adslotName: String(r.ads.adslotName || "") });
        } else {
          setAdsProvider({
            placementId: Number(data?.config?.ads?.ayetPlacementId || 0),
            adslotName: String(data?.config?.ads?.ayetAdslotName || ""),
          });
        }
        setAdsOpen(true);
        setAdsStep("idle");
      }
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

  const onClaim = async (method: "ads" | "linkvertise") => {
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
    return (
      <Shell>
        <div className="p-6 space-y-6">
          <div className="h-12 w-64 bg-[#202020] rounded-lg animate-pulse" />
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-52 bg-[#181818] border border-[#2a2a2a] rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="p-4 sm:p-6 space-y-6 bg-[#0F0F0F] min-h-screen text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#202020] rounded-2xl flex items-center justify-center shadow-lg">
              <i className="fas fa-coins text-white text-lg" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">Earn</h1>
              <p className="text-[#AAAAAA]">Watch rewarded videos and complete tasks to earn coins.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="btn-ghost"
              onClick={() => refresh()}
              disabled={loading}
            >
              <i className="fas fa-rotate-right" />
            </button>
          </div>
        </div>

        {adsOpen && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-panel" style={{ maxWidth: 720 }}>
              <div className="modal-header">
                <span className="icon-badge" style={{ transform: "scale(.9)" }}>
                  <i className="fas fa-rectangle-ad text-blue-300"></i>
                </span>
                <h3 className="font-semibold text-sm">Watch Rewarded Video</h3>
              </div>
              <div className="modal-body text-sm text-gray-300 space-y-4">
                <div className="rounded-xl border border-[#303030] bg-[#181818] p-4 space-y-3">
                  <div className="text-white font-semibold">How it works</div>
                  <div className="text-[#AAAAAA]">
                    You will see a rewarded video. After completion, your reward is verified server-side and coins are credited.
                  </div>
                  <div className="text-xs text-[#888888]">
                    Proof-based: reward requires a verified callback and cannot be claimed without it.
                  </div>
                </div>

                {adsStep !== "idle" && adsStep !== "ready" && (
                  <div className="text-[#AAAAAA]">{adsStepMessage || "Working..."}</div>
                )}

                <div className="rounded-xl border border-[#303030] bg-[#0F0F0F] p-3">
                  <div id="ayet_video_container" className="w-full" />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  className="btn-ghost"
                  onClick={() => setAdsOpen(false)}
                  disabled={adsStep === "verifying" || adsStep === "claiming"}
                >
                  Close
                </button>
                <button
                  className="btn-white"
                  disabled={!adsSessionId || !adsProvider || adsStep === "loading" || adsStep === "requesting" || adsStep === "verifying" || adsStep === "claiming"}
                  onClick={async () => {
                    if (!adsSessionId || !adsProvider) return;
                    try {
                      await ensureAyetReady(adsSessionId, adsProvider);

                      const sdk = (window as any).AyetVideoSdk;
                      if (!sdk) throw new Error("Rewarded video SDK not available");

                      setAdsStep("requesting");
                      setAdsStepMessage("Loading an ad...");

                      sdk.requestAd(
                        String(adsProvider.adslotName),
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
                  }}
                >
                  {adsStep === "loading" ? "Preparing..." : adsStep === "requesting" ? "Loading..." : adsStep === "playing" ? "Playing..." : adsStep === "verifying" ? "Verifying..." : adsStep === "claiming" ? "Claiming..." : "Start"}
                </button>
              </div>
            </div>
          </div>
        )}

        {!canShow && (
          <div className="bg-[#181818] border border-[#2a2a2a] rounded-2xl p-6">
            <div className="text-white font-semibold">Earn is currently disabled</div>
            <div className="text-[#AAAAAA] text-sm mt-1">Ask an admin to enable earning methods.</div>
          </div>
        )}

        {canShow && data?.config && data?.status && (
          <div className="space-y-6">
            {!showAds && !showLinkvertise && (
              <div className="bg-[#181818] border border-[#2a2a2a] rounded-2xl p-6">
                <div className="text-white font-semibold">No earning methods enabled</div>
                <div className="text-[#AAAAAA] text-sm mt-1">Ask an admin to enable at least one earning method.</div>
              </div>
            )}

            {showAds && (
              <EarnMethodCard
                method="ads"
                title="Watch Rewarded Video"
                icon="fa-rectangle-ad"
                config={data.config.ads}
                status={data.status.ads}
                starting={starting === "ads"}
                claiming={claiming === "ads"}
                onStart={() => onStart("ads")}
                onClaim={() => onClaim("ads")}
              />
            )}

            {showLinkvertise && (
              <EarnMethodCard
                method="linkvertise"
                title="Linkvertise"
                icon="fa-link"
                config={data.config.linkvertise}
                status={data.status.linkvertise}
                starting={starting === "linkvertise"}
                claiming={claiming === "linkvertise"}
                onStart={() => onStart("linkvertise")}
                onClaim={() => onClaim("linkvertise")}
              />
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}
