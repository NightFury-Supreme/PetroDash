import React from 'react';
import { Mail } from 'lucide-react';
import { SettingsDrawerRow, DiscordIcon, GoogleIcon } from '../Shared';
import { TabProps, Settings } from '../types';
import { useTranslations } from 'next-intl';
import { useAdminTabSettings } from '@/hooks/admin/settings';
import { AdminSettingsTabSkeleton } from '@/components/skeletons/admin/settings';

const DEFAULT_AUTH_SETTINGS = {
  auth: {
    emailLogin: true,
    emailVerification: false,
    discord: {
      enabled: false,
      autoJoin: false,
      clientId: '',
      clientSecret: '',
      redirectUri: '',
      botToken: '',
      guildId: '',
    },
    google: {
      enabled: false,
      clientId: '',
      clientSecret: '',
      redirectUri: '',
    },
  },
} as unknown as Settings;

export function AuthTab(props?: Partial<TabProps>) {
  const t = useTranslations('AdminSettings');
  const tCommon = useTranslations('Common');

  const tabHook = useAdminTabSettings('auth', DEFAULT_AUTH_SETTINGS);

  const formData = (props?.formData || tabHook.formData) as Settings;
  const updateFormData = props?.updateFormData || tabHook.updateFormData;
  const saveSection = props?.saveSection || tabHook.saveSection;
  const loading = props?.loading ?? (tabHook.loading || tabHook.saving);

  if (!props?.formData && tabHook.loading) {
    return <AdminSettingsTabSkeleton rows={3} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{t('authSettingsTitle')}</h3>
            <p className="mt-2 text-sm text-white/35">{t('authSettingsDesc')}</p>
          </div>
        </div>
        
        <div className="divide-y divide-white/[0.06]">
          {/* Email Login */}
          <SettingsDrawerRow 
            icon={<Mail />} 
            label={t('emailLogin')} 
            description={t('emailLoginDesc')} 
            enabled={formData.auth?.emailLogin ?? true} 
            onToggle={async (enabled) => { updateFormData('auth.emailLogin', enabled); await saveSection({ auth: { ...formData.auth, emailLogin: enabled } }, t('emailLoginToggled', { status: enabled ? tCommon('enabled') : tCommon('disabled') })); }} 
            onSave={async () => await saveSection({ auth: formData.auth }, t('emailLoginSettingsUpdated'))}
          >
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <div className="flex flex-col">
                   <span className="text-sm font-medium text-[#D4D4D4] mb-0.5">{t('enableEmailVerification')}</span>
                   <span className="text-xs text-[#888]">{t('enableEmailVerificationDesc')}</span>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" className="sr-only peer" checked={formData.auth?.emailVerification || false} onChange={(e) => updateFormData('auth.emailVerification', e.target.checked)} disabled={loading} />
                   <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                 </label>
               </div>
             </div>
          </SettingsDrawerRow>
  
          {/* Discord Login */}
          <SettingsDrawerRow 
            icon={<DiscordIcon size={18} />} 
            label={t('discordLogin')} 
            description={t('discordLoginDesc')} 
            enabled={formData.auth?.discord?.enabled || false} 
            onToggle={async (enabled) => { updateFormData('auth.discord.enabled', enabled); await saveSection({ auth: { ...formData.auth, discord: { ...formData.auth?.discord, enabled } } }, t('discordLoginToggled', { status: enabled ? tCommon('enabled') : tCommon('disabled') })); }} 
            onSave={async () => await saveSection({ auth: formData.auth }, t('authSettingsUpdated'))}
          >
             <div className="space-y-5">
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">{t('discordClientId')}</label>
                 <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder={t('enterDiscordClientId')} value={formData.auth?.discord?.clientId || ''} onChange={(e) => updateFormData('auth.discord.clientId', e.target.value)} disabled={loading} />
               </div>
               <div>
                   <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">{t('discordClientSecret')}</label>
                 <input type="password" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" 
                 placeholder={formData.auth?.discord?.clientSecret === '***' ? '••••••••••••••••••••••••' : t('enterDiscordClientSecret')} 
                 value={formData.auth?.discord?.clientSecret === '***' ? '' : (formData.auth?.discord?.clientSecret || '')} 
                 onChange={(e) => updateFormData('auth.discord.clientSecret', e.target.value)} disabled={loading} />
                 {formData.auth?.discord?.clientSecret === '***' && (
                   <p className="mt-1.5 text-[11px] text-[#777]">{t('secretConfigured')}</p>
                 )}
                 </div>
               
               <div className="pt-3 border-t border-white/[0.06]">
                 <div className="flex items-center justify-between mb-2">
                   <div className="flex flex-col">
                     <span className="text-sm font-medium text-[#D4D4D4] mb-0.5">{t('autoJoinDiscord')}</span>
                     <span className="text-xs text-[#888]">{t('autoJoinDiscordDesc')}</span>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" className="sr-only peer" checked={formData.auth?.discord?.autoJoin || false} onChange={(e) => updateFormData('auth.discord.autoJoin', e.target.checked)} disabled={loading} />
                     <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                   </label>
                 </div>
                 
                 {formData.auth?.discord?.autoJoin && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                     <div>
                       <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">{t('discordGuildId')}</label>
                       <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder={t('enterDiscordGuildId')} value={formData.auth?.discord?.guildId || ''} onChange={(e) => updateFormData('auth.discord.guildId', e.target.value)} disabled={loading} />
                     </div>
                     <div>
                       <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">{t('discordBotToken')}</label>
                       <input type="password" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" 
                       placeholder={formData.auth?.discord?.botToken === '***' ? '••••••••••••••••••••••••' : t('enterDiscordBotToken')} 
                       value={formData.auth?.discord?.botToken === '***' ? '' : (formData.auth?.discord?.botToken || '')} 
                       onChange={(e) => updateFormData('auth.discord.botToken', e.target.value)} disabled={loading} />
                       {formData.auth?.discord?.botToken === '***' && (
                         <p className="mt-1.5 text-[11px] text-[#777]">{t('secretConfigured')}</p>
                       )}
                     </div>
                   </div>
                 )}
               </div>
             </div>
          </SettingsDrawerRow>
  
          {/* Google Login */}
          <SettingsDrawerRow 
            icon={<GoogleIcon size={18} />} 
            label={t('googleLogin')} 
            description={t('googleLoginDesc')} 
            enabled={formData.auth?.google?.enabled || false} 
            onToggle={async (enabled) => { updateFormData('auth.google.enabled', enabled); await saveSection({ auth: { ...formData.auth, google: { ...formData.auth?.google, enabled } } }, t('googleLoginToggled', { status: enabled ? tCommon('enabled') : tCommon('disabled') })); }} 
            onSave={async () => await saveSection({ auth: formData.auth }, t('authSettingsUpdated'))}
          >
             <div className="space-y-4">
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">{t('googleClientId')}</label>
                 <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder={t('enterGoogleClientId')} value={formData.auth?.google?.clientId || ''} onChange={(e) => updateFormData('auth.google.clientId', e.target.value)} disabled={loading} />
               </div>
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">{t('googleClientSecret')}</label>
                 <input type="password" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" 
                 placeholder={formData.auth?.google?.clientSecret === '***' ? '••••••••••••••••••••••••' : t('enterGoogleClientSecret')} 
                 value={formData.auth?.google?.clientSecret === '***' ? '' : (formData.auth?.google?.clientSecret || '')} 
                 onChange={(e) => updateFormData('auth.google.clientSecret', e.target.value)} disabled={loading} />
                 {formData.auth?.google?.clientSecret === '***' && (
                   <p className="mt-1.5 text-[11px] text-[#777]">{t('secretConfigured')}</p>
                 )}
               </div>
             </div>
          </SettingsDrawerRow>
        </div>
      </section>
    </div>
  );
}
