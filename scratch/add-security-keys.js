const fs = require('fs');

const addKeys = (lang) => {
  const p = `c:/Users/Edwin Jilson/Downloads/project/frontend/messages/${lang}.json`;
  if (!fs.existsSync(p)) return;
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  
  if (d.Profile) {
    if (!d.Profile.securityDesc) d.Profile.securityDesc = lang === 'hi' ? 'अपने खाते की सुरक्षा करें और प्रमाणीकरण प्रबंधित करें।' : 'Protect your account and manage authentication.';
    if (!d.Profile.changePasswordDesc) d.Profile.changePasswordDesc = lang === 'hi' ? 'अपने खाते का पासवर्ड बदलें।' : 'Change your account password.';
    if (!d.Profile.changePassword) d.Profile.changePassword = lang === 'hi' ? 'पासवर्ड बदलें' : 'Change password';
    if (!d.Profile.emailSecurity) d.Profile.emailSecurity = lang === 'hi' ? 'ईमेल सुरक्षा' : 'Email security';
    if (!d.Profile.emailVerifiedDesc) d.Profile.emailVerifiedDesc = lang === 'hi' ? 'आपका सत्यापित ईमेल खाता पुनर्प्राप्ति के लिए उपयोग किया जा सकता है।' : 'Your verified email can be used for account recovery.';
    if (!d.Profile.emailUnverifiedDesc) d.Profile.emailUnverifiedDesc = lang === 'hi' ? 'कृपया अपने खाते को सुरक्षित करने के लिए अपना ईमेल पता सत्यापित करें।' : 'Please verify your email address to secure your account.';
    if (!d.Profile.tryAfter) d.Profile.tryAfter = lang === 'hi' ? 'इसके बाद प्रयास करें' : 'Try after';
    if (!d.Profile.verifyEmail) d.Profile.verifyEmail = lang === 'hi' ? 'ईमेल सत्यापित करें' : 'Verify Email';
    if (!d.Profile.tfaEnabledDesc) d.Profile.tfaEnabledDesc = lang === 'hi' ? 'आपका खाता 2FA से सुरक्षित है।' : 'Your account is secured with 2FA.';
    if (!d.Profile.tfaDisabledDesc) d.Profile.tfaDisabledDesc = lang === 'hi' ? 'अपने खाते में सुरक्षा की एक अतिरिक्त परत जोड़ें।' : 'Add an extra layer of security to your account.';
    fs.writeFileSync(p, JSON.stringify(d, null, 2));
  }
};

['en', 'hi', 'fr', 'ja', 'es', 'zh'].forEach(addKeys);
console.log('Added Security keys');
