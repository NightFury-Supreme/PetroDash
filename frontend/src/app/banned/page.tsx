"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function BannedPage() {
  const router = useRouter();
  const [reason, setReason] = useState<string>("");
  const [until, setUntil] = useState<string | null>(null);

  useEffect(() => {
    try {
      const r = sessionStorage.getItem("ban_reason") || "Your account has been banned.";
      const u = sessionStorage.getItem("ban_until");
      setReason(r);
      setUntil(u);
    } catch {}
    // Verify live status on mount and poll periodically; if unbanned, leave immediately
    let active = true;
    const check = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        if (!token) { if (active) router.replace("/login"); return; }
        const base = process.env.NEXT_PUBLIC_API_BASE || "";
        const res = await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        if (res.ok) {
          if (!active) return;
          try { sessionStorage.removeItem("ban_reason"); sessionStorage.removeItem("ban_until"); } catch {}
          router.replace("/");
        } else if (res.status === 401) {
          if (active) router.replace("/login");
        }
      } catch {
        if (active) router.replace("/login");
      }
    };
    check();
    const id = setInterval(check, 5000);
    return () => { active = false; clearInterval(id); };
  }, []);

  const untilText = useMemo(() => (until ? new Date(until).toLocaleString() : null), [until]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="w-full max-w-xl mx-auto rounded-2xl p-8 text-center" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-[#3a0d0d] flex items-center justify-center">
            <i className="fas fa-ban text-red-400 text-2xl"></i>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Account Banned</h1>
        </div>
        <p className="text-[#AAAAAA] mb-4">You cannot access the service at this time.</p>
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-[#AAAAAA]">Reason:</span> <span className="font-medium">{reason}</span>
          </div>
          <div className="text-sm">
            <span className="text-[#AAAAAA]">Status:</span> {untilText ? (
              <span className="font-medium"> Banned until {untilText}</span>
            ) : (
              <span className="font-medium"> Lifetime ban</span>
            )}
          </div>
        </div>
        <div className="mt-6 text-xs text-[#888]">If you believe this is a mistake, please contact support.</div>
      </div>
    </div>
  );
}


