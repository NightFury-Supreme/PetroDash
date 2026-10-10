import React from 'react';
import { Gift, Users } from 'lucide-react';
import { SettingsRow } from '../Shared';
import { TabProps } from '../types';

export function ReferralsTab({ formData, updateFormData, saveSection, loading }: TabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Referral Settings</h3>
            <p className="mt-2 text-sm text-white/35">Configure coin rewards for invites</p>
          </div>
        </div>

        <div className="divide-y divide-white/[0.06]">
          <SettingsRow icon={<Gift />} label="Coins to Referrer" description="Amount of coins given to the person who invited someone." displayValue={formData.referrals?.referrerCoins} onSave={() => saveSection({ referrals: formData.referrals }, 'Referral settings updated.')}>
            <input
              type="number"
              className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
              placeholder="50"
              value={Number(formData.referrals?.referrerCoins ?? 0)}
              onChange={(e) => updateFormData('referrals.referrerCoins', Number(e.target.value))}
              disabled={loading}
              min={0}
            />
          </SettingsRow>
          <SettingsRow icon={<Gift />} label="Coins to Referred User" description="Amount of coins given to the new user who joined using an invite." displayValue={formData.referrals?.referredCoins} onSave={() => saveSection({ referrals: formData.referrals }, 'Referral settings updated.')}>
            <input
              type="number"
              className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
              placeholder="25"
              value={Number(formData.referrals?.referredCoins ?? 0)}
              onChange={(e) => updateFormData('referrals.referredCoins', Number(e.target.value))}
              disabled={loading}
              min={0}
            />
          </SettingsRow>
          <SettingsRow icon={<Users />} label="Min Invites for Custom Code" description="Minimum number of invites required to set a custom referral code." displayValue={formData.referrals?.customCodeMinInvites} onSave={() => saveSection({ referrals: formData.referrals }, 'Referral settings updated.')}>
            <input
              type="number"
              className="h-9 w-full max-w-md rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 border-[#FF5722]/50 focus:ring-[#FF5722]/50"
              placeholder="10"
              value={Number(formData.referrals?.customCodeMinInvites ?? 10)}
              onChange={(e) => updateFormData('referrals.customCodeMinInvites', Number(e.target.value))}
              disabled={loading}
              min={0}
            />
          </SettingsRow>
        </div>
      </section>
    </div>
  );
}
