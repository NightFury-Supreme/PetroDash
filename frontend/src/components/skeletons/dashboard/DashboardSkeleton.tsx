import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col h-full">

      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="space-y-2">
          <div className="h-8 bg-[#202020] rounded w-64 animate-pulse"></div>
          <div className="h-4 bg-[#202020] rounded w-48 animate-pulse"></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-28 h-8 bg-[#202020] rounded-md animate-pulse"></div>
          <div className="w-8 h-8 bg-[#202020] rounded-md animate-pulse"></div>
        </div>
      </div>

      {/* Metrics Row */}
      <section className="grid grid-cols-1 border-y border-white/[0.06] divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex flex-col px-6 py-5 sm:border-r sm:border-white/[0.06] last:border-r-0">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#222] rounded animate-pulse" />
              <div className="w-16 h-3 bg-[#222] rounded animate-pulse" />
            </div>
            <div className="mt-3 w-20 h-8 bg-[#2a2a2a] rounded animate-pulse" />
            <div className="mt-2 flex items-center gap-2">
              <div className="w-10 h-3 bg-[#222] rounded animate-pulse" />
              <div className="w-12 h-3 bg-[#2a2a2a] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </section>

      {/* Chart and Resource Usage Row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 border-b border-white/[0.06] divide-y divide-white/[0.06] lg:divide-y-0">
        
        {/* Status panel skeleton */}
        <div className="lg:col-span-2 lg:border-r lg:border-white/[0.06]">
          <div className="flex flex-col h-[350px] overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#222] rounded animate-pulse"></div>
                <div className="w-24 h-4 bg-[#222] rounded animate-pulse"></div>
              </div>
              <div className="w-24 h-5 bg-[#222] rounded animate-pulse"></div>
            </div>
            <div className="flex-1 space-y-6 overflow-y-hidden">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mb-6">
                  <div className="flex justify-between mb-2">
                    <div className="w-16 h-3 bg-[#222] rounded animate-pulse"></div>
                    <div className="w-12 h-3 bg-[#222] rounded animate-pulse"></div>
                  </div>
                  <div className="w-full h-4 bg-[#222] rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resource usage panel skeleton */}
        <div className="lg:col-span-1">
          <div className="flex flex-col h-[350px] p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#222] rounded animate-pulse"></div>
                <div className="w-24 h-4 bg-[#222] rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex-1 space-y-6 mt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="mb-6">
                    <div className="flex justify-between mb-2">
                      <div className="w-16 h-3 bg-[#222] rounded animate-pulse"></div>
                      <div className="w-12 h-3 bg-[#222] rounded animate-pulse"></div>
                    </div>
                    <div className="w-full h-3 bg-[#222] rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
              <div className="mt-6 bg-[#1A1A1A] border border-white/[0.04] rounded-lg p-4 h-20 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Servers section skeleton */}
      <section>
        <div className="mb-5 flex items-end justify-between pt-7 px-5">
          <div className="space-y-2">
            <div className="w-20 h-5 bg-[#222] rounded animate-pulse"></div>
            <div className="w-32 h-3 bg-[#222] rounded animate-pulse"></div>
          </div>
        </div>
        
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-[9px] uppercase tracking-[0.13em] text-white/20">
                <th className="py-3 px-5">
                  <div className="w-20 h-3 bg-[#222] rounded animate-pulse"></div>
                </th>
                <th className="py-3 px-5">
                  <div className="w-12 h-3 bg-[#222] rounded animate-pulse"></div>
                </th>
                <th className="py-3 px-5">
                  <div className="w-10 h-3 bg-[#222] rounded animate-pulse"></div>
                </th>
                <th className="py-3 px-5">
                  <div className="w-14 h-3 bg-[#222] rounded animate-pulse"></div>
                </th>
                <th className="py-3 px-5">
                  <div className="w-10 h-3 bg-[#222] rounded animate-pulse"></div>
                </th>
                <th className="py-3 px-5">
                  <div className="w-16 h-3 bg-[#222] rounded animate-pulse"></div>
                </th>
                <th className="py-3 px-5">
                  <div className="w-10 h-3 bg-[#222] rounded animate-pulse"></div>
                </th>
                <th className="py-3 px-5 text-right">
                  <div className="w-12 h-3 bg-[#222] rounded animate-pulse ml-auto"></div>
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-5">
                    <div className="w-32 h-4 bg-[#2a2a2a] rounded animate-pulse"></div>
                  </td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-4 bg-[#2a2a2a] rounded animate-pulse"></div>
                      <div className="w-20 h-4 bg-[#2a2a2a] rounded animate-pulse"></div>
                    </div>
                  </td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#2a2a2a] rounded animate-pulse"></div>
                      <div className="w-24 h-4 bg-[#2a2a2a] rounded animate-pulse"></div>
                    </div>
                  </td>
                  <td className="py-3 px-5">
                    <div className="w-16 h-6 bg-[#2a2a2a] rounded animate-pulse"></div>
                  </td>
                  <td className="py-3 px-5">
                    <div className="w-16 h-4 bg-[#2a2a2a] rounded animate-pulse"></div>
                  </td>
                  <td className="py-3 px-5">
                    <div className="w-20 h-4 bg-[#2a2a2a] rounded animate-pulse"></div>
                  </td>
                  <td className="py-3 px-5">
                    <div className="w-20 h-4 bg-[#2a2a2a] rounded animate-pulse"></div>
                  </td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex justify-end gap-2">
                      <div className="w-7 h-7 bg-white/[0.02] border border-white/[0.04] rounded animate-pulse"></div>
                      <div className="w-7 h-7 bg-white/[0.02] border border-white/[0.04] rounded animate-pulse"></div>
                      <div className="w-7 h-7 bg-white/[0.02] border border-white/[0.04] rounded animate-pulse"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}


