"use client";

import Link from 'next/link';

export default function CouponsHeader({ total }: { total: number }) {
  return (
    <div className="flex items-center justify-end">
      <Link href="/admin/store/coupons/new" className="bg-white hover:bg-gray-100 text-black px-4 py-2 text-sm rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-sm">
        <i className="fas fa-plus"></i>
        Create New Coupon
      </Link>
    </div>
  );
}
