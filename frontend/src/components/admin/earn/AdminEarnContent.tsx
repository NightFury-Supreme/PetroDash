"use client";

import type { AdminEarnSettings } from "@/hooks/admin/earn/useAdminEarn";

export function AdminEarnContent({
  form,
  saving,
  onChange,
  onToggleEnabled,
  onSaveAds,
  onSaveLinkvertise,
}: {
  form: AdminEarnSettings;
  saving: boolean;
  onChange: (path: string, value: any) => void;
  onToggleEnabled: (nextEnabled: boolean) => void;
  onSaveAds: () => void;
  onSaveLinkvertise: () => void;
}) {
  const setField = (path: string, value: any) => {
    onChange(path, value);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#202020] rounded-xl flex items-center justify-center">
              <i className="fas fa-coins text-white text-lg"></i>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Earn System</h3>
              <p className="text-[#AAAAAA] text-sm">Enable/disable the entire earn feature</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={!!form.enabled}
                onChange={(e) => {
                  const nextEnabled = e.target.checked;
                  setField("enabled", nextEnabled);
                  onToggleEnabled(nextEnabled);
                }}
                disabled={saving}
              />
              <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
            </label>
            <span className="text-white font-medium">Enable Earn System</span>
          </div>
      </div>

      {!form.enabled && (
        <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
          <div className="text-white font-semibold">Earn is currently disabled</div>
          <div className="text-[#AAAAAA] text-sm mt-1">Enable Earn System to configure earning methods.</div>
        </div>
      )}

      {form.enabled && (
        <div className="space-y-6">
          <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#202020] rounded-xl flex items-center justify-center">
                <i className="fas fa-rectangle-ad text-white text-lg" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Watch Ads (Rewarded Video)</h3>
                <p className="text-[#AAAAAA] text-sm">Proof-based rewarded video via ayeT callbacks</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={!!form.ads.enabled}
                  onChange={(e) => setField("ads.enabled", e.target.checked)}
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
              </label>
              <span className="text-white font-medium">Enable Watch Ads</span>
            </div>

            {form.ads.enabled ? (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Coins</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={(form.ads as any).coins ?? 0}
                      onChange={(e) => setField("ads.coins", Number(e.target.value))}
                      className="input"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="label">Max Claims / Day</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={(form.ads as any).maxClaimsPerDay ?? 0}
                      onChange={(e) => setField("ads.maxClaimsPerDay", Number(e.target.value))}
                      className="input"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="label">Cooldown Seconds</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={(form.ads as any).cooldownSeconds ?? 0}
                      onChange={(e) => setField("ads.cooldownSeconds", Number(e.target.value))}
                      className="input"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="label">Wait Seconds (unused)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={(form.ads as any).waitSeconds ?? 0}
                      onChange={(e) => setField("ads.waitSeconds", Number(e.target.value))}
                      className="input"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="label">ayeT Placement ID</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={Number((form.ads as any).ayetPlacementId ?? 0)}
                      onChange={(e) => setField("ads.ayetPlacementId", Number(e.target.value))}
                      className="input"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="label">ayeT AdSlot Name</label>
                    <input
                      type="text"
                      value={String((form.ads as any).ayetAdslotName ?? "")}
                      onChange={(e) => setField("ads.ayetAdslotName", e.target.value)}
                      className="input"
                      disabled={saving}
                      placeholder="{your_rewarded_video_adslot_name}"
                    />
                  </div>
                  <div>
                    <label className="label">ayeT API Key</label>
                    <input
                      type="text"
                      value={String((form.ads as any).ayetApiKey ?? "")}
                      onChange={(e) => setField("ads.ayetApiKey", e.target.value)}
                      className="input"
                      disabled={saving}
                      placeholder="Paste from ayeT dashboard"
                    />
                    <div className="text-xs text-[#AAAAAA] mt-2">
                      Callback URL: {String(process.env.NEXT_PUBLIC_API_BASE || "")}/api/earn/ads/ayet/callback
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button onClick={onSaveAds} disabled={saving} className="btn-white">
                    {saving ? "Saving..." : "Save Watch Ads"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#AAAAAA] mt-4">Enable this method to configure rewarded video settings.</div>
            )}
          </div>

          <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#202020] rounded-xl flex items-center justify-center">
                <i className="fas fa-link text-white text-lg" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Linkvertise</h3>
                <p className="text-[#AAAAAA] text-sm">Link tasks + anti-bypass protection</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={!!form.linkvertise.enabled}
                  onChange={(e) => setField("linkvertise.enabled", e.target.checked)}
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
              </label>
              <span className="text-white font-medium">Enable Linkvertise</span>
            </div>

            {form.linkvertise.enabled ? (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Coins</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={(form.linkvertise as any).coins ?? 0}
                      onChange={(e) => setField("linkvertise.coins", Number(e.target.value))}
                      className="input"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="label">Max Claims / Day</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={(form.linkvertise as any).maxClaimsPerDay ?? 0}
                      onChange={(e) => setField("linkvertise.maxClaimsPerDay", Number(e.target.value))}
                      className="input"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="label">Wait Seconds</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={(form.linkvertise as any).waitSeconds ?? 0}
                      onChange={(e) => setField("linkvertise.waitSeconds", Number(e.target.value))}
                      className="input"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="label">Cooldown Seconds</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={(form.linkvertise as any).cooldownSeconds ?? 0}
                      onChange={(e) => setField("linkvertise.cooldownSeconds", Number(e.target.value))}
                      className="input"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="label">Linkvertise URL Template</label>
                    <input
                      type="text"
                      value={(form.linkvertise as any).url ?? ""}
                      onChange={(e) => setField("linkvertise.url", e.target.value)}
                      className="input"
                      disabled={saving}
                      placeholder="https://link-to.net/.../dynamic?r={targetB64}"
                    />
                    <div className="text-xs text-[#AAAAAA] mt-2">Use {"{target}"} or {"{targetB64}"} placeholders.</div>
                  </div>
                  <div>
                    <label className="label">Anti-Bypass Token</label>
                    <input
                      type="text"
                      value={(form.linkvertise as any).antiBypassToken ?? ""}
                      onChange={(e) => setField("linkvertise.antiBypassToken", e.target.value)}
                      className="input"
                      disabled={saving}
                    />
                    <div className="text-xs text-[#AAAAAA] mt-2">
                      If set, claims require a valid anti-bypass hash (proof-based).
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button onClick={onSaveLinkvertise} disabled={saving} className="btn-white">
                    {saving ? "Saving..." : "Save Linkvertise"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#AAAAAA] mt-4">Enable this method to configure Linkvertise settings.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
