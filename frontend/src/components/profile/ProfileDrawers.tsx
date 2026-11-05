import React from "react";
import {
  PasswordDrawer,
  ChangeEmailDrawer,
  Setup2FADrawer,
  Disable2FADrawer,
  DeleteAccountDrawer,
  EmailVerificationDrawer,
} from "./index";

export interface ProfileDrawersProps {
  deleteOpen: boolean;
  setDeleteOpen: (open: boolean) => void;
  deleteAccount: (password?: string, tfaCode?: string) => Promise<void>;
  form: {
    email: string;
    loginMethod: string;
    tfaEnabled: boolean;
  };
  showChangeEmailDrawer: boolean;
  setShowChangeEmailDrawer: (open: boolean) => void;
  changeEmail: (email: string, password?: string, tfaCode?: string) => Promise<{ requiresVerification: boolean } | void>;
  verifyEmailChange: (email: string, code: string) => Promise<void>;
  showEmailVerificationDrawer: boolean;
  setShowEmailVerificationDrawer: (open: boolean) => void;
  verifyEmailCode: (code: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  resendRateLimit: number;
  setResendRateLimit: (sec: number) => void;
  showPasswordDrawer: boolean;
  setShowPasswordDrawer: (open: boolean) => void;
  updatePassword: (currentPassword: string, newPassword: string, tfaCode?: string) => Promise<void>;
  show2FASetupDrawer: boolean;
  setShow2FASetupDrawer: (open: boolean) => void;
  tfaSetupData: { secret: string; qrCodeUrl?: string; qr?: string } | null;
  tfaBackupCodes: string[] | null;
  setTfaBackupCodes: (codes: string[] | null) => void;
  verifyAndEnable2FA: (code: string) => Promise<void>;
  show2FADisableDrawer: boolean;
  setShow2FADisableDrawer: (open: boolean) => void;
  disable2FA: (password: string, code: string) => Promise<void>;
}

export function ProfileDrawers({
  deleteOpen,
  setDeleteOpen,
  deleteAccount,
  form,
  showChangeEmailDrawer,
  setShowChangeEmailDrawer,
  changeEmail,
  verifyEmailChange,
  showEmailVerificationDrawer,
  setShowEmailVerificationDrawer,
  verifyEmailCode,
  resendVerification,
  resendRateLimit,
  setResendRateLimit,
  showPasswordDrawer,
  setShowPasswordDrawer,
  updatePassword,
  show2FASetupDrawer,
  setShow2FASetupDrawer,
  tfaSetupData,
  tfaBackupCodes,
  setTfaBackupCodes,
  verifyAndEnable2FA,
  show2FADisableDrawer,
  setShow2FADisableDrawer,
  disable2FA,
}: ProfileDrawersProps) {
  return (
    <>
      <DeleteAccountDrawer
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteAccount}
        loginMethod={form.loginMethod}
        tfaEnabled={form.tfaEnabled}
      />

      <ChangeEmailDrawer
        isOpen={showChangeEmailDrawer}
        onClose={() => setShowChangeEmailDrawer(false)}
        tfaEnabled={form.tfaEnabled}
        loginMethod={form.loginMethod}
        changeEmail={changeEmail}
        verifyEmailChange={verifyEmailChange}
      />

      <EmailVerificationDrawer
        isOpen={showEmailVerificationDrawer}
        onClose={() => setShowEmailVerificationDrawer(false)}
        email={form.email}
        onVerify={verifyEmailCode}
        onResend={resendVerification}
        rateLimit={resendRateLimit}
        onRateLimitChange={setResendRateLimit}
        onChangeEmail={() => {
          setShowEmailVerificationDrawer(false);
          setShowChangeEmailDrawer(true);
        }}
      />

      <PasswordDrawer
        isOpen={showPasswordDrawer}
        onClose={() => setShowPasswordDrawer(false)}
        tfaEnabled={form.tfaEnabled}
        updatePassword={updatePassword}
      />

      <Setup2FADrawer
        isOpen={show2FASetupDrawer}
        onClose={() => setShow2FASetupDrawer(false)}
        tfaSetupData={tfaSetupData}
        tfaBackupCodes={tfaBackupCodes}
        setTfaBackupCodes={setTfaBackupCodes}
        verifyAndEnable2FA={verifyAndEnable2FA}
      />

      <Disable2FADrawer
        isOpen={show2FADisableDrawer}
        onClose={() => setShow2FADisableDrawer(false)}
        disable2FA={disable2FA}
        loginMethod={form.loginMethod}
      />
    </>
  );
}
