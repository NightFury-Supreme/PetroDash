"use client";
import Shell from '@/components/Shell';
import { PanelSkeleton } from '@/components/skeletons/panel/PanelSkeleton';
import { usePanel } from '@/hooks/usePanel';
import { PanelContent, ErrorState } from '@/components/panel';

export default function PanelPage() {
  const {
    loading,
    error,
    info,
    resetting,
    newPassword,
    resetPassword,
    clearError,
    clearNewPassword,
  } = usePanel();

  // Show skeleton while loading
  if (loading) {
    return (
      <Shell>
        <PanelSkeleton />
      </Shell>
    );
  }

  // Show error state
  if (error && !info) {
    return (
      <Shell>
        <ErrorState 
          error={error} 
          onRetry={() => window.location.reload()} 
        />
      </Shell>
    );
  }

  // Show main content
  return (
    <Shell>
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-[#0F0F0F] min-h-screen">
        <PanelContent
          info={info!}
          error={error}
          resetting={resetting}
          newPassword={newPassword}
          onResetPassword={resetPassword}
          onClearError={clearError}
          onClearNewPassword={clearNewPassword}
        />
      </div>
    </Shell>
  );
}


