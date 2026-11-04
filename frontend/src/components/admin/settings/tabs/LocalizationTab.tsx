import React from 'react';
import { Coins, Clock } from 'lucide-react';
import { SettingsRow } from '../Shared';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { TabProps } from '../types';
import { useTranslations } from 'next-intl';
import { useAdminTabSettings } from '@/hooks/admin/settings';
import { AdminSettingsTabSkeleton } from '@/components/skeletons/admin/settings';

const TIMEZONE_OPTIONS = (() => {
  try {
    const d = new Date();
    const seen = new Set<string>();
    const options: { value: string; label: string }[] = [];
    
    for (const tz of Intl.supportedValuesOf('timeZone')) {
      try {
        const offsetRaw = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
          .formatToParts(d).find(p => p.type === 'timeZoneName')?.value;
        const longGeneric = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longGeneric' })
          .formatToParts(d).find(p => p.type === 'timeZoneName')?.value;
          
        if (offsetRaw && longGeneric) {
          let formattedOffset = 'UTC+00:00';
          if (offsetRaw !== 'GMT') {
            const p = offsetRaw.replace('GMT', '').split(':');
            const sign = p[0][0];
            let hr = p[0].substring(1);
            if (hr.length === 1) hr = '0' + hr;
            const min = p[1] || '00';
            formattedOffset = `UTC${sign}${hr}:${min}`;
          }
          
          const label = `(${formattedOffset}) ${longGeneric}`;
          if (!seen.has(label)) {
            seen.add(label);
            options.push({ value: tz, label });
          }
        }
      } catch {
      }
    }
    
    options.sort((a, b) => {
      const getMin = (label: string) => {
        const match = label.match(/UTC([+-])(\d{2}):(\d{2})/);
        if (!match) return 0;
        const mins = parseInt(match[2]) * 60 + parseInt(match[3]);
        return match[1] === '-' ? -mins : mins;
      };
      return getMin(a.label) - getMin(b.label);
    });
    
    return options.length > 0 ? options : [{ value: 'UTC', label: '(UTC+00:00) Coordinated Universal Time' }];
  } catch {
    return [{ value: 'UTC', label: '(UTC+00:00) Coordinated Universal Time' }];
  }
})();

export function LocalizationTab(props?: Partial<TabProps>) {
  const t = useTranslations('AdminSettings');

  const tabHook = useAdminTabSettings('localization', {
    localization: { currency: 'USD', timezone: 'UTC' }
  });

  const formData = props?.formData || tabHook.formData;
  const updateFormData = props?.updateFormData || tabHook.updateFormData;
  const saveSection = props?.saveSection || tabHook.saveSection;
  const loading = props?.loading ?? (tabHook.loading || tabHook.saving);

  if (!props?.formData && tabHook.loading) {
    return <AdminSettingsTabSkeleton rows={2} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{t('localizationSettingsTitle')}</h3>
            <p className="mt-2 text-sm text-white/35">{t('localizationSettingsDesc')}</p>
          </div>
        </div>
        
        <div className="divide-y divide-white/[0.06]">
          <SettingsRow icon={<Coins />} label={t('siteCurrency')} description={t('siteCurrencyDesc')} onSave={() => saveSection({ localization: formData.localization }, t('localizationSettingsUpdated'))}>
            <SelectDropdown
              value={formData.localization?.currency || 'USD'}
              onChange={async (val) => {
                updateFormData('localization.currency', val);
                await saveSection({ localization: { ...formData.localization, currency: val } }, t('localizationSettingsUpdated'));
              }}
              disabled={loading}
              options={[
                { value: 'USD', label: 'USD - US Dollar' },
                { value: 'EUR', label: 'EUR - Euro' },
                { value: 'GBP', label: 'GBP - British Pound' },
                { value: 'INR', label: 'INR - Indian Rupee' },
                { value: 'CAD', label: 'CAD - Canadian Dollar' },
                { value: 'AUD', label: 'AUD - Australian Dollar' },
                { value: 'JPY', label: 'JPY - Japanese Yen' },
                { value: 'CHF', label: 'CHF - Swiss Franc' },
                { value: 'NZD', label: 'NZD - New Zealand Dollar' },
                { value: 'SEK', label: 'SEK - Swedish Krona' },
                { value: 'DKK', label: 'DKK - Danish Krone' },
                { value: 'NOK', label: 'NOK - Norwegian Krone' },
                { value: 'PLN', label: 'PLN - Polish Złoty' },
                { value: 'CZK', label: 'CZK - Czech Koruna' },
                { value: 'HUF', label: 'HUF - Hungarian Forint' },
                { value: 'BRL', label: 'BRL - Brazilian Real' },
                { value: 'MXN', label: 'MXN - Mexican Peso' },
                { value: 'SGD', label: 'SGD - Singapore Dollar' },
                { value: 'HKD', label: 'HKD - Hong Kong Dollar' },
                { value: 'CNY', label: 'CNY - Chinese Yuan' },
                { value: 'KRW', label: 'KRW - South Korean Won' },
                { value: 'ILS', label: 'ILS - Israeli Shekel' },
                { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
                { value: 'TWD', label: 'TWD - Taiwan Dollar' },
                { value: 'PHP', label: 'PHP - Philippine Peso' },
                { value: 'THB', label: 'THB - Thai Baht' }
              ]}
              className="w-full max-w-md"
              buttonClassName="h-[42px] px-4 text-sm bg-[#121212] border border-[#282828] text-[#D4D4D4] hover:text-white hover:bg-[#151515] hover:border-[#454545] focus:border-[#454545] transition-colors"
              menuClassName="bg-[#121212] border border-[#282828] max-h-[260px]"
            />
          </SettingsRow>

          <SettingsRow icon={<Clock />} label={t('timezone')} description={t('timezoneDesc')} onSave={() => saveSection({ localization: formData.localization }, t('localizationSettingsUpdated'))}>
            <SelectDropdown
              value={formData.localization?.timezone || 'UTC'}
              onChange={async (val) => {
                updateFormData('localization.timezone', val);
                await saveSection({ localization: { ...formData.localization, timezone: val } }, t('localizationSettingsUpdated'));
              }}
              disabled={loading}
              options={TIMEZONE_OPTIONS}
              className="w-full max-w-md"
              buttonClassName="h-[42px] px-4 text-sm bg-[#121212] border border-[#282828] text-[#D4D4D4] hover:text-white hover:bg-[#151515] hover:border-[#454545] focus:border-[#454545] transition-colors"
              menuClassName="bg-[#121212] border border-[#282828] max-h-[260px]"
            />
          </SettingsRow>
        </div>
      </section>
    </div>
  );
}
