import React from 'react';
import { SettingsDrawerRow } from '../Shared';
import { TabProps } from '../types';

export function AdSenseTab({ formData, updateFormData, saveSection, loading }: TabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Google AdSense Settings</h3>
            <p className="mt-2 text-sm text-white/35">Configure Google AdSense integration and ad slots</p>
          </div>
        </div>
        
        <div className="divide-y divide-white/[0.06]">
          <SettingsDrawerRow 
            icon={<i className="fab fa-google"></i>} 
            label="Google AdSense" 
            description="Configure Google AdSense integration and ad slots" 
            enabled={formData.adsense?.enabled || false} 
            onToggle={async (enabled) => { updateFormData('adsense.enabled', enabled); await saveSection({ adsense: { ...formData.adsense, enabled } as any }, `AdSense ${enabled ? 'enabled' : 'disabled'}`); }} 
            onSave={async () => await saveSection({ adsense: formData.adsense }, 'AdSense settings updated.')}
          >
             <div className="space-y-6">
               <div>
                 <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">Publisher ID</label>
                 <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder="ca-pub-1234567890123456" value={formData.adsense?.publisherId || ''} onChange={(e) => updateFormData('adsense.publisherId', e.target.value)} disabled={loading} />
                 <p className="mt-1 text-[11px] text-[#555]">Your Google AdSense Publisher ID (starts with ca-pub-)</p>
               </div>
               
               <div>
                 <h4 className="mb-3 block text-sm font-medium text-[#D4D4D4]">Ad Slots</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {([
                     ['header', 'Header Ad Slot'],
                     ['sidebar', 'Sidebar Ad Slot'],
                     ['footer', 'Footer Ad Slot'],
                     ['content', 'Content Ad Slot'],
                     ['mobile', 'Mobile Ad Slot']
                   ] as const).map(([key, label]) => (
                     <div key={key} className="space-y-1.5">
                       <label className="block text-xs font-medium text-[#D4D4D4]">{label}</label>
                       <input type="text" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-white/[0.04] disabled:opacity-50" placeholder={`${key} ad slot ID`} value={formData.adsense?.adSlots?.[key] || ''} onChange={(e) => updateFormData(`adsense.adSlots.${key}`, e.target.value)} disabled={loading} />
                     </div>
                   ))}
                 </div>
               </div>

               <div className="pt-6 mt-6 border-t border-white/[0.06]">
                  <h4 className="mb-4 block text-sm font-medium text-[#D4D4D4]">Ad Types</h4>
                  <div className="flex flex-col">
                    {([
                      ['display', 'Display Ads', 'Show graphical display ads on your pages'],
                      ['text', 'Text Ads', 'Show simple text-based ads'],
                      ['link', 'Link Ads', 'Show link unit ads'],
                      ['inFeed', 'In-Feed Ads', 'Show native ads inserted between feed items'],
                      ['inArticle', 'In-Article Ads', 'Show native ads integrated inside articles'],
                      ['matchedContent', 'Matched Content', 'Show recommended content with ads']
                    ] as const).map(([key, label, desc], index) => (
                      <div key={key} className={`flex items-center justify-between py-4 ${index !== 0 ? 'border-t border-white/[0.06]' : ''}`}>
                        <div className="flex flex-col">
                          <span className="text-[#D4D4D4] text-sm font-medium mb-0.5">{label}</span>
                          <span className="text-[#888] text-xs leading-snug">{desc}</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input type="checkbox" className="sr-only peer" checked={formData.adsense?.adTypes?.[key] || false} onChange={(e) => updateFormData(`adsense.adTypes.${key}`, e.target.checked)} disabled={loading} />
                          <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                        </label>
                      </div>
                    ))}
                  </div>
               </div>
             </div>
             
             <div className="pt-6 mt-6 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fab fa-google text-lg text-white"></i>
                  <h4 className="text-sm font-semibold text-white">Setup Instructions</h4>
                </div>
                <ol className="space-y-2 list-decimal list-inside text-xs text-[#888]">
                  <li>Go to <a href="https://www.google.com/adsense/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">Google AdSense</a></li>
                  <li>Sign up or sign in to your AdSense account</li>
                  <li>Add your website and get approved</li>
                  <li>Go to <strong>Ads</strong> → <strong>By ad unit</strong> → <strong>Display ads</strong></li>
                  <li>Create ad units for different positions (header, sidebar, footer, content, mobile)</li>
                  <li>Copy the ad unit codes and paste them in the fields above</li>
                  <li>Your <strong>Publisher ID</strong> can be found in the AdSense dashboard</li>
                  <li><strong>Note:</strong> Ads will automatically appear on all pages when enabled</li>
                </ol>
             </div>
          </SettingsDrawerRow>
        </div>
      </section>
    </div>
  );
}
