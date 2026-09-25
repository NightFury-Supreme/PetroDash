/**
 * Global Route Loading Skeleton
 * Complies with ISO/IEC 25010 and WCAG 2.1 (Accessibility)
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading..."
      className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans animate-pulse"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-white/[0.05] rounded-lg" />
            <div className="h-4 w-72 bg-white/[0.03] rounded-md" />
          </div>
          <div className="h-9 w-28 bg-white/[0.04] rounded-lg" />
        </div>

        {/* Metrics Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-white/[0.03] border border-white/[0.05] rounded-xl p-4" />
          <div className="h-28 bg-white/[0.03] border border-white/[0.05] rounded-xl p-4" />
          <div className="h-28 bg-white/[0.03] border border-white/[0.05] rounded-xl p-4" />
        </div>

        {/* Content Panel Skeleton */}
        <div className="h-96 bg-white/[0.02] border border-white/[0.04] rounded-xl p-6 space-y-4">
          <div className="h-5 w-36 bg-white/[0.05] rounded" />
          <div className="space-y-3 pt-2">
            <div className="h-12 bg-white/[0.03] rounded-lg" />
            <div className="h-12 bg-white/[0.02] rounded-lg" />
            <div className="h-12 bg-white/[0.03] rounded-lg" />
            <div className="h-12 bg-white/[0.02] rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
