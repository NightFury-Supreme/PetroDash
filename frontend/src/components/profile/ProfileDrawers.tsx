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
  changeEmail: (email: string, password?: string, tfaCode?: string) => Promise<{ requiresVerification: boolean }>;
  verifyEmailChange: (email: string, code: string) => Promise<void>;
  showEmailVerificationModal: boolean;
  setShowEmailVerificationModal: (open: boolean) => void;
  verifyEmailCode: (code: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  resendRateLimit: number;
  setResendRateLimit: (sec: number) => void;
  showPasswordModal: boolean;
  setShowPasswordModal: (open: boolean) => void;
  updatePassword: (currentPassword: string, newPassword: string, tfaCode?: string) => Promise<void>;
  show2FASetupModal: boolean;
  setShow2FASetupModal: (open: boolean) => void;
  tfaSetupData: { secret: string; qrCodeUrl: string } | null;
  tfaBackupCodes: string[] | null;
  setTfaBackupCodes: (codes: string[] | null) => void;
  verifyAndEnable2FA: (code: string) => Promise<void>;
  show2FADisableModal: boolean;
  setShow2FADisableModal: (open: boolean) => void;
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
  showEmailVerificationModal,
  setShowEmailVerificationModal,
  verifyEmailCode,
  resendVerification,
  resendRateLimit,
  setResendRateLimit,
  showPasswordModal,
  setShowPasswordModal,
  updatePassword,
  show2FASetupModal,
  setShow2FASetupModal,
  tfaSetupData,
  tfaBackupCodes,
  setTfaBackupCodes,
  verifyAndEnable2FA,
  show2FADisableModal,
  setShow2FADisableModal,
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
        changeEmail={changeEmail}
        verifyEmailChange={verifyEmailChange}
      />

      <EmailVerificationDrawer
        isOpen={showEmailVerificationModal}
        onClose={() => setShowEmailVerificationModal(false)}
        email={form.email}
        onVerify={verifyEmailCode}
        onResend={resendVerification}
        rateLimit={resendRateLimit}
        onRateLimitChange={setResendRateLimit}
        onChangeEmail={() => {
          setShowEmailVerificationModal(false);
          setShowChangeEmailDrawer(true);
        }}
      />

      <PasswordDrawer
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        tfaEnabled={form.tfaEnabled}
        updatePassword={updatePassword}
      />

      <Setup2FADrawer
        isOpen={show2FASetupModal}
        onClose={() => setShow2FASetupModal(false)}
        tfaSetupData={tfaSetupData}
        tfaBackupCodes={tfaBackupCodes}
        setTfaBackupCodes={setTfaBackupCodes}
        verifyAndEnable2FA={verifyAndEnable2FA}
      />

      <Disable2FADrawer
        isOpen={show2FADisableModal}
        onClose={() => setShow2FADisableModal(false)}
        disable2FA={disable2FA}
      />
    </>
  );
}
