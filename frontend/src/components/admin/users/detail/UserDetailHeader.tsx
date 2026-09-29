/* ==========================================================================
   User Detail Header Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<100 lines)
========================================================================== */

"use client";

import React from "react";
import { useTranslations } from "next-intl";

export function UserDetailHeader() {
  const t = useTranslations('admin.users');

  return (
    <header>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">
            {t('userManagement')}
          </h1>
          <p className="text-[#888888] mt-1 text-sm">
            {t('userManagementDesc')}
          </p>
        </div>
      </div>
    </header>
  );
}

export default UserDetailHeader;
