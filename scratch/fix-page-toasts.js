const fs = require('fs');
const path = 'c:/Users/Edwin Jilson/Downloads/project/frontend/src/app/[locale]/profile/page.tsx';
let c = fs.readFileSync(path, 'utf8');

if (!c.includes("tError('")) {
  c = c.replace(/const t = useTranslations\('Profile'\);/, "const t = useTranslations('Profile');\n  const tError = useTranslations('GlobalErrors');");
  c = c.replace(/showError\('Username must be at least 3 characters.'\);/g, "showError(tError('usernameTooShort') || 'Username must be at least 3 characters.');");
  c = c.replace(/showError\('First name cannot be empty.'\);/g, "showError(tError('firstNameEmpty') || 'First name cannot be empty.');");
  c = c.replace(/showSuccess\("Profile updated successfully."\);/g, "showSuccess(t('profileUpdated') || 'Profile updated successfully.');");
  c = c.replace(/showError\(e\.message \|\| 'Failed to save profile\. Please try again\.'\);/g, "showError(e.message || tError('failedToSaveProfile') || 'Failed to save profile. Please try again.');");
  c = c.replace(/throw new Error\(data\.error \|\| 'Failed to update email'\);/g, "throw new Error(data.error || tError('failedToUpdateEmail') || 'Failed to update email');");
  c = c.replace(/throw new Error\(data\.error \|\| 'Failed to verify email change'\);/g, "throw new Error(data.error || tError('failedToVerifyEmail') || 'Failed to verify email change');");
  c = c.replace(/throw new Error\(d\?\.error \|\| 'Failed to delete account'\);/g, "throw new Error(d?.error || tError('failedToDeleteAccount') || 'Failed to delete account');");
  c = c.replace(/showError\(e\.message \|\| 'Failed to send verification email\. Please try again\.'\);/g, "showError(e.message || tError('failedToSendVerificationEmail') || 'Failed to send verification email. Please try again.');");
  c = c.replace(/showError\(data\.error \|\| 'Failed to setup 2FA'\);/g, "showError(data.error || tError('failedToSetup2FA') || 'Failed to setup 2FA');");
  c = c.replace(/showError\('Could not connect to the server\. Please try again\.'\);/g, "showError(tError('networkError') || 'Could not connect to the server. Please try again.');");
  c = c.replace(/throw new Error\(data\.error \|\| 'Invalid verification code'\);/g, "throw new Error(data.error || tError('invalidVerificationCode') || 'Invalid verification code');");
  c = c.replace(/throw new Error\(data\.error \|\| 'Failed to disable 2FA'\);/g, "throw new Error(data.error || tError('failedToDisable2FA') || 'Failed to disable 2FA');");
  c = c.replace(/showSuccess\("Profile picture updated."\);/g, "showSuccess(t('profilePictureUpdated') || 'Profile picture updated.');");
  c = c.replace(/showError\(e\.message \|\| "Failed to update profile picture."\);/g, "showError(e.message || tError('failedToUpdateProfilePicture') || 'Failed to update profile picture.');");
  
  fs.writeFileSync(path, c);
}
console.log('Fixed page toasts');
