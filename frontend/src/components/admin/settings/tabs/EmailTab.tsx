import React from 'react';
import { Mail } from 'lucide-react';
import { SettingsDrawerRow } from '../Shared';
import { TabProps } from '../types';

export function EmailTab({ formData, updateFormData, saveSection, loading }: TabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Email Settings</h3>
            <p className="mt-2 text-sm text-white/35">Configure SMTP and email verification</p>
          </div>
        </div>
        
        <div className="divide-y divide-white/[0.06]">
          {/* Email Configuration */}
          <SettingsDrawerRow 
            icon={<Mail />} 
            label="Email Configuration" 
            description="Configure your email server settings for outgoing emails." 
            enabled={formData.payments?.smtp?.enabled ?? false}
            onToggle={async (enabled) => { updateFormData('payments.smtp.enabled', enabled); await saveSection({ payments: { smtp: { ...formData.payments?.smtp, enabled } } as any }, `Email Configuration ${enabled ? 'enabled' : 'disabled'}`); }}
            onSave={async () => await saveSection({ payments: { smtp: formData.payments?.smtp } as any }, 'SMTP settings updated.')}
          >
             <div className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="flex flex-col">
                     <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">SMTP Host</label>
                     <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="smtp.example.com" value={formData.payments?.smtp?.host || ''} onChange={(e) => updateFormData('payments.smtp.host', e.target.value)} disabled={loading} />
                   </div>
                   <div className="flex flex-col">
                     <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">SMTP Port</label>
                     <input type="number" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="587" value={formData.payments?.smtp?.port || ''} onChange={(e) => updateFormData('payments.smtp.port', parseInt(e.target.value) || '')} disabled={loading} />
                   </div>
                   <div className="flex flex-col">
                     <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">SMTP Username</label>
                     <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="user@example.com" value={formData.payments?.smtp?.user || ''} onChange={(e) => updateFormData('payments.smtp.user', e.target.value)} disabled={loading} />
                   </div>
                   <div className="flex flex-col">
                     <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">SMTP Password</label>
                     <input type="password" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder={formData.payments?.smtp?.pass === '***' ? '••••••••••••••••••••••••' : 'Enter SMTP Password'} value={formData.payments?.smtp?.pass === '***' ? '' : (formData.payments?.smtp?.pass || '')} onChange={(e) => updateFormData('payments.smtp.pass', e.target.value)} disabled={loading} />
                     {formData.payments?.smtp?.pass === '***' && (
                       <p className="mt-1.5 text-[11px] text-[#777]">Secret is securely configured. Leave blank to keep.</p>
                     )}
                   </div>
                   <div className="flex flex-col md:col-span-2">
                     <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">From Email Address</label>
                     <input type="email" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="noreply@example.com" value={formData.payments?.smtp?.fromEmail || ''} onChange={(e) => updateFormData('payments.smtp.fromEmail', e.target.value)} disabled={loading} />
                     <p className="mt-2 text-[11px] text-[#555]">This email address will be used as the sender for all outgoing emails.</p>
                   </div>
                 </div>
                 
                 <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                   <div className="flex flex-col">
                     <span className="text-sm font-medium text-[#D4D4D4] mb-0.5">Enable TLS/SSL</span>
                     <span className="text-xs text-[#888]">Use a secure connection</span>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" className="sr-only peer" checked={formData.payments?.smtp?.secure || false} onChange={(e) => updateFormData('payments.smtp.secure', e.target.checked)} disabled={loading} />
                     <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                   </label>
                 </div>
             </div>
          </SettingsDrawerRow>
        </div>
      </section>
    </div>
  );
}
