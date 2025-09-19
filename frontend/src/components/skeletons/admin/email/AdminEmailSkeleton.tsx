"use client";

export default function AdminEmailSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#333] rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-8 w-48 bg-[#333] rounded animate-pulse" />
          <div className="h-5 w-80 bg-[#333] rounded animate-pulse" />
        </div>
      </div>

      {/* Tabs and Save Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 border-b border-[#2a2a2a] px-4">
          <div className="h-10 w-16 bg-[#333] rounded animate-pulse" />
          <div className="h-10 w-20 bg-[#333] rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-32 bg-[#333] rounded animate-pulse" />
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl">
        {/* Card Header */}
        <div className="flex items-center gap-3 p-6 border-b border-[#303030]">
          <div className="w-10 h-10 bg-[#202020] rounded-xl flex items-center justify-center animate-pulse">
            <div className="w-5 h-5 bg-[#333] rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-6 w-48 bg-[#333] rounded animate-pulse" />
            <div className="h-4 w-64 bg-[#333] rounded animate-pulse" />
          </div>
        </div>

        {/* Card Content - SMTP Form Skeleton */}
        <div className="p-6 space-y-6">
          {/* SMTP Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="h-4 w-16 bg-[#333] rounded animate-pulse" />
              <div className="h-10 w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-12 bg-[#333] rounded animate-pulse" />
              <div className="h-10 w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 bg-[#333] rounded animate-pulse" />
              <div className="h-10 w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 bg-[#333] rounded animate-pulse" />
              <div className="h-10 w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 bg-[#333] rounded animate-pulse" />
              <div className="h-10 w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-[#333] rounded animate-pulse" />
              <div className="h-10 w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded animate-pulse" />
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 bg-[#333] rounded animate-pulse" />
            <div className="h-6 w-12 bg-[#333] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}