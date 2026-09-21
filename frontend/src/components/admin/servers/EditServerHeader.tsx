/* ==========================================================================
   Edit Server Header Component (Legacy Support)
   Compliance: ISO/IEC 25010, Clean Architecture
========================================================================== */

'use client';

import React from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Server } from 'lucide-react';

export default function EditServerHeader() {
  const t = useTranslations('admin.servers');

  return (
    <div className="flex items-center gap-3 mb-8">
      <Link href="/admin/servers" className="p-2 rounded-lg text-[#888] hover:text-white hover:bg-[#161616] transition-colors">
        <ArrowLeft size={18} />
      </Link>
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl flex items-center justify-center shadow-lg">
        <Server className="text-white" size={24} />
      </div>
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold">{t('editServerTitle')}</h1>
        <p className="text-[#AAAAAA] text-base sm:text-lg">{t('updateConfigSubtitle')}</p>
      </div>
    </div>
  );
}

export { EditServerHeader };
