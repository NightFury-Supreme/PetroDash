"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "@/i18n/routing";
import { DashboardSkeleton } from "@/components/Skeleton";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { useDashboard } from "@/hooks/useDashboard";
import { ContentAd } from "@/components/ads/AdSense";
import { useToast } from "@/components/ui/ToastProvider";
import { ErrorState, DashboardButton, ErrorDescription } from "@/components/ui/ErrorState";
import { RefreshCw, LayoutDashboard } from "lucide-react";

function DashboardContentWrapper() {
  const [mounted, setMounted] = useState(false);
  const [minLoadingTime, setMinLoadingTime] = useState(true);
  const { loading, error } = useDashboard();
  const searchParams = useSearchParams();
  const { showError, showSuccess } = useToast();

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
      
      showSuccess("Email address successfully verified! You now have full access.");
    }
  }, [searchParams, showSuccess]);

  // Handle error toast
  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  // Show full page skeleton while loading to prevent layout shift
  if (!mounted || loading || minLoadingTime) {
    return (
      <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
        <DashboardSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<LayoutDashboard strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker="Load Error"
          title="Failed to Load Dashboard"
          errorString={error}
          description={<ErrorDescription error={error} topic="Dashboard" />}
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
    
      <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
        <DashboardContent />
        <ContentAd />
      </div>
    
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
        <DashboardSkeleton />
      </div>
    }>
      <DashboardContentWrapper />
    </Suspense>
  );
}


