"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useEarn } from "@/hooks/useEarn";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function SurveywallPage() {
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

  const adslotId = data?.config?.surveywall?.adslotId;
  const url = useMemo(() => {
    if (!adslotId || !decodedUserId) return null;
    return `https://surveys.ayet.io/surveys?adSlot=${adslotId}&external_identifier=${decodedUserId}`;
  }, [adslotId, decodedUserId]);

  if (loading) {
    return <div className="p-8 text-center text-white/50"><i className="fas fa-spinner fa-spin text-3xl"></i></div>;
  }

  if (!url) {
    return (
      <div className="p-8 text-center">
        <p className="text-[#AAAAAA]">Surveywall is not configured or available.</p>
        <Link href="/earn" className="text-white mt-4 inline-block hover:underline">Go Back</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full rounded-2xl overflow-hidden border border-[#2a2a2a] bg-white mt-6">
      <div className="bg-[#181818] border-b border-[#2a2a2a] p-4 flex items-center justify-between shrink-0">
        <Link href="/earn" className="flex items-center gap-2 text-[#AAAAAA] hover:text-white transition-colors">
          <ChevronLeft size={18} />
          <span className="text-sm font-semibold">Back to Earn</span>
        </Link>
        <div className="text-white font-bold text-sm">Surveys</div>
        <div className="w-[100px]"></div>
      </div>
      <div className="flex-1 w-full relative">
        <iframe
          src={url}
          className="absolute inset-0 w-full h-full border-0"
          title="Surveywall"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
