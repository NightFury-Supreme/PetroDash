import re

with open('frontend/src/components/admin/settings/AdminSettingsContent.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    if '<SettingsRow' in line:
        display_value = None
        save_logic = None
        
        if 'label="Coins to Referred User"' in line:
            display_value = "formData.referrals?.referredCoins"
            save_logic = "() => saveSection({ referrals: formData.referrals }, 'Referral settings updated.')"
        elif 'label="Min Invites for Custom Code"' in line:
            display_value = "formData.referrals?.customCodeMinInvites"
            save_logic = "() => saveSection({ referrals: formData.referrals }, 'Referral settings updated.')"
        elif 'label="Enable Auto-Join Discord Server"' in line:
            display_value = "formData.auth?.discord?.autoJoin ? 'Enabled' : 'Disabled'"
            save_logic = "() => saveSection({ auth: formData.auth }, 'Authentication settings updated.')"
        elif 'key={key} label={label}' in line:  # Default resources
            display_value = "formData.resources?.[key as keyof typeof formData.resources]"
            save_logic = "() => saveSection({ resources: formData.resources }, 'Default resources updated.')"
        elif 'key={key} label={`${labels[key] || key} Ad Unit`}' in line: # AdSense Ad Slots
            display_value = "formData.adsense?.adSlots?.[key as keyof typeof formData.adsense.adSlots] || 'Not set'"
            save_logic = "() => saveSection({ adsense: formData.adsense }, 'AdSense settings updated.')"
        elif 'label="Enable PayPal Payments"' in line:
            display_value = "formData.payments?.paypal?.enabled ? 'Enabled' : 'Disabled'"
            save_logic = "() => saveSection({ payments: { paypal: formData.payments.paypal } }, 'PayPal settings updated.')"
        elif 'label="Mode"' in line:
            display_value = "formData.payments?.paypal?.mode === 'live' ? 'Live' : 'Sandbox'"
            save_logic = "() => saveSection({ payments: { paypal: formData.payments.paypal } }, 'PayPal settings updated.')"
        elif 'label="Client ID"' in line:
            display_value = "formData.payments?.paypal?.clientId || 'Not set'"
            save_logic = "() => saveSection({ payments: { paypal: formData.payments.paypal } }, 'PayPal settings updated.')"
        elif 'label="Client Secret"' in line:
            display_value = "formData.payments?.paypal?.clientSecret ? \'********\' : 'Not set'"
            save_logic = "() => saveSection({ payments: { paypal: formData.payments.paypal } }, 'PayPal settings updated.')"
        elif 'label="Webhook ID"' in line:
            display_value = "formData.payments?.paypal?.webhookId || 'Not set'"
            save_logic = "() => saveSection({ payments: { paypal: formData.payments.paypal } }, 'PayPal settings updated.')"

        if not display_value:
            label_match = re.search(r'label="([^"]+)"', line)
            if label_match:
                label = label_match.group(1)
                
                if label == "Site Name":
                    display_value = "formData.siteName || 'Not set'"
                    save_logic = "() => saveSection({ siteName: formData.siteName }, 'Brand settings updated.')"
                elif label == "Site Icon":
                    display_value = "(iconPreview || formData.siteIcon) ? <img src={safeSiteIcon} alt=\"Icon\" className=\"w-8 h-8 rounded\" /> : 'Not set'"
                    save_logic = """async () => {
                  let finalSiteIcon = formData.siteIcon;
                  if (iconFile) {
                    const token = localStorage.getItem('auth_token');
                    const fd = new FormData();
                    fd.append('icon', iconFile);
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/upload/icon`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
                    if (!res.ok) throw new Error('Failed to upload icon');
                    let data: any = {}; try { data = await res.json(); } catch {}
                    finalSiteIcon = data.filePath || data.url;
                  }
                  await saveSection({ siteIcon: finalSiteIcon }, "Brand settings updated.");
                }"""
                elif label == "Site Currency":
                    display_value = "formData.localization?.currency || 'USD'"
                    save_logic = "() => saveSection({ localization: formData.localization }, 'Localization settings updated.')"
                elif label == "Timezone":
                    display_value = "formData.localization?.timezone || 'UTC'"
                    save_logic = "() => saveSection({ localization: formData.localization }, 'Localization settings updated.')"
                elif label == "Coins to Referrer":
                    display_value = "formData.referrals?.referrerCoins"
                    save_logic = "() => saveSection({ referrals: formData.referrals }, 'Referral settings updated.')"
                elif label == "Enable Email Login":
                    display_value = "(formData.auth?.emailLogin ?? true) ? 'Enabled' : 'Disabled'"
                    save_logic = "() => saveSection({ auth: formData.auth }, 'Authentication settings updated.')"
                elif label == "Enable Discord Login":
                    display_value = "formData.auth?.discord?.enabled ? 'Enabled' : 'Disabled'"
                    save_logic = "() => saveSection({ auth: formData.auth }, 'Authentication settings updated.')"
                elif label == "Discord Client ID":
                    display_value = "formData.auth?.discord?.clientId || 'Not set'"
                    save_logic = "() => saveSection({ auth: formData.auth }, 'Authentication settings updated.')"
                elif label == "Discord Client Secret":
                    display_value = "formData.auth?.discord?.clientSecret ? '********' : 'Not set'"
                    save_logic = "() => saveSection({ auth: formData.auth }, 'Authentication settings updated.')"
                elif label == "Discord Bot Token":
                    display_value = "formData.auth?.discord?.botToken ? '********' : 'Not set'"
                    save_logic = "() => saveSection({ auth: formData.auth }, 'Authentication settings updated.')"
                elif label == "Discord Guild ID":
                    display_value = "formData.auth?.discord?.guildId || 'Not set'"
                    save_logic = "() => saveSection({ auth: formData.auth }, 'Authentication settings updated.')"
                elif label == "Enable Google Login":
                    display_value = "formData.auth?.google?.enabled ? 'Enabled' : 'Disabled'"
                    save_logic = "() => saveSection({ auth: formData.auth }, 'Authentication settings updated.')"
                elif label == "Google Client ID":
                    display_value = "formData.auth?.google?.clientId || 'Not set'"
                    save_logic = "() => saveSection({ auth: formData.auth }, 'Authentication settings updated.')"
                elif label == "Google Client Secret":
                    display_value = "formData.auth?.google?.clientSecret ? '********' : 'Not set'"
                    save_logic = "() => saveSection({ auth: formData.auth }, 'Authentication settings updated.')"
                elif label == "Enable Google AdSense":
                    display_value = "formData.adsense?.enabled ? 'Enabled' : 'Disabled'"
                    save_logic = "() => saveSection({ adsense: formData.adsense }, 'AdSense settings updated.')"
                elif label == "Publisher ID":
                    display_value = "formData.adsense?.publisherId || 'Not set'"
                    save_logic = "() => saveSection({ adsense: formData.adsense }, 'AdSense settings updated.')"

        if display_value and save_logic and 'displayValue=' not in line:
            line = line.replace('>', f' displayValue={{{display_value}}} onSave={{{save_logic}}}>')
    
    if 'div className="border-t border-white/[0.06] pt-5 mt-2 flex items-center justify-end"' in line:
        skip_count = 1
        while skip_count > 0:
            i += 1
            if i >= len(lines): break
            if '<div' in lines[i]: skip_count += 1
            elif '</div' in lines[i]: skip_count -= 1
        i += 1
        continue
        
    new_lines.append(line)
    i += 1

with open('scratch/modified.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
