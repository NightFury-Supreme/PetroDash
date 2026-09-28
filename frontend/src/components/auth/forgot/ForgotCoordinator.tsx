'use client';
import React, { useState } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { useForgot } from '@/hooks/auth';
import ForgotRequestForm from './ForgotRequestForm';
import ForgotResetForm from './ForgotResetForm';
import { useTranslations } from 'next-intl';

export default function ForgotCoordinator() {
  const { showError } = useToast();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const {
    loading,
    resendLoading,
    rateLimit,
    requestReset,
    confirmReset,
    resendResetCode,
  } = useForgot();

  const t = useTranslations('Auth.forgot');
  const tErrors = useTranslations('Auth.errors');

  const handleRequest = async () => {
    const success = await requestReset(email);
    if (success) {
      setStep('verify');
    }
  };

  const handleReset = async () => {
    if (code.length !== 8) {
      showError(tErrors('enter8DigitCode'));
      return;
    }
    if (!password || password.length < 12) {
      showError(tErrors('passwordShort12'));
      return;
    }
    if (password !== confirm) {
      showError(tErrors('passwordsDontMatch'));
      return;
    }
    await confirmReset(email, code, password);
  };

  const resendCode = async () => {
    await resendResetCode(email);
  };

  return (
    <div className="w-full">
      <div className="text-left mb-8">
        <h2 className="text-2xl font-bold mb-1.5 tracking-tight">
          {step === 'request' ? t('requestTitle') : t('resetTitle')}
        </h2>
        <p className="text-[13px] text-[#888888]">
          {step === 'request' ? t('requestSubtitle') : t('resetSubtitle')}
        </p>
      </div>
      {step === 'request' ? (
        <ForgotRequestForm email={email} setEmail={setEmail} onRequest={handleRequest} loading={loading} />
      ) : (
        <ForgotResetForm
          email={email}
          setEmail={setEmail}
          code={code}
          setCode={setCode}
          password={password}
          setPassword={setPassword}
          confirm={confirm}
          setConfirm={setConfirm}
          onReset={handleReset}
          onResend={resendCode}
          loading={loading}
          resendLoading={resendLoading}
          rateLimit={rateLimit}
        />
      )}
    </div>
  );
}
