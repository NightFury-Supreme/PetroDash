'use client';
import React, { useState } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';
import { useVerify } from '@/hooks/auth';
import { AuthSpinner } from '../layout';
import VerifyCodeForm from './VerifyCodeForm';
import ChangeEmailForm from './ChangeEmailForm';

export default function VerifyCoordinator() {
  const { showError } = useToast();
  const t = useTranslations('Auth.verify');
  const tErrors = useTranslations('Auth.errors');

  const {
    email,
    loginMethod,
    tfaEnabled,
    codeSent,
    initialLoading,
    loading,
    resendLoading,
    rateLimit,
    verifyCode,
    resendCode,
    changeEmail,
  } = useVerify();

  const [changeMode, setChangeMode] = useState(false);
  const [code, setCode] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tfaCode, setTfaCode] = useState('');

  const handleVerify = async () => {
    await verifyCode(code);
  };

  const handleResend = async () => {
    await resendCode();
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      showError(tErrors('validEmailRequired'));
      return;
    }
    if (loginMethod === 'email' && password.length < 6) {
      showError(tErrors('password6Chars'));
      return;
    }
    if (tfaEnabled && tfaCode.length !== 6) {
      showError(tErrors('valid2faCode'));
      return;
    }

    const payload: { email: string; password?: string; tfaCode?: string } = { email: newEmail };
    if (loginMethod === 'email') payload.password = password;
    if (tfaEnabled) payload.tfaCode = tfaCode;

    const success = await changeEmail(payload);
    if (success) {
      setChangeMode(false);
      setPassword('');
      setTfaCode('');
      setCode('');
    }
  };

  const resolveSubtitle = () => {
    if (changeMode) return t('changeEmailSubtitle');
    return codeSent ? t('descSent') : t('descUnsent');
  };

  return (
    <div className="w-full">
      <div className="text-left mb-8">
        <h2 className="text-2xl font-bold mb-1.5 tracking-tight">
          {changeMode ? t('changeEmailTitle') : t('title')}
        </h2>
        <p className="text-[13px] text-[#888888]">
          {resolveSubtitle()}
        </p>
      </div>

      {initialLoading ? (
        <div className="py-12 flex justify-center">
          <AuthSpinner className="h-8 w-8 !border-t-[#FF5722]" />
        </div>
      ) : changeMode ? (
        <ChangeEmailForm
          newEmail={newEmail}
          setNewEmail={setNewEmail}
          password={password}
          setPassword={setPassword}
          tfaCode={tfaCode}
          setTfaCode={setTfaCode}
          loginMethod={loginMethod}
          tfaEnabled={tfaEnabled}
          onSave={handleChangeEmail}
          onCancel={() => setChangeMode(false)}
          loading={loading}
        />
      ) : (
        <VerifyCodeForm
          email={email}
          code={code}
          setCode={setCode}
          codeSent={codeSent}
          onChangeEmailRequest={() => {
            setChangeMode(true);
            setNewEmail(email);
          }}
          onVerify={handleVerify}
          onResend={handleResend}
          loading={loading}
          resendLoading={resendLoading}
          rateLimit={rateLimit}
        />
      )}
    </div>
  );
}
