import React, { useState, useMemo, useEffect } from 'react';
import { Drawer } from "@/components/ui/Drawer";
import { Mail, KeyRound, ShieldCheck, AlertTriangle, AlertCircle, Copy, Trash2, Check, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

// Inline validation message — same pattern as the reference UsernameSetting component
function ValidationMsg({ touched, valid, message, hideSuccess }: { touched: boolean; valid: boolean; message: string; hideSuccess?: boolean }) {
  if (!touched) return null;
  if (valid && hideSuccess) return null;
  return (
    <div className={`mt-2 flex items-center gap-1.5 text-[11px] ${valid ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
      {valid ? <Check size={11} /> : <AlertCircle size={11} />}
      <span>{message}</span>
    </div>
  );
}

export function PasswordDrawer({
  isOpen,
  onClose,
  tfaEnabled,
  updatePassword,
}: {
  isOpen: boolean;
  onClose: () => void;
  tfaEnabled?: boolean;
  updatePassword: (current: string, newPass: string, tfa: string) => Promise<void>;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordTfaCode, setPasswordTfaCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [touchedCurrent, setTouchedCurrent] = useState(false);
  const [touchedNew, setTouchedNew] = useState(false);
  const [touchedTfa, setTouchedTfa] = useState(false);
  const { showError, showSuccess } = useToast();

  const currentValidation = useMemo(() => {
    if (!currentPassword) return { valid: false, message: 'Current password is required.' };
    return { valid: true, message: 'Current password entered.' };
  }, [currentPassword]);

  const newValidation = useMemo(() => {
    if (!newPassword) return { valid: false, message: 'New password is required.' };
    if (newPassword.length < 8) return { valid: false, message: 'Password must be at least 8 characters.' };
    if (!/[A-Za-z]/.test(newPassword)) return { valid: false, message: 'Password must contain at least one letter.' };
    if (!/\d/.test(newPassword)) return { valid: false, message: 'Password must contain at least one number.' };
    return { valid: true, message: 'Password meets all requirements.' };
  }, [newPassword]);

  const tfaValidation = useMemo(() => {
    if (!tfaEnabled) return { valid: true, message: '' };
    if (!passwordTfaCode) return { valid: false, message: useBackupCode ? 'Backup code is required.' : '2FA code is required.' };
    if (useBackupCode && passwordTfaCode.length !== 8) return { valid: false, message: 'Enter your 8-character backup code.' };
    if (!useBackupCode && passwordTfaCode.length !== 6) return { valid: false, message: 'Enter your 6-digit authenticator code.' };
    return { valid: true, message: useBackupCode ? '8-character backup code entered.' : '6-digit code entered.' };
  }, [passwordTfaCode, tfaEnabled, useBackupCode]);

  const isValid = currentValidation.valid && newValidation.valid && tfaValidation.valid;

  const handleUpdate = async () => {
    setTouchedCurrent(true);
    setTouchedNew(true);
    setTouchedTfa(true);
    if (!isValid) return;
    setIsLoading(true);
    try {
      await updatePassword(currentPassword, newPassword, passwordTfaCode);
      showSuccess("Password updated successfully.");
      handleClose();
    } catch (e: any) {
      showError(e.message || 'An error occurred while updating.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setCurrentPassword('');
    setNewPassword('');
    setPasswordTfaCode('');
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title="Change Password" subtitle="Update your account password" icon={<KeyRound className="text-[#FF5722]" size={20} />}>
      <div className="grid gap-6 mt-2">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#888] mb-2 font-medium">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => { setCurrentPassword(e.target.value); setTouchedCurrent(true); }}
            onBlur={() => setTouchedCurrent(true)}
            disabled={isLoading}
            className={`w-full h-11 rounded-lg border bg-[#161616] px-4 text-[13px] text-white outline-none focus:border-[#FF5722] transition-colors disabled:opacity-50 ${touchedCurrent && !currentValidation.valid ? 'border-red-400/30' : 'border-[#222]'}`}
            placeholder="••••••••"
          />
          <ValidationMsg touched={touchedCurrent} valid={currentValidation.valid} message={currentValidation.message} hideSuccess={true} />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#888] mb-2 font-medium">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setTouchedNew(true); }}
            onBlur={() => setTouchedNew(true)}
            disabled={isLoading}
            className={`w-full h-11 rounded-lg border bg-[#161616] px-4 text-[13px] text-white outline-none focus:border-[#FF5722] transition-colors disabled:opacity-50 ${touchedNew && !newValidation.valid ? 'border-red-400/30' : 'border-[#222]'}`}
            placeholder="Minimum 8 characters"
          />
          <ValidationMsg touched={touchedNew} valid={newValidation.valid} message={newValidation.message} />
        </div>
        {tfaEnabled && (
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-[11px] uppercase tracking-wider text-[#888] font-medium">{useBackupCode ? 'Backup Code' : '2FA Code'}</label>
              <button type="button" onClick={() => { setUseBackupCode(!useBackupCode); setPasswordTfaCode(''); setTouchedTfa(false); }} className="text-[12px] font-medium text-[#FF5722] hover:text-[#F4511E] transition-colors">
                {useBackupCode ? 'Use 2FA Code' : 'Use Backup Code'}
              </button>
            </div>
            <input
              type="text"
              maxLength={useBackupCode ? 8 : 6}
              value={passwordTfaCode}
              onChange={(e) => { setPasswordTfaCode(e.target.value.replace(useBackupCode ? /[^0-9a-fA-F]/g : /\D/g, '')); setTouchedTfa(true); }}
              onBlur={() => setTouchedTfa(true)}
              disabled={isLoading}
              className={`w-full h-11 rounded-lg border bg-[#161616] px-4 text-[14px] text-white outline-none focus:border-[#FF5722] transition-colors tracking-[0.2em] font-mono text-center disabled:opacity-50 ${touchedTfa && !tfaValidation.valid ? 'border-red-400/30' : 'border-[#222]'}`}
              placeholder={useBackupCode ? "a1b2c3d4" : "123456"}
            />
            <ValidationMsg touched={touchedTfa} valid={tfaValidation.valid} message={tfaValidation.message} hideSuccess={true} />
          </div>
        )}
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={handleClose} disabled={isLoading} className="flex h-11 items-center justify-center rounded-lg border border-[#222] px-6 text-[13px] font-medium text-[#888] hover:bg-[#161616] hover:text-white transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={handleUpdate} disabled={isLoading || !isValid} className={`flex h-11 items-center justify-center rounded-lg px-6 text-[13px] font-medium transition-colors gap-2 ${(!isValid) ? 'bg-[#333] text-[#888] cursor-not-allowed' : 'bg-[#FF5722] hover:bg-[#F4511E] text-white disabled:opacity-50'}`}>
            {isLoading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : "Update Password"}
          </button>
        </div>
      </div>
    </Drawer>
  );
}

export function ChangeEmailDrawer({
  isOpen,
  onClose,
  tfaEnabled,
  changeEmail,
  verifyEmailChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  tfaEnabled?: boolean;
  changeEmail: (newEmail: string, password: string, tfa: string) => Promise<{ requiresVerification: boolean } | void>;
  verifyEmailChange?: (newEmail: string, code: string) => Promise<void>;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [tfaCode, setTfaCode] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedCurrent, setTouchedCurrent] = useState(false);
  const [touchedTfa, setTouchedTfa] = useState(false);
  const [touchedVerify, setTouchedVerify] = useState(false);
  const { showError, showSuccess } = useToast();

  // Reset state when drawer closes/opens
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setNewEmail('');
        setCurrentPassword('');
        setTfaCode('');
        setVerifyCode('');
        setUseBackupCode(false);
        setTouchedEmail(false);
        setTouchedCurrent(false);
        setTouchedTfa(false);
        setTouchedVerify(false);
      }, 300);
    }
  }, [isOpen]);

  const emailValidation = useMemo(() => {
    if (!newEmail) return { valid: false, message: 'New email is required.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return { valid: false, message: 'Please enter a valid email address.' };
    return { valid: true, message: 'Valid email format.' };
  }, [newEmail]);

  const currentValidation = useMemo(() => {
    if (!currentPassword) return { valid: false, message: 'Current password is required.' };
    return { valid: true, message: 'Current password entered.' };
  }, [currentPassword]);

  const tfaValidation = useMemo(() => {
    if (!tfaEnabled) return { valid: true, message: '' };
    if (!tfaCode) return { valid: false, message: useBackupCode ? 'Backup code is required.' : '2FA code is required.' };
    if (useBackupCode && tfaCode.length !== 8) return { valid: false, message: 'Enter your 8-character backup code.' };
    if (!useBackupCode && tfaCode.length !== 6) return { valid: false, message: 'Enter your 6-digit authenticator code.' };
    return { valid: true, message: useBackupCode ? '8-character backup code entered.' : '6-digit code entered.' };
  }, [tfaCode, tfaEnabled, useBackupCode]);
  
  const verifyValidation = useMemo(() => {
    if (!verifyCode) return { valid: false, message: 'Verification code is required.' };
    if (verifyCode.length !== 8) return { valid: false, message: 'Code must be exactly 8 characters.' };
    return { valid: true, message: 'Valid code format.' };
  }, [verifyCode]);

  const isStep1Valid = emailValidation.valid && currentValidation.valid && tfaValidation.valid;
  const isStep2Valid = verifyValidation.valid;

  const handleClose = () => {
    onClose();
    setNewEmail('');
    setCurrentPassword('');
    setTfaCode('');
    setVerifyCode('');
    setStep(1);
  };

  const handleUpdate = async () => {
    setTouchedEmail(true);
    setTouchedCurrent(true);
    setTouchedTfa(true);
    if (!isStep1Valid) return;
    setIsLoading(true);
    try {
      const result = await changeEmail(newEmail, currentPassword, tfaCode);
      if (result && result.requiresVerification) {
        setStep(2);
      } else {
        showSuccess("Email updated successfully.");
        handleClose();
      }
    } catch (e: any) {
      showError(e.message || 'An error occurred while updating email.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerify = async () => {
    setTouchedVerify(true);
    if (!isStep2Valid || !verifyEmailChange) return;
    setIsLoading(true);
    try {
      await verifyEmailChange(newEmail, verifyCode);
      showSuccess("Email verified successfully.");
      handleClose();
    } catch (e: any) {
      showError(e.message || 'An error occurred while verifying the code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title="Change Email" subtitle={step === 1 ? "Update your account email address" : "Verify your new email address"} icon={<Mail className="text-[#FF5722]" size={20} />}>
      <div className="grid gap-6 mt-2">
        {step === 1 ? (
          <>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#888] mb-2 font-medium">New Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => { setNewEmail(e.target.value); setTouchedEmail(true); }}
                onBlur={() => setTouchedEmail(true)}
                disabled={isLoading}
                className={`w-full h-11 rounded-lg border bg-[#161616] px-4 text-[13px] text-white outline-none focus:border-[#FF5722] transition-colors disabled:opacity-50 ${touchedEmail && !emailValidation.valid ? 'border-red-400/30' : 'border-[#222]'}`}
                placeholder="new@example.com"
              />
              <ValidationMsg touched={touchedEmail} valid={emailValidation.valid} message={emailValidation.message} />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#888] mb-2 font-medium">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setTouchedCurrent(true); }}
                onBlur={() => setTouchedCurrent(true)}
                disabled={isLoading}
                className={`w-full h-11 rounded-lg border bg-[#161616] px-4 text-[13px] text-white outline-none focus:border-[#FF5722] transition-colors disabled:opacity-50 ${touchedCurrent && !currentValidation.valid ? 'border-red-400/30' : 'border-[#222]'}`}
                placeholder="••••••••"
              />
              <ValidationMsg touched={touchedCurrent} valid={currentValidation.valid} message={currentValidation.message} hideSuccess={true} />
            </div>
            {tfaEnabled && (
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-[11px] uppercase tracking-wider text-[#888] font-medium">{useBackupCode ? 'Backup Code' : '2FA Code'}</label>
                  <button type="button" onClick={() => { setUseBackupCode(!useBackupCode); setTfaCode(''); setTouchedTfa(false); }} className="text-[12px] font-medium text-[#FF5722] hover:text-[#F4511E] transition-colors">
                    {useBackupCode ? 'Use 2FA Code' : 'Use Backup Code'}
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={useBackupCode ? 8 : 6}
                  value={tfaCode}
                  onChange={(e) => { setTfaCode(e.target.value.replace(useBackupCode ? /[^0-9a-fA-F]/g : /\D/g, '')); setTouchedTfa(true); }}
                  onBlur={() => setTouchedTfa(true)}
                  disabled={isLoading}
                  className={`w-full h-11 rounded-lg border bg-[#161616] px-4 text-[14px] text-white outline-none focus:border-[#FF5722] transition-colors tracking-[0.2em] font-mono text-center disabled:opacity-50 ${touchedTfa && !tfaValidation.valid ? 'border-red-400/30' : 'border-[#222]'}`}
                  placeholder={useBackupCode ? "a1b2c3d4" : "123456"}
                />
                <ValidationMsg touched={touchedTfa} valid={tfaValidation.valid} message={tfaValidation.message} hideSuccess={true} />
              </div>
            )}
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={handleClose} disabled={isLoading} className="flex h-11 items-center justify-center rounded-lg border border-[#222] px-6 text-[13px] font-medium text-[#888] hover:bg-[#161616] hover:text-white transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={handleUpdate} disabled={isLoading || !isStep1Valid} className={`flex h-11 items-center justify-center rounded-lg px-6 text-[13px] font-medium transition-colors gap-2 ${(!isStep1Valid) ? 'bg-[#333] text-[#888] cursor-not-allowed' : 'bg-[#FF5722] hover:bg-[#F4511E] text-white disabled:opacity-50'}`}>
                {isLoading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : "Change Email"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-sm text-[#888] mb-4 leading-relaxed">
                We've sent an 8-digit verification code to <span className="text-white font-medium">{newEmail}</span>. Please enter it below to confirm your new email address.
              </p>
              <label className="block text-[11px] uppercase tracking-wider text-[#888] mb-2 font-medium">Verification Code</label>
              <input
                type="text"
                maxLength={8}
                value={verifyCode}
                onChange={(e) => { setVerifyCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()); setTouchedVerify(true); }}
                onBlur={() => setTouchedVerify(true)}
                disabled={isLoading}
                className={`w-full h-11 rounded-lg border bg-[#161616] px-4 text-[14px] text-white outline-none focus:border-[#FF5722] transition-colors tracking-[0.2em] font-mono text-center disabled:opacity-50 ${touchedVerify && !verifyValidation.valid ? 'border-red-400/30' : 'border-[#222]'}`}
                placeholder="A1B2C3D4"
              />
              <ValidationMsg touched={touchedVerify} valid={verifyValidation.valid} message={verifyValidation.message} />
            </div>
            
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setStep(1)} disabled={isLoading} className="flex h-11 items-center justify-center rounded-lg border border-[#222] px-6 text-[13px] font-medium text-[#888] hover:bg-[#161616] hover:text-white transition-colors disabled:opacity-50">Back</button>
              <button onClick={handleVerify} disabled={isLoading || !isStep2Valid} className={`flex h-11 items-center justify-center rounded-lg px-6 text-[13px] font-medium transition-colors gap-2 ${(!isStep2Valid) ? 'bg-[#333] text-[#888] cursor-not-allowed' : 'bg-[#FF5722] hover:bg-[#F4511E] text-white disabled:opacity-50'}`}>
                {isLoading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : "Verify & Save"}
              </button>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}

export function Setup2FADrawer({
  isOpen,
  onClose,
  tfaSetupData,
  tfaBackupCodes,
  setTfaBackupCodes,
  verifyAndEnable2FA,
}: {
  isOpen: boolean;
  onClose: () => void;
  tfaSetupData: { secret: string, qrCodeUrl: string } | null;
  tfaBackupCodes: string[] | null;
  setTfaBackupCodes: (codes: string[] | null) => void;
  verifyAndEnable2FA: (code: string) => Promise<void>;
}) {
  const [tfaVerifyCode, setTfaVerifyCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [touchedCode, setTouchedCode] = useState(false);
  const { showError, showSuccess } = useToast();

  const codeValidation = useMemo(() => {
    if (!tfaVerifyCode) return { valid: false, message: 'Verification code is required.' };
    if (tfaVerifyCode.length !== 6) return { valid: false, message: 'Code must be exactly 6 digits.' };
    return { valid: true, message: '6-digit code entered.' };
  }, [tfaVerifyCode]);

  const handleClose = () => {
    onClose();
    setTfaBackupCodes(null);
    setTfaVerifyCode('');
    setTouchedCode(false);
  };

  const handleVerify = async () => {
    setTouchedCode(true);
    if (!codeValidation.valid) return;
    setIsLoading(true);
    try {
      await verifyAndEnable2FA(tfaVerifyCode);
      showSuccess("2FA enabled successfully.");
    } catch (e: any) {
      showError(e.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCodes = () => {
    if (!tfaBackupCodes) return;
    navigator.clipboard.writeText(tfaBackupCodes.join('\n'));
    setCopied(true);
    showSuccess("Backup codes copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title="Setup 2FA" subtitle="Two-Factor Authentication" icon={<ShieldCheck className="text-[#FF5722]" size={20} />}>
      <div className="grid gap-6 mt-2">
        {!tfaBackupCodes ? (
          <>
            {tfaSetupData?.qrCodeUrl && (
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 rounded-lg border border-[#222] bg-[#111] p-5">
                <div className="flex h-[130px] w-[130px] shrink-0 items-center justify-center rounded-lg bg-white p-2">
                  <img src={tfaSetupData.qrCodeUrl} alt="2FA setup QR code" className="h-full w-full object-contain" />
                </div>
                <div className="min-w-0 w-full text-center sm:text-left">
                  <p className="text-[14px] font-semibold text-[#EAEAEA]">Scan this QR code</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-[#888]">
                    Open your authenticator app and scan the code to automatically configure two-factor authentication.
                  </p>
                  <div className="mt-5 text-left">
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[#888]">Can't scan?</p>
                    <div className="flex items-center rounded-md border border-[#292929] bg-[#151515]">
                      <code className="min-w-0 flex-1 truncate px-3 py-2 text-[12px] tracking-wider text-[#aaa]">
                        {tfaSetupData.secret}
                      </code>
                      <button onClick={() => { 
                        navigator.clipboard.writeText(tfaSetupData.secret); 
                        setCopied(true);
                        showSuccess("Secret copied to clipboard");
                        setTimeout(() => setCopied(false), 2000);
                      }} className="flex h-9 w-10 shrink-0 items-center justify-center border-l border-[#292929] text-[#666] hover:bg-[#1c1c1c] hover:text-white transition">
                        {copied ? <Check size={14} className="text-[#ff6b1a]" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6">
              <label htmlFor="two-factor-code" className="block text-[11px] uppercase tracking-wider text-[#888] font-medium mb-2">
                Verification code
              </label>
              <div className="flex gap-3">
                <input
                  id="two-factor-code"
                  value={tfaVerifyCode}
                  onChange={(e) => { setTfaVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setTouchedCode(true); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && codeValidation.valid && !isLoading) handleVerify(); }}
                  disabled={isLoading}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  className={`h-11 min-w-0 flex-1 rounded-lg border bg-[#161616] px-4 font-mono text-[16px] tracking-[0.2em] text-center text-white outline-none placeholder:text-[#414141] focus:border-[#FF5722] disabled:opacity-50 transition-colors ${touchedCode && !codeValidation.valid ? 'border-red-400/30' : 'border-[#222]'}`}
                />
                <button
                  onClick={handleVerify}
                  disabled={!codeValidation.valid || isLoading}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#FF5722] hover:bg-[#F4511E] px-6 text-[13px] font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-[#333] disabled:text-[#888]"
                >
                  {isLoading ? "Verifying..." : "Verify"}
                  {!isLoading && <ArrowRight size={14} />}
                </button>
              </div>
              <p className="mt-3 text-[12px] text-[#888]">
                Enter the 6-digit code currently displayed in your authenticator application.
              </p>
              <ValidationMsg touched={touchedCode} valid={codeValidation.valid} message={codeValidation.message} hideSuccess={true} />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 p-4 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck size={24} />
              <p className="text-[13px] font-medium">2FA has been successfully enabled!</p>
            </div>
            <p className="text-[13px] leading-relaxed text-[#888]">
              Save these backup codes in a secure location. They are the <strong className="text-white">only way</strong> to recover your account if you lose access to your authenticator app.
            </p>
            <div className="grid grid-cols-2 gap-3 bg-[#161616] p-5 rounded-lg border border-[#222]">
              {tfaBackupCodes.map((code, i) => (
                <code key={i} className="text-[13px] font-mono text-white/90 text-center tracking-wider">{code}</code>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={handleCopyCodes} className={`flex h-11 items-center justify-center rounded-lg border px-6 text-[13px] font-medium transition-colors gap-2 ${copied ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-[#222] text-[#888] hover:bg-[#161616] hover:text-white'}`}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Codes'}
              </button>
              <button onClick={handleClose} className="flex h-11 items-center justify-center rounded-lg bg-[#FF5722] px-6 text-[13px] font-medium text-white hover:bg-[#F4511E] transition-colors">I have saved them</button>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}


export function Disable2FADrawer({
  isOpen,
  onClose,
  disable2FA,
}: {
  isOpen: boolean;
  onClose: () => void;
  disable2FA: (password: string, code: string) => Promise<void>;
}) {
  const [tfaPassword, setTfaPassword] = useState('');
  const [tfaVerifyCode, setTfaVerifyCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [touchedPw, setTouchedPw] = useState(false);
  const [touchedCode, setTouchedCode] = useState(false);
  const { showError, showSuccess } = useToast();

  const pwValidation = useMemo(() => {
    if (!tfaPassword) return { valid: false, message: 'Password is required.' };
    if (tfaPassword.length < 6) return { valid: false, message: 'Password must be at least 6 characters.' };
    return { valid: true, message: 'Password confirmed.' };
  }, [tfaPassword]);

  const codeValidation = useMemo(() => {
    if (!tfaVerifyCode) return { valid: false, message: useBackupCode ? 'Backup code is required.' : '2FA code is required.' };
    if (useBackupCode && tfaVerifyCode.length !== 8) return { valid: false, message: 'Enter your 8-character backup code.' };
    if (!useBackupCode && tfaVerifyCode.length !== 6) return { valid: false, message: 'Enter your 6-digit authenticator code.' };
    return { valid: true, message: useBackupCode ? '8-character backup code entered.' : '6-digit code entered.' };
  }, [tfaVerifyCode, useBackupCode]);

  const handleClose = () => {
    onClose();
    setTfaPassword('');
    setTfaVerifyCode('');
    setTouchedPw(false);
    setTouchedCode(false);
  };

  const handleDisable = async () => {
    setTouchedPw(true);
    setTouchedCode(true);
    if (!pwValidation.valid || !codeValidation.valid) return;
    setIsLoading(true);
    try {
      await disable2FA(tfaPassword, tfaVerifyCode);
      showSuccess("2FA disabled successfully.");
      handleClose();
    } catch (e: any) {
      showError(e.message || 'Failed to disable 2FA. Please check your password and code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title="Disable 2FA" subtitle="Turn off Two-Factor Authentication" icon={<AlertTriangle className="text-red-500" size={20} />}>
      <div className="grid gap-6 mt-2">
        <div className="flex items-start gap-3 rounded-lg bg-red-500/10 p-4 border border-red-500/20 text-red-400">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <p className="text-[13px] leading-relaxed">
            Disabling 2FA will make your account less secure. Please confirm your password and enter a 2FA code to continue.
          </p>
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#888] mb-2 font-medium">Password</label>
          <input
            type="password"
            value={tfaPassword}
            onChange={(e) => { setTfaPassword(e.target.value); setTouchedPw(true); }}
            onBlur={() => setTouchedPw(true)}
            disabled={isLoading}
            className={`w-full h-11 rounded-lg border bg-[#161616] px-4 text-[13px] text-white outline-none focus:border-red-500/50 transition-colors disabled:opacity-50 ${touchedPw && !pwValidation.valid ? 'border-red-400/30' : 'border-[#222]'}`}
            placeholder="••••••••"
          />
          <ValidationMsg touched={touchedPw} valid={pwValidation.valid} message={pwValidation.message} hideSuccess={true} />
        </div>
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block text-[11px] uppercase tracking-wider text-[#888] font-medium">{useBackupCode ? 'Backup Code' : '2FA Code'}</label>
            <button type="button" onClick={() => { setUseBackupCode(!useBackupCode); setTfaVerifyCode(''); setTouchedCode(false); }} className="text-[12px] font-medium text-red-400 hover:text-red-300 transition-colors">
              {useBackupCode ? 'Use 2FA Code' : 'Use Backup Code'}
            </button>
          </div>
          <input
            type="text"
            maxLength={useBackupCode ? 8 : 6}
            value={tfaVerifyCode}
            onChange={(e) => { setTfaVerifyCode(e.target.value.replace(useBackupCode ? /[^0-9a-fA-F]/g : /\D/g, '')); setTouchedCode(true); }}
            onBlur={() => setTouchedCode(true)}
            disabled={isLoading}
            className={`w-full h-11 rounded-lg border bg-[#161616] px-4 text-[14px] text-white outline-none focus:border-red-500/50 transition-colors tracking-[0.2em] font-mono text-center disabled:opacity-50 ${touchedCode && !codeValidation.valid ? 'border-red-400/30' : 'border-[#222]'}`}
            placeholder={useBackupCode ? "a1b2c3d4" : "123456"}
          />
          <ValidationMsg touched={touchedCode} valid={codeValidation.valid} message={codeValidation.message} hideSuccess={true} />
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={handleClose} disabled={isLoading} className="flex h-11 items-center justify-center rounded-lg border border-[#222] px-6 text-[13px] font-medium text-[#888] hover:bg-[#161616] hover:text-white transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={handleDisable} disabled={isLoading || !codeValidation.valid} className={`flex h-11 items-center justify-center gap-2 rounded-lg px-6 text-[13px] font-medium transition-colors disabled:cursor-not-allowed ${(isLoading || !codeValidation.valid) ? 'bg-[#333] text-[#888]' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
            {isLoading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : "Confirm Disable"}
          </button>
        </div>
      </div>
    </Drawer>
  );
}


export function DeleteAccountDrawer({
  isOpen,
  onClose,
  onConfirm,
  loginMethod,
  tfaEnabled,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password?: string, tfaCode?: string) => Promise<void>;
  loginMethod?: string;
  tfaEnabled?: boolean;
}) {
  const [password, setPassword] = useState('');
  const [tfaCode, setTfaCode] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showError, showSuccess } = useToast();

  const handleClose = () => {
    onClose();
    setPassword('');
    setTfaCode('');
    setConfirmPhrase('');
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onConfirm(password, tfaCode);
      showSuccess("Account deleted successfully.");
      // Wait for redirect to happen in page.tsx
    } catch (e: any) {
      showError(e.message || 'An error occurred while deleting your account.');
      setIsLoading(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title="Delete account" subtitle="This action is permanent and cannot be undone." icon={<AlertTriangle className="text-red-500" size={20} />}>
      <div className="grid gap-6 mt-2">
        <div className="space-y-4 text-[13px] text-[#A0A0A0] leading-relaxed">
          <p>
            We will <strong className="text-[#EAEAEA] font-medium">delete all of your servers</strong>, along with all of your databases, backups, activity, and all other resources belonging to your account.
          </p>
          <p>
            It is recommended that you download any files you wish to keep from your servers.
          </p>
          <p>
            All related subscriptions will stop, and your invoices and billing history will no longer be accessible after deletion. Download any you need from the Invoices tab first.
          </p>
        </div>

        <div className="rounded-lg bg-[#3A1414] p-3 text-[#E5484D] text-[13px]">
          This action is not reversible. Please be certain.
        </div>

        {loginMethod === 'email' && (
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#888] mb-2 font-medium">Confirm Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              disabled={isLoading}
              className="w-full h-11 rounded-lg border border-[#222] bg-[#161616] px-4 text-[13px] text-white outline-none focus:border-red-500/50 transition-colors disabled:opacity-50" 
              placeholder="••••••••" 
            />
          </div>
        )}

        {tfaEnabled && (
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-[11px] uppercase tracking-wider text-[#888] font-medium">{useBackupCode ? 'Backup Code' : '2FA Code'}</label>
              <button type="button" onClick={() => { setUseBackupCode(!useBackupCode); setTfaCode(''); }} className="text-[12px] font-medium text-red-400 hover:text-red-300 transition-colors">
                {useBackupCode ? 'Use 2FA Code' : 'Use Backup Code'}
              </button>
            </div>
            <input 
              type="text" 
              maxLength={useBackupCode ? 8 : 6} 
              value={tfaCode} 
              onChange={(e) => setTfaCode(e.target.value.replace(useBackupCode ? /[^0-9a-fA-F]/g : /\D/g, ''))} 
              disabled={isLoading}
              className="w-full h-11 rounded-lg border border-[#222] bg-[#161616] px-4 text-[14px] text-white outline-none focus:border-red-500/50 transition-colors tracking-[0.2em] font-mono text-center disabled:opacity-50" 
              placeholder={useBackupCode ? "a1b2c3d4" : "123456"} 
            />
          </div>
        )}

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#888] mb-2 font-medium">Type "delete my account" to confirm</label>
          <input 
            type="text" 
            value={confirmPhrase} 
            onChange={(e) => setConfirmPhrase(e.target.value)} 
            disabled={isLoading}
            className="w-full h-11 rounded-lg border border-[#222] bg-[#161616] px-4 text-[13px] text-white outline-none focus:border-red-500/50 transition-colors disabled:opacity-50" 
            placeholder="delete my account" 
          />
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={handleClose} disabled={isLoading} className="flex h-11 items-center justify-center rounded-lg border border-[#222] px-6 text-[13px] font-medium text-[#888] hover:bg-[#161616] hover:text-white transition-colors disabled:opacity-50">Cancel</button>
          <button 
            type="button" 
            onClick={handleDelete} 
            disabled={isLoading || confirmPhrase.toLowerCase() !== 'delete my account' || (loginMethod === 'email' && !password) || (tfaEnabled && (useBackupCode ? tfaCode.length !== 8 : tfaCode.length !== 6))}
            className={`flex h-11 items-center justify-center gap-2 rounded-lg px-6 text-[13px] font-medium transition-colors disabled:cursor-not-allowed ${
              (isLoading || confirmPhrase.toLowerCase() !== 'delete my account' || (loginMethod === 'email' && !password) || (tfaEnabled && (useBackupCode ? tfaCode.length !== 8 : tfaCode.length !== 6))) ? 'bg-[#333] text-[#888]' : 
              'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isLoading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Trash2 size={15} />}
            Delete account
          </button>
        </div>
      </div>
    </Drawer>
  );
}

export function EmailVerificationDrawer({
  isOpen,
  onClose,
  email,
  onVerify,
  onResend,
  rateLimit,
  onRateLimitChange,
  onChangeEmail,
}: {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  rateLimit: number;
  onRateLimitChange: (val: number) => void;
  onChangeEmail?: () => void;
}) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { showError, showSuccess } = useToast();

  const handleVerify = async () => {
    if (code.length !== 8) return;
    setIsLoading(true);
    try {
      await onVerify(code);
      showSuccess("Email verified successfully.");
      handleClose();
    } catch (e: any) {
      showError(e.message || 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setCode('');
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title="Verify Email" subtitle="Enter the 8-digit verification code." icon={<Mail className="text-emerald-500" size={20} />}>
      <div className="grid gap-6 mt-2">
        <div className="flex items-center justify-between bg-[#161616] border border-[#222] rounded-lg p-3">
          <div className="text-[13px] text-left truncate pr-2">
            <span className="text-[#888] block text-[10px] uppercase tracking-wider mb-0.5">Email Address</span>
            <span className="font-medium text-white">{email || 'your email'}</span>
          </div>
          {onChangeEmail && (
            <button type="button" onClick={onChangeEmail} className="shrink-0 px-3 py-1.5 bg-[#222] hover:bg-[#333] border border-[#333] rounded-md text-[11px] font-medium text-[#aaa] hover:text-white transition-colors">
              Edit
            </button>
          )}
        </div>
        <p className="text-[13px] text-[#888] leading-relaxed -mt-3">
          We sent a verification code to your email. Please enter it below.
        </p>

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#888] mb-2 font-medium">Verification Code</label>
          <input 
            type="text" 
            maxLength={8} 
            value={code} 
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} 
            disabled={isLoading}
            className={`w-full h-11 rounded-lg border bg-[#161616] px-4 text-[14px] text-white outline-none focus:border-[#FF5722] transition-colors tracking-[0.2em] font-mono text-center disabled:opacity-50 border-[#222]`} 
            placeholder="12345678" 
          />
          <div className="mt-2 flex items-center justify-end">
            <button 
              type="button" 
              onClick={async () => {
                if (resendLoading || rateLimit > 0) return;
                setResendLoading(true);
                try {
                  await onResend();
                  onRateLimitChange(60);
                  showSuccess("Verification code resent.");
                } catch (e: any) {
                  if (e.retryAfter) onRateLimitChange(e.retryAfter);
                  else showError(e.message || 'Failed to resend code.');
                } finally {
                  setResendLoading(false);
                }
              }}
              disabled={resendLoading || rateLimit > 0}
              className="text-[11px] text-[#FF5722] hover:text-[#F4511E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {resendLoading ? 'Sending...' : rateLimit > 0 ? `Resend in ${Math.floor(rateLimit / 60) > 0 ? `${Math.floor(rateLimit / 60)}m ` : ''}${rateLimit % 60}s` : 'Resend Code'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={handleClose} disabled={isLoading} className="flex h-11 items-center justify-center rounded-lg border border-[#222] px-6 text-[13px] font-medium text-[#888] hover:bg-[#161616] hover:text-white transition-colors disabled:opacity-50">Cancel</button>
          <button type="button" onClick={handleVerify} disabled={isLoading || code.length !== 8} className={`flex h-11 items-center justify-center gap-2 rounded-lg px-6 text-[13px] font-medium transition-colors disabled:cursor-not-allowed ${(isLoading || code.length !== 8) ? 'bg-[#333] text-[#888]' : 'bg-[#FF5722] hover:bg-[#F4511E] text-white'}`}>
            {isLoading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : "Verify"}
          </button>
        </div>
      </div>
    </Drawer>
  );
}

