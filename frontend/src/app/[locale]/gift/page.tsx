"use client";

import { useRef, useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { GiftRedeemSection } from "@/components/gift/GiftRedeemSection";
import { GiftCodesSection } from "@/components/gift/GiftCodesSection";
import { GiftCreateDrawer } from "@/components/gift/GiftCreateDrawer";
import { GiftSkeleton } from "@/components/Skeleton";

export default function GiftCodesPage() {
  const [mounted, setMounted] = useState(false);
  const [minLoadingTime, setMinLoadingTime] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const refreshCodesRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setMinLoadingTime(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleCreated = () => {
    setDrawerOpen(false);
    refreshCodesRef.current?.();
  };

  if (!mounted || minLoadingTime) {
    return (
      <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
        <GiftSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="flex flex-col h-full space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Gift <span className="text-[#FF5722]">Codes</span>
            </h1>
            <p className="text-[#888888] mt-1 text-sm">
              Redeem or share gift codes for coins and resources.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
            >
              <Plus size={12} />
              Create Code
            </button>
          </div>
        </div>

        <GiftRedeemSection />
        
        <GiftCodesSection onRefreshRef={(fn) => { refreshCodesRef.current = fn; }} />

        <p className="mt-3 text-xs text-[#555]">
          Gift codes are subject to their configured redemption limits and expiration rules.
        </p>

      </div>

      <GiftCreateDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
