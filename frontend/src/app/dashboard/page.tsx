"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardSkeleton } from "@/components/Skeleton";
import { DashboardContent } from "../../components/dashboard/DashboardContent";
import { useDashboard } from "../../hooks/useDashboard";
import { ContentAd } from "@/components/ads/AdSense";
import { useModal } from "@/components/Modal";

function DashboardContentWrapper() {
  const [mounted, setMounted] = useState(false);
  const [minLoadingTime, setMinLoadingTime] = useState(true);
  const { loading, error } = useDashboard();
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
    return (
      <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
        <DashboardSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    throw new Error(error);
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


