import { useState } from 'react';
import { useModal } from '@/components/Modal';

interface Settings {
  siteName: string;
  siteIconUrl: string;
  payments: {
    paypal: {
      enabled: boolean;
      mode: 'sandbox' | 'live';
      clientId: string;
      clientSecret: string;
      currency: string;
      webhookId: string;
    };
  };
  defaults: {
    cpuPercent: number;
    memoryMb: number;
    diskMb: number;
    serverSlots: number;
    backups: number;
    allocations: number;
    databases: number;
    coins: number;
  };
  referrals?: { referrerCoins?: number; referredCoins?: number; customCodeMinInvites?: number };
}

interface AdminSettingsContentProps {
  settings: Settings;
  loading: boolean;
  onSave: (settings: Settings) => Promise<void>;
  onReload: () => void;
}

export function AdminSettingsContent({
  settings,
  loading,
  onSave,
  onReload
}: AdminSettingsContentProps) {
  const [formData, setFormData] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);
  const modal = useModal();

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      await modal.success({
        title: "Settings Saved",
        body: "Your settings have been successfully updated."
      });
    } catch (error) {
      await modal.error({
        title: "Save Failed",
        body: error instanceof Error ? error.message : "Failed to save settings. Please try again."
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReload = async () => {
    try {
      onReload();
      await modal.success({
        title: "Settings Reloaded",
        body: "Settings have been reloaded from the server."
      });
    } catch (error) {
      await modal.error({
        title: "Reload Failed",
        body: error instanceof Error ? error.message : "Failed to reload settings. Please try again."
      });
    }
  };

  const updateFormData = (path: string, value: unknown) => {
    const keys = path.split('.');
    const newData = { ...formData };
    let current: Record<string, unknown> = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]] as Record<string, unknown>;
    }
    
    current[keys[keys.length - 1]] = value;
    setFormData(newData);
  };

  return (
    <div className="space-y-6">
      {/* Brand Settings */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#202020] rounded-xl flex items-center justify-center">
            <i className="fas fa-palette text-white text-lg"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Brand Settings</h3>
            <p className="text-[#AAAAAA] text-sm">Customize your site appearance</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Site Name</label>
            <input
              type="text"
              className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors"
              placeholder="Enter site name"
              value={formData.siteName || ''}
              onChange={(e) => updateFormData('siteName', e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Icon URL</label>
            <input
              type="url"
              className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors"
              placeholder="https://example.com/icon.png"
              value={formData.siteIconUrl || ''}
              onChange={(e) => updateFormData('siteIconUrl', e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Referral Settings */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#202020] rounded-xl flex items-center justify-center">
            <i className="fas fa-user-plus text-white text-lg"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Referral Settings</h3>
            <p className="text-[#AAAAAA] text-sm">Configure coin rewards for invites</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Coins to Referrer</label>
            <input
              type="number"
              className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors"
              placeholder="50"
              value={Number(formData.referrals?.referrerCoins ?? 0)}
              onChange={(e) => updateFormData('referrals.referrerCoins', Number(e.target.value))}
              disabled={loading}
              min={0}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Coins to Referred User</label>
            <input
              type="number"
              className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors"
              placeholder="25"
              value={Number(formData.referrals?.referredCoins ?? 0)}
              onChange={(e) => updateFormData('referrals.referredCoins', Number(e.target.value))}
              disabled={loading}
              min={0}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Min Invites for Custom Code</label>
            <input
              type="number"
              className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors"
              placeholder="10"
              value={Number(formData.referrals?.customCodeMinInvites ?? 10)}
              onChange={(e) => updateFormData('referrals.customCodeMinInvites', Number(e.target.value))}
              disabled={loading}
              min={0}
            />
          </div>
        </div>
      </div>

      {/* Default Resources */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#202020] rounded-xl flex items-center justify-center">
            <i className="fas fa-server text-white text-lg"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Default Resources</h3>
            <p className="text-[#AAAAAA] text-sm">Set default resource allocations for new users</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {([
            ['cpuPercent', 'CPU (%)', 'Percentage of CPU allocated'],
            ['memoryMb', 'Memory (MB)', 'RAM in megabytes'],
            ['diskMb', 'Disk (MB)', 'Storage in megabytes'],
            ['serverSlots', 'Server Slots', 'Number of servers allowed'],
            ['backups', 'Backups', 'Number of backups allowed'],
            ['allocations', 'Allocations', 'Number of port allocations'],
            ['databases', 'Databases', 'Number of databases allowed'],
            ['coins', 'Coins', 'Starting coin balance']
          ] as [keyof Settings['defaults'], string, string][]).map(([key, label, tooltip]) => (
            <div key={key} className="space-y-2">
              <label className="block text-sm font-medium text-white" title={tooltip}>
                {label}
              </label>
              <input
                type="number"
                min="0"
                className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors"
                value={formData.defaults?.[key] || 0}
                onChange={(e) => updateFormData(`defaults.${key}`, Number(e.target.value))}
                disabled={loading}
              />
            </div>
          ))}
        </div>
      </div>

      {/* PayPal Settings */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#202020] rounded-xl flex items-center justify-center">
            <i className="fab fa-paypal text-blue-500 text-lg"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">PayPal Configuration</h3>
            <p className="text-[#AAAAAA] text-sm">Configure payment processing settings</p>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.payments?.paypal?.enabled || false}
                onChange={(e) => updateFormData('payments.paypal.enabled', e.target.checked)}
                disabled={loading}
              />
              <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
            <span className="text-white font-medium">Enable PayPal Payments</span>
          </div>

          {formData.payments?.paypal?.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Mode</label>
                <select
                  className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white focus:border-[#404040] focus:outline-none transition-colors"
                  value={formData.payments?.paypal?.mode || 'sandbox'}
                  onChange={(e) => updateFormData('payments.paypal.mode', e.target.value)}
                  disabled={loading}
                >
                  <option value="sandbox" className="bg-[#202020] text-white">Sandbox (Testing)</option>
                  <option value="live" className="bg-[#202020] text-white">Live (Production)</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Currency</label>
                <select
                  className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white focus:border-[#404040] focus:outline-none transition-colors"
                  value={formData.payments?.paypal?.currency || 'USD'}
                  onChange={(e) => updateFormData('payments.paypal.currency', e.target.value)}
                  disabled={loading}
                >
                  <option value="USD" className="bg-[#202020] text-white">USD - US Dollar</option>
                  <option value="EUR" className="bg-[#202020] text-white">EUR - Euro</option>
                  <option value="GBP" className="bg-[#202020] text-white">GBP - British Pound</option>
                  <option value="CAD" className="bg-[#202020] text-white">CAD - Canadian Dollar</option>
                  <option value="AUD" className="bg-[#202020] text-white">AUD - Australian Dollar</option>
                  <option value="JPY" className="bg-[#202020] text-white">JPY - Japanese Yen</option>
                  <option value="CHF" className="bg-[#202020] text-white">CHF - Swiss Franc</option>
                  <option value="NZD" className="bg-[#202020] text-white">NZD - New Zealand Dollar</option>
                  <option value="SEK" className="bg-[#202020] text-white">SEK - Swedish Krona</option>
                  <option value="DKK" className="bg-[#202020] text-white">DKK - Danish Krone</option>
                  <option value="NOK" className="bg-[#202020] text-white">NOK - Norwegian Krone</option>
                  <option value="PLN" className="bg-[#202020] text-white">PLN - Polish Złoty</option>
                  <option value="CZK" className="bg-[#202020] text-white">CZK - Czech Koruna</option>
                  <option value="HUF" className="bg-[#202020] text-white">HUF - Hungarian Forint</option>
                  <option value="BRL" className="bg-[#202020] text-white">BRL - Brazilian Real</option>
                  <option value="MXN" className="bg-[#202020] text-white">MXN - Mexican Peso</option>
                  <option value="SGD" className="bg-[#202020] text-white">SGD - Singapore Dollar</option>
                  <option value="HKD" className="bg-[#202020] text-white">HKD - Hong Kong Dollar</option>
                  <option value="KRW" className="bg-[#202020] text-white">KRW - South Korean Won</option>
                  <option value="INR" className="bg-[#202020] text-white">INR - Indian Rupee</option>
                  <option value="RUB" className="bg-[#202020] text-white">RUB - Russian Ruble</option>
                  <option value="TRY" className="bg-[#202020] text-white">TRY - Turkish Lira</option>
                  <option value="ZAR" className="bg-[#202020] text-white">ZAR - South African Rand</option>
                </select>
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-medium text-white">Client ID</label>
                <input
                  type="text"
                  className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors"
                  placeholder="Enter PayPal Client ID"
                  value={formData.payments?.paypal?.clientId || ''}
                  onChange={(e) => updateFormData('payments.paypal.clientId', e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-medium text-white">Client Secret</label>
                <input
                  type="password"
                  className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors"
                  placeholder="Enter PayPal Client Secret"
                  value={formData.payments?.paypal?.clientSecret || ''}
                  onChange={(e) => updateFormData('payments.paypal.clientSecret', e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-medium text-white">Webhook ID</label>
                <input
                  type="text"
                  className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors"
                  placeholder="Enter PayPal Webhook ID"
                  value={formData.payments?.paypal?.webhookId || ''}
                  onChange={(e) => updateFormData('payments.paypal.webhookId', e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-[#AAAAAA]">
                  Configure your PayPal Webhook to POST to <code className="bg-[#202020] px-2 py-1 rounded text-blue-400">{process.env.NEXT_PUBLIC_API_BASE}/api/paypal/webhook</code> and paste the Webhook ID here.
                </p>
              </div>
            </div>
          )}
          
          <div className="bg-[#202020] border border-[#303030] rounded-lg p-4">
            <div className="flex items-start gap-3">
              <i className="fas fa-info-circle text-blue-400 mt-1"></i>
              <div className="text-sm text-[#AAAAAA]">
                <p className="font-medium text-white mb-1">Important Notes:</p>
                <ul className="space-y-1">
                  <li>• Use sandbox credentials for testing, live credentials for production</li>
                  <li>• Return/cancel URLs are fixed at <code className="bg-[#181818] px-2 py-1 rounded">/plan/success</code> and <code className="bg-[#181818] px-2 py-1 rounded">/plan/cancel</code></li>
                  <li>• Ensure your PayPal app has the necessary permissions enabled</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-6 py-3 bg-white text-[#0b0b0f] font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Saving...
            </>
          ) : (
            <>
              <i className="fas fa-save"></i>
              Save Settings
            </>
          )}
        </button>
        
        <button
          onClick={handleReload}
          disabled={loading}
          className="px-6 py-3 bg-[#202020] text-white font-medium rounded-lg border border-[#303030] hover:bg-[#272727] hover:border-[#404040] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <i className="fas fa-sync-alt"></i>
          Reload
        </button>
      </div>
    </div>
  );
}
