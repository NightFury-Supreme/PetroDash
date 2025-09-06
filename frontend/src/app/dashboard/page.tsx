"use client";

import { useState, useEffect } from "react";
import Shell from "@/components/Shell";
import { FullPageSkeleton } from "@/components/Skeleton";
import { DashboardContent } from "../../components/dashboard/DashboardContent";
import { useDashboard } from "../../hooks/useDashboard";
import { ContentAd } from "@/components/AdSense";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [minLoadingTime, setMinLoadingTime] = useState(true);
  const { loading, error, loadDashboardData } = useDashboard();

  // Initialize
  useEffect(() => {
    setMounted(true);
    
    // Set minimum loading time to prevent flash
    const timer = setTimeout(() => setMinLoadingTime(false), 500);
    
    return () => clearTimeout(timer);
  }, []); // Remove loadDashboardData from dependency - it's handled in the hook

  // Show full page skeleton while loading to prevent layout shift
  if (!mounted || loading || minLoadingTime) {
    return <FullPageSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <Shell>
        <div className="p-6 bg-[#0F0F0F] min-h-screen">
          <div className="bg-[#202020] border border-[#303030] rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-red-400 text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Dashboard</h3>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={loadDashboardData}
              className="bg-[#303030] hover:bg-[#404040] text-white px-6 py-2 rounded-lg transition-colors"
            >
              <i className="fas fa-redo mr-2"></i>
              Try Again
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
        <DashboardContent />
        <ContentAd />
      </div>
    </Shell>
  );
}


