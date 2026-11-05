'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Globe, Egg, ExternalLink } from 'lucide-react';
import { SafeImage } from '@/components/ui';
import type { AdminServer } from './types';

interface AdminEditServerHeaderBadgesProps {
  server: AdminServer;
  isSuspended: boolean;
}

export function AdminEditServerHeaderBadges({
  server,
  isSuspended,
}: AdminEditServerHeaderBadgesProps) {
  const t = useTranslations('admin.servers');

  return (
    <div className="flex items-center gap-2.5 text-xs text-[#888]">
      {server.location?.name && (
        <>
          <span className="inline-flex items-center gap-1.5 text-[#888]">
            {server.location?.flag ? (
              <SafeImage
                src={
                  server.location.flag.startsWith('http')
                    ? server.location.flag
                    : `${process.env.NEXT_PUBLIC_API_BASE || ''}${
                        server.location.flag.startsWith('/') ? '' : '/'
                      }${server.location.flag}`
                }
                alt=""
                className="w-3.5 h-3 object-cover rounded-[2px]"
                fallback={<Globe size={13} className="text-[#888] shrink-0" />}
              />
            ) : (
              <Globe size={13} className="text-[#888] shrink-0" />
            )}
            <span>{server.location.name}</span>
          </span>
          <span className="text-white/20 select-none">|</span>
        </>
      )}

      {server.egg?.name && (
        <>
          <span className="inline-flex items-center gap-1.5 text-[#888]">
            {server.egg?.icon ? (
              <SafeImage
                src={
                  server.egg.icon.startsWith('http')
                    ? server.egg.icon
                    : `${process.env.NEXT_PUBLIC_API_BASE || ''}${
                        server.egg.icon.startsWith('/') ? '' : '/'
                      }${server.egg.icon}`
                }
                alt=""
                className="w-3.5 h-3.5 object-contain"
                fallback={<Egg size={13} className="text-[#888] shrink-0" />}
              />
            ) : (
              <Egg size={13} className="text-[#888] shrink-0" />
            )}
            <span>{server.egg.name}</span>
          </span>
          <span className="text-white/20 select-none">|</span>
        </>
      )}

      {isSuspended ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
          {t('suspended')}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
          {t('active')}
        </span>
      )}

      {server.clientUrl && (
        <>
          <span className="text-white/20 select-none">|</span>
          <a
            href={server.clientUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center text-[#888] hover:text-[#D4D4D4] transition-colors"
            title={t('openServer')}
          >
            <ExternalLink size={13} />
          </a>
        </>
      )}
    </div>
  );
}

