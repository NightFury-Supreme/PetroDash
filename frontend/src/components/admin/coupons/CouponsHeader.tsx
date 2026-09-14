"use client";

export default function CouponsHeader({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-white">Coupons</h2>
        <p className="mt-0.5 text-xs text-[#666]">Manage promotional codes and discounts.</p>
      </div>
      <div className="flex items-center justify-end">
        <button onClick={onCreateNew} className="bg-white hover:bg-gray-100 text-black px-4 py-2 text-sm rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-sm">
          <i className="fas fa-plus"></i>
          Create New Coupon
        </button>
      </div>
    </>
  );
}
