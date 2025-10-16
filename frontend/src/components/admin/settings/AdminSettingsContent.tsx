import { useState } from 'react';
import { useModal } from '@/components/Modal';
import { UpdateSystem } from '../updates';

interface Settings {
  siteName: string;
  siteIcon: string; // Changed from siteIconUrl to siteIcon
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
  auth: {
    emailLogin: boolean;
    discord: {
      enabled: boolean;
      autoJoin: boolean;
      clientId: string;
      clientSecret: string;
      redirectUri?: string;
      botToken: string;
      guildId: string;
    };
    google: {
      enabled: boolean;
      clientId: string;
      clientSecret: string;
      redirectUri?: string;
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
  adsense?: {
    enabled: boolean;
    publisherId: string;
    adSlots: {
      header: string;
      sidebar: string;
      footer: string;
      content: string;
      mobile: string;
    };
    adTypes: {
      display: boolean;
      text: boolean;
      link: boolean;
      inFeed: boolean;
      inArticle: boolean;
      matchedContent: boolean;
    };
  };
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
      // Clean up empty redirect URIs before saving
      const cleanedData = { ...formData };
      if (cleanedData.auth?.discord?.redirectUri === '') {
        delete cleanedData.auth.discord.redirectUri;
      }
      if (cleanedData.auth?.google?.redirectUri === '') {
        delete cleanedData.auth.google.redirectUri;
      }
      
      await onSave(cleanedData);
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
    
      // Prevent prototype pollution by checking for dangerous keys
      if (keys.some(key => key === '__proto__' || key === 'constructor' || key === 'prototype')) {
        return;
      }    // Create a safe object without prototype
    const newData = Object.create(null);
    Object.assign(newData, formData);
    let current: Record<string, unknown> = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
              // Additional check for each key in the path
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          return;
        }
      if (!current[key] || typeof current[key] !== 'object' || Array.isArray(current[key])) {
        current[key] = Object.create(null);
      }
      current = current[key] as Record<string, unknown>;
    }
    
    const finalKey = keys[keys.length - 1];
      // Final check before assignment
      if (finalKey !== '__proto__' && finalKey !== 'constructor' && finalKey !== 'prototype') {
        current[finalKey] = value;
        setFormData(newData);
      }
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
            <label className="block text-sm font-medium text-white">Site Icon</label>
            <div className="flex items-center gap-3">
              {formData.siteIcon && (
                <div className="relative w-12 h-12 bg-[#202020] border border-[#303030] rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={`${process.env.NEXT_PUBLIC_API_BASE}${formData.siteIcon}`} 
                    alt="Site icon" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    const token = localStorage.getItem('auth_token');
                    const oldIcon = formData.siteIcon; // Store old icon path
                    
                    const fd = new FormData();
                    fd.append('icon', file);
                    
                    try {
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/upload/icon`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: fd
                      });
                      
                      if (!res.ok) throw new Error('Upload failed');
                      
                      const data = await res.json();
                      updateFormData('siteIcon', data.filePath);
                      
                      // Delete old icon file if it exists
                      if (oldIcon) {
                        fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/upload/icon`, {
                          method: 'DELETE',
                          headers: { 
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}` 
                          },
                          body: JSON.stringify({ filePath: oldIcon })
                        }).catch(err => console.error('Failed to delete old icon:', err));
                      }
                    } catch (err) {
                      console.error('Upload error:', err);
                      await modal.error({
                        title: "Upload Failed",
                        body: "Failed to upload icon. Please try again."
                      });
                    }
                  }}
                  disabled={loading}
                />
                <div className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white cursor-pointer hover:border-[#404040] transition-colors flex items-center justify-between">
                  <span className="text-[#AAAAAA]">{formData.siteIcon ? 'Change icon' : 'Upload icon'}</span>
                  <i className="fas fa-upload text-[#AAAAAA]"></i>
                </div>
              </label>
              {formData.siteIcon && (
                <button
                  onClick={async () => {
                    const confirmed = await modal.confirm({
                      title: "Remove Icon",
                      body: "Are you sure you want to remove the site icon?"
                    });
                    if (confirmed) {
                      const token = localStorage.getItem('auth_token');
                      const iconToDelete = formData.siteIcon;
                      
                      // Remove from form first
                      updateFormData('siteIcon', '');
                      
                      // Delete file from server
                      if (iconToDelete) {
                        try {
                          await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/upload/icon`, {
                            method: 'DELETE',
                            headers: { 
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}` 
                            },
                            body: JSON.stringify({ filePath: iconToDelete })
                          });
                        } catch (err) {
                          console.error('Failed to delete icon:', err);
                        }
                      }
                    }
                  }}
                  className="h-12 px-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                  disabled={loading}
                >
                  <i className="fas fa-trash"></i>
                </button>
              )}
            </div>
            <p className="text-xs text-[#AAAAAA] mt-1">Upload an image (max 5MB, PNG/JPG/GIF/WEBP/SVG)</p>
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

      {/* Authentication Settings */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#202020] rounded-xl flex items-center justify-center">
            <i className="fas fa-sign-in-alt text-white text-lg"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Authentication</h3>
            <p className="text-[#AAAAAA] text-sm">Configure login methods and OAuth options</p>
          </div>
        </div>

        {/* Email Login Toggle */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.auth?.emailLogin || false}
                onChange={(e) => updateFormData('auth.emailLogin', e.target.checked)}
                disabled={loading}
              />
              <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
            </label>
            <div className="flex items-center gap-2">
              <i className="fas fa-envelope text-white text-lg"></i>
              <span className="text-white font-medium">Enable Email Login</span>
            </div>
          </div>
          <p className="text-[#AAAAAA] text-sm">Allow users to register and login with email and password</p>
        </div>

        {/* Discord OAuth */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.auth?.discord?.enabled || false}
                onChange={(e) => updateFormData('auth.discord.enabled', e.target.checked)}
                disabled={loading}
              />
              <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
            </label>
            <div className="flex items-center gap-2">
              <i className="fab fa-discord text-white text-lg"></i>
              <span className="text-white font-medium">Enable Discord Login</span>
            </div>
          </div>

          {formData.auth?.discord?.enabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">Discord Client ID</label>
                  <input
                    type="text"
                    className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors"
                    placeholder="Enter Discord Client ID"
                    value={formData.auth?.discord?.clientId || ''}
                    onChange={(e) => updateFormData('auth.discord.clientId', e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">Discord Client Secret</label>
                  <input
                    type="password"
                    className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors"
                    placeholder="Enter Discord Client Secret"
                    value={formData.auth?.discord?.clientSecret || ''}
                    onChange={(e) => updateFormData('auth.discord.clientSecret', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              
              {/* Discord Auto-Join Toggle */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.auth?.discord?.autoJoin || false}
                      onChange={(e) => updateFormData('auth.discord.autoJoin', e.target.checked)}
                      disabled={loading}
                    />
                    <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                  </label>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-robot text-white text-lg"></i>
                    <span className="text-white font-medium">Enable Auto-Join Discord Server</span>
                  </div>
                </div>
                <p className="text-[#AAAAAA] text-sm">Automatically add users to your Discord server when they login with Discord</p>
              </div>

              {/* Bot Token and Guild ID - Only show if auto-join is enabled */}
              {formData.auth?.discord?.autoJoin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white">Discord Bot Token</label>
                    <input
                      type="password"
                      className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors"
                      placeholder="Bot token for auto-joining server"
                      value={formData.auth?.discord?.botToken || ''}
                      onChange={(e) => updateFormData('auth.discord.botToken', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white">Discord Server ID (Guild ID)</label>
                    <input
                      type="text"
                      className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors"
                      placeholder="123456789012345678"
                      value={formData.auth?.discord?.guildId || ''}
                      onChange={(e) => updateFormData('auth.discord.guildId', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}
              
              <div className="bg-[#202020] border border-[#303030] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <i className="fab fa-discord text-white mt-1"></i>
                  <div className="text-sm text-[#AAAAAA]">
                    <p className="font-medium text-white mb-2">Discord Setup Instructions:</p>
                    <ol className="space-y-1 list-decimal list-inside">
                      <li>Go to <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white hover:underline">discord.com/developers/applications</a></li>
                      <li>Create a new application or select existing one</li>
                      <li>Go to OAuth2 → General</li>
                      <li>Add this redirect URI: <code className="bg-[#181818] px-2 py-1 rounded text-gray-300">{process.env.NEXT_PUBLIC_API_BASE}/api/oauth/discord/callback</code></li>
                      <li>Copy Client ID and Client Secret to the fields above</li>
                      <li><strong>For Auto-Join:</strong> Go to Bot → Create Bot → Copy Bot Token</li>
                      <li><strong>For Auto-Join:</strong> Enable "SERVER MEMBERS INTENT" in Bot settings</li>
                      <li><strong>For Auto-Join:</strong> Invite bot to your server with "Manage Server" permission</li>
                      <li><strong>For Auto-Join:</strong> Get your server ID (right-click server → Copy Server ID)</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Google OAuth */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.auth?.google?.enabled || false}
                onChange={(e) => updateFormData('auth.google.enabled', e.target.checked)}
                disabled={loading}
              />
              <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
            </label>
            <div className="flex items-center gap-2">
              <i className="fab fa-google text-white text-lg"></i>
              <span className="text-white font-medium">Enable Google Login</span>
            </div>
          </div>

          {formData.auth?.google?.enabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">Google Client ID</label>
                  <input
                    type="text"
                    className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors"
                    placeholder="Enter Google Client ID"
                    value={formData.auth?.google?.clientId || ''}
                    onChange={(e) => updateFormData('auth.google.clientId', e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">Google Client Secret</label>
                  <input
                    type="password"
                    className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors"
                    placeholder="Enter Google Client Secret"
                    value={formData.auth?.google?.clientSecret || ''}
                    onChange={(e) => updateFormData('auth.google.clientSecret', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="bg-[#202020] border border-[#303030] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <i className="fab fa-google text-white mt-1"></i>
                  <div className="text-sm text-[#AAAAAA]">
                    <p className="font-medium text-white mb-2">Google Setup Instructions:</p>
                    <ol className="space-y-1 list-decimal list-inside">
                      <li>Go to <a href="https://console.developers.google.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white hover:underline">Google Cloud Console</a></li>
                      <li>Create a new project or select existing one</li>
                      <li>Enable Google+ API and Google OAuth2 API</li>
                      <li>Go to Credentials → Create OAuth 2.0 Client ID</li>
                      <li>Add this redirect URI: <code className="bg-[#181818] px-2 py-1 rounded text-gray-300">{process.env.NEXT_PUBLIC_API_BASE}/api/oauth/google/callback</code></li>
                      <li>Copy Client ID and Client Secret to the fields above</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
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

      {/* AdSense Settings */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#202020] rounded-xl flex items-center justify-center">
            <i className="fab fa-google text-white text-lg"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Google AdSense</h3>
            <p className="text-[#AAAAAA] text-sm">Configure advertising settings and ad placements</p>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.adsense?.enabled || false}
                onChange={(e) => updateFormData('adsense.enabled', e.target.checked)}
                disabled={loading}
              />
              <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
            </label>
            <span className="text-white font-medium">Enable Google AdSense</span>
          </div>

          {formData.adsense?.enabled && (
            <div className="space-y-6">
              {/* Publisher ID */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Publisher ID</label>
                <input
                  type="text"
                  className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors"
                  placeholder="ca-pub-1234567890123456"
                  value={formData.adsense?.publisherId || ''}
                  onChange={(e) => updateFormData('adsense.publisherId', e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-[#AAAAAA]">
                  Your Google AdSense Publisher ID (starts with ca-pub-)
                </p>
              </div>

              {/* Ad Slots */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">Ad Slots</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {([
                    ['header', 'Header Ad Slot'],
                    ['sidebar', 'Sidebar Ad Slot'],
                    ['footer', 'Footer Ad Slot'],
                    ['content', 'Content Ad Slot'],
                    ['mobile', 'Mobile Ad Slot']
                  ] as const).map(([key, label]) => (
                    <div key={key} className="space-y-2">
                      <label className="block text-sm font-medium text-white">{label}</label>
                      <input
                        type="text"
                        className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors"
                        placeholder={`${key} ad slot ID`}
                        value={formData.adsense?.adSlots?.[key] || ''}
                        onChange={(e) => updateFormData(`adsense.adSlots.${key}`, e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Ad Types */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">Ad Types</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {([
                    ['display', 'Display Ads'],
                    ['text', 'Text Ads'],
                    ['link', 'Link Ads'],
                    ['inFeed', 'In-Feed Ads'],
                    ['inArticle', 'In-Article Ads'],
                    ['matchedContent', 'Matched Content']
                  ] as const).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={formData.adsense?.adTypes?.[key] || false}
                          onChange={(e) => updateFormData(`adsense.adTypes.${key}`, e.target.checked)}
                          disabled={loading}
                        />
                        <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                      </label>
                      <span className="text-white text-sm">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              
              <div className="bg-[#202020] border border-[#303030] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <i className="fab fa-google text-white mt-1"></i>
                  <div className="text-sm text-[#AAAAAA]">
                    <p className="font-medium text-white mb-2">AdSense Setup Instructions:</p>
                    <ol className="space-y-1 list-decimal list-inside">
                      <li>Go to <a href="https://www.google.com/adsense/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white hover:underline">Google AdSense</a></li>
                      <li>Sign up or sign in to your AdSense account</li>
                      <li>Add your website and get approved</li>
                      <li>Go to Ads → By ad unit → Display ads</li>
                      <li>Create ad units for different positions (header, sidebar, footer, content, mobile)</li>
                      <li>Copy the ad unit codes and paste them in the fields above</li>
                      <li>Your Publisher ID can be found in the AdSense dashboard</li>
                      <li><strong>Note:</strong> Ads will automatically appear on all pages when enabled</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PayPal Settings */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#202020] rounded-xl flex items-center justify-center">
            <i className="fab fa-paypal text-white text-lg"></i>
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
              <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
            </label>
            <span className="text-white font-medium">Enable PayPal Payments for all</span>
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

      {/* System Updates */}
      <UpdateSystem />

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
