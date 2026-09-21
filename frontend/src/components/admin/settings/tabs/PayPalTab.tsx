import React from 'react';
import { SettingsDrawerRow, SettingsDropdown } from '../Shared';
import { TabProps } from '../types';
import { useTranslations } from 'next-intl';

export function PayPalTab({ formData, updateFormData, saveSection, loading }: TabProps) {
  const t = useTranslations('AdminSettings');
  const tCommon = useTranslations('Common');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{t('paypalSettingsTitle')}</h3>
            <p className="mt-2 text-sm text-white/35">{t('paypalSettingsDesc')}</p>
          </div>
        </div>
        
        <div className="divide-y divide-white/[0.06]">
          <SettingsDrawerRow 
            icon={<i className="fab fa-paypal"></i>} 
            label={t('paypalPayments')} 
            description={t('paypalPaymentsDesc')} 
            enabled={formData.payments?.paypal?.enabled || false} 
            onToggle={async (enabled) => { updateFormData('payments.paypal.enabled', enabled); await saveSection({ payments: { ...formData.payments, paypal: { ...formData.payments?.paypal, enabled } as any } }, t('paypalPaymentsToggled', { status: enabled ? tCommon('enabled') : tCommon('disabled') })); }} 
            onSave={async () => await saveSection({ payments: { paypal: formData.payments.paypal } as any }, t('paypalSettingsUpdated'))}
          >
             <div className="space-y-4">
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">{t('environmentMode')}</label>
                 <SettingsDropdown
                   value={formData.payments?.paypal?.mode || 'sandbox'}
                   onChange={async (val) => updateFormData('payments.paypal.mode', val)}
                   disabled={loading}
                   options={[
                     { value: 'sandbox', label: t('sandboxTesting') },
                     { value: 'live', label: t('liveProduction') }
                   ]}
                 />
               </div>
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">{t('clientId')}</label>
                 <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder={t('enterPaypalClientId')} value={formData.payments?.paypal?.clientId || ''} onChange={(e) => updateFormData('payments.paypal.clientId', e.target.value)} disabled={loading} />
               </div>
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">{t('clientSecret')}</label>
                 <input type="password" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" 
                 placeholder={formData.payments?.paypal?.clientSecret === '***' ? '••••••••••••••••••••••••' : t('enterPaypalClientSecret')} 
                 value={formData.payments?.paypal?.clientSecret === '***' ? '' : (formData.payments?.paypal?.clientSecret || '')} 
                 onChange={(e) => updateFormData('payments.paypal.clientSecret', e.target.value)} disabled={loading} />
                 {formData.payments?.paypal?.clientSecret === '***' && (
                   <p className="mt-1.5 text-[11px] text-[#777]">{t('secretConfigured')}</p>
                 )}
               </div>
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">{t('webhookId')}</label>
                 <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder={t('enterPaypalWebhookId')} value={formData.payments?.paypal?.webhookId || ''} onChange={(e) => updateFormData('payments.paypal.webhookId', e.target.value)} disabled={loading} />
                 <p className="mt-2 text-[11px] text-[#555]">{t('configurePaypalWebhook')} <code className="bg-[#202020] px-1.5 py-0.5 rounded text-[#D4D4D4]">{process.env.NEXT_PUBLIC_API_BASE}/api/paypal/webhook</code></p>
               </div>
             </div>
             
             <div className="pt-6 mt-6 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fas fa-info-circle text-lg text-white"></i>
                  <h4 className="text-sm font-semibold text-white">{t('importantNotes')}</h4>
                </div>
                <ul className="space-y-2 text-xs text-[#888]">
                  <li>• {t('paypalNote1')}</li>
                  <li>• {t('paypalNote2')} <code className="bg-[#181818] px-1.5 py-0.5 rounded text-[#D4D4D4]">/plan/success</code> {t('and')} <code className="bg-[#181818] px-1.5 py-0.5 rounded text-[#D4D4D4]">/plan/cancel</code></li>
                  <li>• {t('paypalNote3')}</li>
                </ul>
             </div>
          </SettingsDrawerRow>
        </div>
      </section>
    </div>
  );
}
