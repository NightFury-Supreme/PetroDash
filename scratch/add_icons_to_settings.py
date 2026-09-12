import re

with open('frontend/src/components/admin/settings/AdminSettingsContent.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

imports_to_add = "LayoutTemplate, Image as ImageIcon, Coins, Clock, Gift, Mail, Key, ShieldAlert, MessageSquare, Bot, Fingerprint, BadgeDollarSign, Link as LinkIcon, Activity, Database, HardDrive, Cpu, Network"
content = re.sub(
    r"import \{ Palette, Globe, ShieldCheck, Server, Users, Megaphone, CreditCard, RefreshCw, Upload, Trash2 \} from 'lucide-react';",
    f"import {{ Palette, Globe, ShieldCheck, Server, Users, Megaphone, CreditCard, RefreshCw, Upload, Trash2, {imports_to_add} }} from 'lucide-react';",
    content
)

replacements = [
    (r'<SettingsRow label="Site Name"', r'<SettingsRow icon={<LayoutTemplate />} label="Site Name"'),
    (r'<SettingsRow label="Site Icon"[^>]+displayValue={[^\}]+} onSave={', r'<SettingsRow icon={(iconPreview || formData.siteIcon) ? <img src={safeSiteIcon} alt="Icon" className="w-6 h-6 rounded" /> : <ImageIcon />} label="Site Icon" description="Upload an image (max 5MB, PNG/JPG/GIF/WEBP/SVG)." displayValue="" onSave={'),
    (r'<SettingsRow label="Site Currency"', r'<SettingsRow icon={<Coins />} label="Site Currency"'),
    (r'<SettingsRow label="Timezone"', r'<SettingsRow icon={<Clock />} label="Timezone"'),
    (r'<SettingsRow label="Coins to Referrer"', r'<SettingsRow icon={<Gift />} label="Coins to Referrer"'),
    (r'<SettingsRow label="Coins to Referred User"', r'<SettingsRow icon={<Gift />} label="Coins to Referred User"'),
    (r'<SettingsRow label="Min Invites for Custom Code"', r'<SettingsRow icon={<Users />} label="Min Invites for Custom Code"'),
    (r'<SettingsRow label="Enable Email Login"', r'<SettingsRow icon={<Mail />} label="Enable Email Login"'),
    (r'<SettingsRow label="Enable Discord Login"', r'<SettingsRow icon={<Fingerprint />} label="Enable Discord Login"'),
    (r'<SettingsRow label="Discord Client ID"', r'<SettingsRow icon={<Key />} label="Discord Client ID"'),
    (r'<SettingsRow label="Discord Client Secret"', r'<SettingsRow icon={<Key />} label="Discord Client Secret"'),
    (r'<SettingsRow label="Enable Auto-Join Discord Server"', r'<SettingsRow icon={<ShieldAlert />} label="Enable Auto-Join Discord Server"'),
    (r'<SettingsRow label="Discord Guild ID"', r'<SettingsRow icon={<MessageSquare />} label="Discord Guild ID"'),
    (r'<SettingsRow label="Discord Bot Token"', r'<SettingsRow icon={<Bot />} label="Discord Bot Token"'),
    (r'<SettingsRow label="Enable Google Login"', r'<SettingsRow icon={<Fingerprint />} label="Enable Google Login"'),
    (r'<SettingsRow label="Google Client ID"', r'<SettingsRow icon={<Key />} label="Google Client ID"'),
    (r'<SettingsRow label="Google Client Secret"', r'<SettingsRow icon={<Key />} label="Google Client Secret"'),
    (r'<SettingsRow key={key} label={label}', r'<SettingsRow key={key} icon={key === "cpu" ? <Cpu /> : key === "ram" ? <HardDrive /> : key === "disk" ? <Database /> : <Network />} label={label}'),
    (r'<SettingsRow label="Enable Google AdSense"', r'<SettingsRow icon={<BadgeDollarSign />} label="Enable Google AdSense"'),
    (r'<SettingsRow label="Publisher ID"', r'<SettingsRow icon={<BadgeDollarSign />} label="Publisher ID"'),
    (r'<SettingsRow label="Enable PayPal Payments"', r'<SettingsRow icon={<CreditCard />} label="Enable PayPal Payments"'),
    (r'<SettingsRow label="Mode"', r'<SettingsRow icon={<Activity />} label="Mode"'),
    (r'<SettingsRow label="Client ID"', r'<SettingsRow icon={<Key />} label="Client ID"'),
    (r'<SettingsRow label="Client Secret"', r'<SettingsRow icon={<Key />} label="Client Secret"'),
    (r'<SettingsRow label="Webhook ID"', r'<SettingsRow icon={<LinkIcon />} label="Webhook ID"'),
]

for old, new in replacements:
    content = re.sub(old, new, content)

with open('frontend/src/components/admin/settings/AdminSettingsContent.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done.")
