/* ==========================================================================
   User Detail Header Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<100 lines)
========================================================================== */

"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

export function UserDetailHeader() {
  const t = useTranslations('admin.users');

  return (
    <header>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="h-10 w-10 flex items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/[0.04] hover:text-white transition-all"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">
              {t('userManagement')}
            </h1>
            <p className="text-[#888888] mt-1 text-sm">
              {t('userManagementDesc')}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default UserDetailHeader;
