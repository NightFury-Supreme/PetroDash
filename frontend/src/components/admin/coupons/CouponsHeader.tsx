"use client";

import Link from 'next/link';

export default function CouponsHeader({ total }: { total: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-[#202020] rounded-2xl flex items-center justify-center shadow-lg">
          <i className="fas fa-tag text-white text-2xl"></i>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Coupons</h1>
          <p className="text-[#AAAAAA] text-base sm:text-lg">Manage discounts • {total}</p>
        </div>
      </div>
      <Link href="/admin/coupons/new" className="px-4 py-2 rounded-md bg-white text-black border border-[var(--border)]">
        New Coupon
      </Link>
    </div>
  );
}


