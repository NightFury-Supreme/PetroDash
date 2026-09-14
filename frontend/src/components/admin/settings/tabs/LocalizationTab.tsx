import React from 'react';
import { Coins, Clock } from 'lucide-react';
import { SettingsRow, SettingsDropdown } from '../Shared';
import { TabProps } from '../types';

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
      } catch (e) {
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
  } catch (e) {
    return [{ value: 'UTC', label: '(UTC+00:00) Coordinated Universal Time' }];
  }
})();

export function LocalizationTab({ formData, updateFormData, saveSection, loading }: TabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Localization Settings</h3>
            <p className="mt-2 text-sm text-white/35">Configure global language and currency</p>
          </div>
        </div>
        
        <div className="divide-y divide-white/[0.06]">
          <SettingsRow icon={<Coins />} label="Site Currency" description="This currency is displayed on the shop and all plans." onSave={() => saveSection({ localization: formData.localization }, 'Localization settings updated.')}>
            <SettingsDropdown
              value={formData.localization?.currency || 'USD'}
              onChange={async (val) => {
                updateFormData('localization.currency', val);
                await saveSection({ localization: { ...formData.localization, currency: val } as any }, 'Localization settings updated.');
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
            />
          </SettingsRow>

          <SettingsRow icon={<Clock />} label="Timezone" description="Global timezone for logs and timestamps." onSave={() => saveSection({ localization: formData.localization }, 'Localization settings updated.')}>
            <SettingsDropdown
              value={formData.localization?.timezone || 'UTC'}
              onChange={async (val) => {
                updateFormData('localization.timezone', val);
                await saveSection({ localization: { ...formData.localization, timezone: val } as any }, 'Localization settings updated.');
              }}
              disabled={loading}
              options={TIMEZONE_OPTIONS}
            />
          </SettingsRow>
        </div>
      </section>
    </div>
  );
}
