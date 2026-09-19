"use client";

export default function CouponsHeader({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <div className="mt-8 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Coupons</h2>
        <p className="mt-0.5 text-xs text-[#666]">Manage promotional codes and discounts.</p>
      </div>
      <div className="flex items-center shrink-0">
        <button onClick={onCreateNew} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-[#FF5722] text-white hover:bg-[#ff6939]">
          <i className="fas fa-plus"></i>
          Create New Coupon
        </button>
      </div>
    </div>
  );
}
