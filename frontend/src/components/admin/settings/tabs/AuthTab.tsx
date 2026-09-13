import React from 'react';
import { Mail } from 'lucide-react';
import { SettingsDrawerRow } from '../Shared';
import { TabProps } from '../types';

export function AuthTab({ formData, updateFormData, saveSection, loading }: TabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">Authentication Settings</h3>
            <p className="mt-2 text-sm text-white/35">Configure login methods and OAuth options</p>
          </div>
        </div>
        
        <div className="divide-y divide-white/[0.06]">
          {/* Email Login */}
          <SettingsDrawerRow 
            icon={<Mail />} 
            label="Email Login" 
            description="Allow users to register and login with email and password" 
            enabled={formData.auth?.emailLogin ?? true} 
            onToggle={async (enabled) => { updateFormData('auth.emailLogin', enabled); await saveSection({ auth: { ...formData.auth, emailLogin: enabled } as any }, `Email login ${enabled ? 'enabled' : 'disabled'}`); }} 
            onSave={async () => await saveSection({ auth: formData.auth }, 'Email login settings updated.')}
          >
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <div className="flex flex-col">
                   <span className="text-sm font-medium text-[#D4D4D4] mb-0.5">Enable Email Verification</span>
                   <span className="text-xs text-[#888]">Require users to verify their email before accessing the dashboard.</span>
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
            icon={<i className="fab fa-discord"></i>} 
            label="Discord Login" 
            description="Allow users to login using their Discord account" 
            enabled={formData.auth?.discord?.enabled || false} 
            onToggle={async (enabled) => { updateFormData('auth.discord.enabled', enabled); await saveSection({ auth: { ...formData.auth, discord: { ...formData.auth?.discord, enabled } } as any }, `Discord login ${enabled ? 'enabled' : 'disabled'}`); }} 
            onSave={async () => await saveSection({ auth: formData.auth }, 'Authentication settings updated.')}
          >
             <div className="space-y-5">
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Discord Client ID</label>
                 <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="Enter Discord Client ID" value={formData.auth?.discord?.clientId || ''} onChange={(e) => updateFormData('auth.discord.clientId', e.target.value)} disabled={loading} />
               </div>
               <div>
                   <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Discord Client Secret</label>
                 <input type="password" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" 
                 placeholder={formData.auth?.discord?.clientSecret === '***' ? '••••••••••••••••••••••••' : 'Enter Discord Client Secret'} 
                 value={formData.auth?.discord?.clientSecret === '***' ? '' : (formData.auth?.discord?.clientSecret || '')} 
                 onChange={(e) => updateFormData('auth.discord.clientSecret', e.target.value)} disabled={loading} />
                 {formData.auth?.discord?.clientSecret === '***' && (
                   <p className="mt-1.5 text-[11px] text-[#777]">Secret is securely configured. Leave blank to keep.</p>
                 )}
                 </div>
               
               <div className="pt-3 border-t border-white/[0.06]">
                 <div className="flex items-center justify-between mb-2">
                   <div className="flex flex-col">
                     <span className="text-sm font-medium text-[#D4D4D4] mb-0.5">Auto-Join Discord Server</span>
                     <span className="text-xs text-[#888]">Automatically add users to your Discord server when they login</span>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" className="sr-only peer" checked={formData.auth?.discord?.autoJoin || false} onChange={(e) => updateFormData('auth.discord.autoJoin', e.target.checked)} disabled={loading} />
                     <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                   </label>
                 </div>
                 
                 {formData.auth?.discord?.autoJoin && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                     <div>
                       <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Discord Guild ID</label>
                       <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="Enter Discord Guild (Server) ID" value={formData.auth?.discord?.guildId || ''} onChange={(e) => updateFormData('auth.discord.guildId', e.target.value)} disabled={loading} />
                     </div>
                     <div>
                       <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Discord Bot Token</label>
                       <input type="password" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" 
                       placeholder={formData.auth?.discord?.botToken === '***' ? '••••••••••••••••••••••••' : 'Enter Discord Bot Token'} 
                       value={formData.auth?.discord?.botToken === '***' ? '' : (formData.auth?.discord?.botToken || '')} 
                       onChange={(e) => updateFormData('auth.discord.botToken', e.target.value)} disabled={loading} />
                       {formData.auth?.discord?.botToken === '***' && (
                         <p className="mt-1.5 text-[11px] text-[#777]">Secret is securely configured. Leave blank to keep.</p>
                       )}
                     </div>
                   </div>
                 )}
               </div>
             </div>
             
             <div className="pt-6 mt-6 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fab fa-discord text-lg text-white"></i>
                  <h4 className="text-sm font-semibold text-white">Setup Instructions</h4>
                </div>
                <ol className="space-y-2 list-decimal list-inside text-xs text-[#888]">
                  <li>Go to <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">discord.com/developers/applications</a></li>
                  <li>Create a new application or select an existing one</li>
                  <li>Go to <strong>OAuth2</strong> → <strong>General</strong></li>
                  <li>Add this redirect URI: <code className="bg-[#181818] px-1.5 py-0.5 rounded text-[#D4D4D4]">{process.env.NEXT_PUBLIC_API_BASE}/api/oauth/discord/callback</code></li>
                  <li>Copy <strong>Client ID</strong> and <strong>Client Secret</strong> to the fields above</li>
                  <li><strong>For Auto-Join:</strong> Go to <strong>Bot</strong> → <strong>Create Bot</strong> → Copy <strong>Bot Token</strong></li>
                  <li><strong>For Auto-Join:</strong> Enable <strong>SERVER MEMBERS INTENT</strong> in Bot settings</li>
                  <li><strong>For Auto-Join:</strong> Invite bot to your server with <strong>Manage Server</strong> permission</li>
                  <li><strong>For Auto-Join:</strong> Get your server ID (right-click server → Copy Server ID)</li>
                </ol>
             </div>
          </SettingsDrawerRow>

          {/* Google Login */}
          <SettingsDrawerRow 
            icon={<i className="fab fa-google"></i>} 
            label="Google Login" 
            description="Allow users to login using their Google account" 
            enabled={formData.auth?.google?.enabled || false} 
            onToggle={async (enabled) => { updateFormData('auth.google.enabled', enabled); await saveSection({ auth: { ...formData.auth, google: { ...formData.auth?.google, enabled } } as any }, `Google login ${enabled ? 'enabled' : 'disabled'}`); }} 
            onSave={async () => await saveSection({ auth: formData.auth }, 'Authentication settings updated.')}
          >
             <div className="space-y-4">
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Google Client ID</label>
                 <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="Enter Google Client ID" value={formData.auth?.google?.clientId || ''} onChange={(e) => updateFormData('auth.google.clientId', e.target.value)} disabled={loading} />
               </div>
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Google Client Secret</label>
                 <input type="password" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" 
                 placeholder={formData.auth?.google?.clientSecret === '***' ? '••••••••••••••••••••••••' : 'Enter Google Client Secret'} 
                 value={formData.auth?.google?.clientSecret === '***' ? '' : (formData.auth?.google?.clientSecret || '')} 
                 onChange={(e) => updateFormData('auth.google.clientSecret', e.target.value)} disabled={loading} />
                 {formData.auth?.google?.clientSecret === '***' && (
                   <p className="mt-1.5 text-[11px] text-[#777]">Secret is securely configured. Leave blank to keep.</p>
                 )}
               </div>
             </div>
             
             <div className="pt-6 mt-6 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fab fa-google text-lg text-white"></i>
                  <h4 className="text-sm font-semibold text-white">Setup Instructions</h4>
                </div>
                <ol className="space-y-2 list-decimal list-inside text-xs text-[#888]">
                  <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">Google Cloud Console</a></li>
                  <li>Create a new project or select an existing one</li>
                  <li>Configure <strong>OAuth consent screen</strong> (Internal/External)</li>
                  <li>Go to <strong>Credentials</strong> → <strong>Create Credentials</strong> → <strong>OAuth client ID</strong></li>
                  <li>Application type: <strong>Web application</strong></li>
                  <li>Authorized redirect URIs: <code className="bg-[#181818] px-1.5 py-0.5 rounded text-[#D4D4D4]">{process.env.NEXT_PUBLIC_API_BASE}/api/oauth/google/callback</code></li>
                  <li>Copy <strong>Client ID</strong> and <strong>Client Secret</strong> to the fields above</li>
                </ol>
             </div>
          </SettingsDrawerRow>
        </div>
      </section>
    </div>
  );
}
