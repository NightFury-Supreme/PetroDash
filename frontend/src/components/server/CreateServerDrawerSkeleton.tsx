import React from "react";

export function CreateServerDrawerSkeleton() {
  return (
    <div className="flex flex-col min-h-[300px] animate-in fade-in duration-300 w-full">
      {/* Horizontal Step Indicator Skeleton */}
      <div className="flex items-center justify-between mb-8">
        {[...Array(4)].map((_, idx) => (
          <React.Fragment key={idx}>
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#161616] border border-[#222] animate-pulse" />
            {idx < 3 && (
              <div className="flex-1 h-px mx-4 bg-[#222] animate-pulse" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content Skeleton */}
      <div className="flex-1 pb-8 min-w-0">
        <section>
          <div className="h-6 w-40 rounded bg-[#161616] animate-pulse" />
          <div className="mt-1.5 h-4 w-64 rounded bg-[#161616] animate-pulse" />

          <div className="mb-2 mt-5 h-4 w-24 rounded bg-[#161616] animate-pulse" />
          <div className="h-[42px] w-full rounded-lg border border-[#222] bg-[#161616] animate-pulse" />
        </section>

        <section className="mt-8">
          <div className="h-6 w-32 rounded bg-[#161616] animate-pulse" />
          <div className="mt-1 h-4 w-56 rounded bg-[#161616] animate-pulse" />

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="relative group">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3.5 w-3.5 rounded bg-[#161616] animate-pulse" />
                    <div className="h-4 w-20 rounded bg-[#161616] animate-pulse" />
                  </div>
                  <div className="h-3 w-16 rounded bg-[#161616] animate-pulse" />
                </div>
                <div className="h-[42px] w-full rounded-lg border border-[#222] bg-[#161616] animate-pulse" />
                <div className="mt-3 flex items-center justify-between w-full">
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex flex-1 gap-[2px]">
                      {[...Array(40)].map((_, j) => (
                        <span key={j} className="h-3 flex-1 rounded-[2px] bg-[#222] animate-pulse" />
                      ))}
                    </div>
                    <div className="h-4 w-8 rounded bg-[#161616] animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
