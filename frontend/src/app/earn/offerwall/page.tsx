"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useEarn } from "@/hooks/useEarn";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function OfferwallPage() {
  const router = useRouter();
  const { data, loading } = useEarn();
  
  const decodedUserId = useMemo(() => {
    try {
      const t = localStorage.getItem("auth_token") || "";
      const [, payload] = t.split(".");
      if (!payload) return null;
      const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      const obj = JSON.parse(json);
      return obj?.sub || obj?.userId || null;
    } catch {
      return null;
    }
  }, []);

  const adslotId = data?.config?.offerwall?.adslotId;
  const url = useMemo(() => {
    if (!adslotId || !decodedUserId) return null;
    return `https://offerwall.ayet.io/offers?adSlot=${adslotId}&externalIdentifier=${decodedUserId}`;
  }, [adslotId, decodedUserId]);

  if (loading) {
    return <div className="p-8 text-center text-white/50"><i className="fas fa-spinner fa-spin text-3xl"></i></div>;
  }

  if (!url) {
    return (
      <div className="p-8 text-center">
        <p className="text-[#AAAAAA]">Offerwall is not configured or available.</p>
        <Link href="/earn" className="text-white mt-4 inline-block hover:underline">Go Back</Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[#0f0f0f] min-h-screen text-white">
      <div className="flex flex-col h-[calc(100vh-80px)] w-full rounded-2xl overflow-hidden border border-white/[0.06] bg-white">
        <div className="bg-[#121212] border-b border-white/[0.06] p-4 flex items-center justify-between shrink-0">
          <Link href="/earn" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
            <ChevronLeft size={16} />
            <span className="text-sm font-medium">Back to Earn</span>
          </Link>
          <div className="text-white font-bold tracking-tight">Offerwall Tasks</div>
          <div className="w-[100px]"></div>
        </div>
        <div className="flex-1 w-full relative">
          <iframe
            src={url}
            className="absolute inset-0 w-full h-full border-0"
            title="Offerwall"
            allow="fullscreen"
          />
        </div>
      </div>
    </div>
  );
}
