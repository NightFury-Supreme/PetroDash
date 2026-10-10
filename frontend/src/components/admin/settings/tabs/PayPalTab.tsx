import React from 'react';
import { SettingsDrawerRow, SettingsDropdown } from '../Shared';
import { TabProps } from '../types';

export function PayPalTab({ formData, updateFormData, saveSection, loading }: TabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">PayPal Settings</h3>
            <p className="mt-2 text-sm text-white/35">Configure PayPal integration for payments</p>
          </div>
        </div>
        
        <div className="divide-y divide-white/[0.06]">
          <SettingsDrawerRow 
            icon={<i className="fab fa-paypal"></i>} 
            label="PayPal Payments" 
            description="Configure PayPal integration for payments" 
            enabled={formData.payments?.paypal?.enabled || false} 
            onToggle={async (enabled) => { updateFormData('payments.paypal.enabled', enabled); await saveSection({ payments: { ...formData.payments, paypal: { ...formData.payments?.paypal, enabled } as any } }, `PayPal payments ${enabled ? 'enabled' : 'disabled'}`); }} 
            onSave={async () => await saveSection({ payments: { paypal: formData.payments.paypal } as any }, 'PayPal settings updated.')}
          >
             <div className="space-y-4">
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Environment Mode</label>
                 <SettingsDropdown
                   value={formData.payments?.paypal?.mode || 'sandbox'}
                   onChange={async (val) => updateFormData('payments.paypal.mode', val)}
                   disabled={loading}
                   options={[
                     { value: 'sandbox', label: 'Sandbox (Testing)' },
                     { value: 'live', label: 'Live (Production)' }
                   ]}
                 />
               </div>
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Client ID</label>
                 <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="Enter PayPal Client ID" value={formData.payments?.paypal?.clientId || ''} onChange={(e) => updateFormData('payments.paypal.clientId', e.target.value)} disabled={loading} />
               </div>
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Client Secret</label>
                 <input type="password" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" 
                 placeholder={formData.payments?.paypal?.clientSecret === '***' ? '••••••••••••••••••••••••' : 'Enter PayPal Client Secret'} 
                 value={formData.payments?.paypal?.clientSecret === '***' ? '' : (formData.payments?.paypal?.clientSecret || '')} 
                 onChange={(e) => updateFormData('payments.paypal.clientSecret', e.target.value)} disabled={loading} />
                 {formData.payments?.paypal?.clientSecret === '***' && (
                   <p className="mt-1.5 text-[11px] text-[#777]">Secret is securely configured. Leave blank to keep.</p>
                 )}
               </div>
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Webhook ID</label>
                 <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="Enter PayPal Webhook ID" value={formData.payments?.paypal?.webhookId || ''} onChange={(e) => updateFormData('payments.paypal.webhookId', e.target.value)} disabled={loading} />
                 <p className="mt-2 text-[11px] text-[#555]">Configure your PayPal Webhook to POST to <code className="bg-[#202020] px-1.5 py-0.5 rounded text-[#D4D4D4]">{process.env.NEXT_PUBLIC_API_BASE}/api/paypal/webhook</code></p>
               </div>
             </div>
             
             <div className="pt-6 mt-6 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fas fa-info-circle text-lg text-white"></i>
                  <h4 className="text-sm font-semibold text-white">Important Notes</h4>
                </div>
                <ul className="space-y-2 text-xs text-[#888]">
                  <li>• Use sandbox credentials for testing, live credentials for production</li>
                  <li>• Return/cancel URLs are fixed at <code className="bg-[#181818] px-1.5 py-0.5 rounded text-[#D4D4D4]">/plan/success</code> and <code className="bg-[#181818] px-1.5 py-0.5 rounded text-[#D4D4D4]">/plan/cancel</code></li>
                  <li>• Ensure your PayPal app has the necessary permissions enabled</li>
                </ul>
             </div>
          </SettingsDrawerRow>
        </div>
      </section>
    </div>
  );
}
