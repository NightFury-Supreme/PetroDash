import React from 'react';
import { useTranslations } from 'next-intl';
import { RefreshCw } from 'lucide-react';

interface AvatarOAuthSyncProps {
  hasDiscord?: boolean;
  hasGoogle?: boolean;
  syncingProvider: 'discord' | 'google' | null;
  disabled: boolean;
  onSync: (provider: 'discord' | 'google') => void;
}

export function AvatarOAuthSync({
  hasDiscord,
  hasGoogle,
  syncingProvider,
  disabled,
  onSync,
}: AvatarOAuthSyncProps) {
  const t = useTranslations('Profile');

  if (!hasDiscord && !hasGoogle) return null;

  return (
    <div className="pt-4 border-t border-white/[0.06] space-y-2.5">
      <p className="text-xs font-semibold text-[#888] uppercase tracking-wider">
        {t('syncOAuthAvatar')}
      </p>
      <div className="flex gap-2">
        {hasDiscord && (
          <button
            type="button"
            onClick={() => onSync('discord')}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 text-[#858FFA] text-xs py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncingProvider === 'discord' ? 'animate-spin' : ''}`} />
            {t('syncFromDiscord')}
          </button>
        )}
        {hasGoogle && (
          <button
            type="button"
            onClick={() => onSync('google')}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white text-xs py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncingProvider === 'google' ? 'animate-spin' : ''}`} />
            {t('syncFromGoogle')}
          </button>
        )}
      </div>
    </div>
  );
}
