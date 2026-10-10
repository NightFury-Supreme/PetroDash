import re

with open('frontend/src/components/admin/settings/AdminSettingsContent.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '''import { UpdateSystem } from '../updates';''',
    '''import { UpdateSystem } from '../updates';\nimport { Palette, Globe, ShieldCheck, Server, Users, Megaphone, CreditCard, RefreshCw } from 'lucide-react';'''
)

side_item = '''
function SideItem({ icon: Icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick: () => void; }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        group
        relative
        flex
        w-full
        items-center
        gap-3
        rounded-lg
        px-2.5
        py-2
        text-left
        text-sm
        transition-colors
        focus-visible:outline-none
        focus-visible:ring-1
        focus-visible:ring-white/30
        
      }
    >
      <Icon className={h-[15px] w-[15px] shrink-0 transition-colors } />
      <span className="truncate">{label}</span>
    </button>
  );
}
'''
content = content.replace("export function AdminSettingsContent(", side_item + "\nexport function AdminSettingsContent(")

content = content.replace(
    "const [saving, setSaving] = useState(false);",
    "const [saving, setSaving] = useState(false);\n  const [activeTab, setActiveTab] = useState('brand');"
)

wrapper_start = '''  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <aside className="w-full lg:w-64 shrink-0">
        <div className="sticky top-6">
          <div className="mb-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">Settings</p>
          </div>
          <nav className="space-y-1">
            <SideItem icon={Palette} label="Brand" active={activeTab === 'brand'} onClick={() => setActiveTab('brand')} />
            <SideItem icon={Globe} label="Localization" active={activeTab === 'localization'} onClick={() => setActiveTab('localization')} />
            <SideItem icon={ShieldCheck} label="Authentication" active={activeTab === 'auth'} onClick={() => setActiveTab('auth')} />
            <SideItem icon={Server} label="Default Resources" active={activeTab === 'resources'} onClick={() => setActiveTab('resources')} />
            <SideItem icon={Users} label="Referrals" active={activeTab === 'referrals'} onClick={() => setActiveTab('referrals')} />
            <SideItem icon={Megaphone} label="Google AdSense" active={activeTab === 'adsense'} onClick={() => setActiveTab('adsense')} />
            <SideItem icon={CreditCard} label="PayPal" active={activeTab === 'paypal'} onClick={() => setActiveTab('paypal')} />
            <SideItem icon={RefreshCw} label="System Updates" active={activeTab === 'updates'} onClick={() => setActiveTab('updates')} />
          </nav>
        </div>
      </aside>

      <div className="flex-1 min-w-0 w-full space-y-6">
'''
content = content.replace("  return (\n    <div className=\"space-y-6\">\n      {/* Brand Settings */}", wrapper_start + "      {activeTab === 'brand' && (\n      <div className=\"space-y-6 animate-in fade-in duration-200\">\n      {/* Brand Settings */}")

sections = [
    ("Localization Settings", "localization", "{/* Localization Settings */}"),
    ("Referral Settings", "referrals", "{/* Referral Settings */}"),
    ("Authentication", "auth", "{/* Authentication */}"),
    ("Default Resources", "resources", "{/* Default Resources */}"),
    ("Google AdSense", "adsense", "{/* Google AdSense */}"),
    ("PayPal Settings", "paypal", "{/* PayPal Settings */}")
]

for title, tab, marker in sections:
    # Use format instead of f-string to avoid curly brace issues
    repl = "      </div>\n      )}\n\n      {activeTab === '" + tab + "' && (\n      <div className=\"space-y-6 animate-in fade-in duration-200\">\n      " + marker
    content = content.replace(marker, repl)

content = content.replace("{/* System Updates */}", "      </div>\n      )}\n\n      {activeTab === 'updates' && (\n      <div className=\"space-y-6 animate-in fade-in duration-200\">\n      {/* System Updates */}")
content = content.replace("{/* Action Buttons */}", "      </div>\n      )}\n\n      {/* Action Buttons */}")

content = content.replace('className="border-t border-white/[0.06] pt-10 mt-10 first:border-0 first:pt-0 first:mt-0"', 'className="space-y-6"')

with open('frontend/src/components/admin/settings/AdminSettingsContent.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
