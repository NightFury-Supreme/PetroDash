const fs = require('fs');

const addKeys = (lang) => {
  const p = `c:/Users/Edwin Jilson/Downloads/project/frontend/messages/${lang}.json`;
  if (!fs.existsSync(p)) return;
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  
  if (d.GlobalErrors) {
    if (!d.GlobalErrors.usernameTooShort) d.GlobalErrors.usernameTooShort = lang === 'hi' ? 'उपयोगकर्ता नाम कम से कम 3 वर्णों का होना चाहिए।' : 'Username must be at least 3 characters.';
    if (!d.GlobalErrors.firstNameEmpty) d.GlobalErrors.firstNameEmpty = lang === 'hi' ? 'पहला नाम खाली नहीं हो सकता।' : 'First name cannot be empty.';
    if (!d.GlobalErrors.failedToSaveProfile) d.GlobalErrors.failedToSaveProfile = lang === 'hi' ? 'प्रोफ़ाइल सहेजने में विफल। कृपया पुन: प्रयास करें।' : 'Failed to save profile. Please try again.';
    if (!d.GlobalErrors.failedToUpdateEmail) d.GlobalErrors.failedToUpdateEmail = lang === 'hi' ? 'ईमेल अपडेट करने में विफल' : 'Failed to update email';
    if (!d.GlobalErrors.failedToVerifyEmail) d.GlobalErrors.failedToVerifyEmail = lang === 'hi' ? 'ईमेल परिवर्तन सत्यापित करने में विफल' : 'Failed to verify email change';
    if (!d.GlobalErrors.failedToDeleteAccount) d.GlobalErrors.failedToDeleteAccount = lang === 'hi' ? 'खाता हटाने में विफल' : 'Failed to delete account';
    if (!d.GlobalErrors.failedToSetup2FA) d.GlobalErrors.failedToSetup2FA = lang === 'hi' ? '2FA सेट करने में विफल' : 'Failed to setup 2FA';
    if (!d.GlobalErrors.networkError) d.GlobalErrors.networkError = lang === 'hi' ? 'सर्वर से कनेक्ट नहीं हो सका। कृपया पुन: प्रयास करें।' : 'Could not connect to the server. Please try again.';
    if (!d.GlobalErrors.invalidVerificationCode) d.GlobalErrors.invalidVerificationCode = lang === 'hi' ? 'अमान्य सत्यापन कोड' : 'Invalid verification code';
    if (!d.GlobalErrors.failedToDisable2FA) d.GlobalErrors.failedToDisable2FA = lang === 'hi' ? '2FA अक्षम करने में विफल' : 'Failed to disable 2FA';
  }
  
  if (d.Profile) {
    if (!d.Profile.profileUpdated) d.Profile.profileUpdated = lang === 'hi' ? 'प्रोफ़ाइल सफलतापूर्वक अपडेट की गई।' : 'Profile updated successfully.';
    if (!d.Profile.profilePictureUpdated) d.Profile.profilePictureUpdated = lang === 'hi' ? 'प्रोफ़ाइल चित्र अपडेट किया गया।' : 'Profile picture updated.';
  }
  
  fs.writeFileSync(p, JSON.stringify(d, null, 2));
};

['en', 'hi', 'fr', 'ja', 'es', 'zh'].forEach(addKeys);
console.log('Added toast keys');
