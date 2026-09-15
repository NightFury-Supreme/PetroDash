"use client";

export default function CouponsHeader({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <div className="mt-8 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Coupons</h2>
        <p className="mt-0.5 text-xs text-[#666]">Manage promotional codes and discounts.</p>
      </div>
      <div className="flex items-center shrink-0">
        <button onClick={onCreateNew} className="bg-[#FF5722] hover:bg-[#ff6939] text-white h-[42px] px-4 text-sm rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm">
          <i className="fas fa-plus"></i>
          Create New Coupon
        </button>
      </div>
    </div>
  );
}
