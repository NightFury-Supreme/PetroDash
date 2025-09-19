"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Shell from "@/components/Shell";
import { FullPageSkeleton } from "@/components/Skeleton";
import { DashboardContent } from "../../components/dashboard/DashboardContent";
import { useDashboard } from "../../hooks/useDashboard";
import { ContentAd } from "@/components/ads/AdSense";
import { useModal } from "@/components/Modal";

function DashboardContentWrapper() {
  const [mounted, setMounted] = useState(false);
  const [minLoadingTime, setMinLoadingTime] = useState(true);
  const { loading, error, loadDashboardData } = useDashboard();
  const searchParams = useSearchParams();
  const modal = useModal();

  // Initialize
  useEffect(() => {
    setMounted(true);
    
    // Set minimum loading time to prevent flash
    const timer = setTimeout(() => setMinLoadingTime(false), 500);
    
    return () => clearTimeout(timer);
  }, []); // Remove loadDashboardData from dependency - it's handled in the hook

  // Handle email verification success
  useEffect(() => {
    const verified = searchParams.get('verified');
    
    if (verified === '1') {
      // Clear the URL parameter immediately
      const url = new URL(window.location.href);
      url.searchParams.delete('verified');
      window.history.replaceState({}, '', url.toString());
      
      // Show success modal
      modal.success({
        title: 'Email Verified!',
        body: 'Your email address has been successfully verified. You now have full access to all features.'
      });
    }
  }, [searchParams, modal]);

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

export default function DashboardPage() {
  return (
    <Suspense fallback={<FullPageSkeleton />}>
      <DashboardContentWrapper />
    </Suspense>
  );
}


