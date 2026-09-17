'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';
import ForgotRequestForm from './ForgotRequestForm';
import ForgotResetForm from './ForgotResetForm';
import { useTranslations } from 'next-intl';

export default function ForgotCoordinator() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState(0);

  const t = useTranslations('Auth.forgot');
  const tErrors = useTranslations('Auth.errors');

  useEffect(() => {
    if (rateLimit > 0) {
      const t = setTimeout(() => setRateLimit((v) => v - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [rateLimit]);

  const handleRequest = async () => {
    if (!email || loading) return;
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || "";
      const res = await fetchWithRetry(`${base}/api/auth/forgot`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email })
      });
      if (res.ok) {
        showSuccess(t('successRequest'));
        setRateLimit(60);
        setStep("verify");
      } else {
        const data = await res.json().catch(() => ({}));
        showError(data.error || "Failed to send reset code");
      }
    } catch (_e) {
      showError("Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (loading) return;
    if (code.length !== 8) { showError("Enter the 8-digit code"); return; }
    if (!password || password.length < 12) { showError(tErrors('passwordShort')); return; }
    if (password !== confirm) { showError(tErrors('passwordsDontMatch')); return; }
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || "";
      const res = await fetchWithRetry(`${base}/api/auth/reset`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code, newPassword: password })
      });
      if (res.ok) {
        showSuccess(t('successReset'));
        setTimeout(() => router.replace('/login'), 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        showError(data.error || "Failed to reset password");
      }
    } catch (_e) {
      showError("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendLoading || rateLimit > 0 || !email) return;
    setResendLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || "";
      const res = await fetchWithRetry(`${base}/api/auth/forgot`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email })
      });
      if (res.ok) {
        setRateLimit(60);
        showSuccess(t('successRequest'));
      } else {
        const data = await res.json().catch(() => ({}));
        showError(data.error || "Failed to resend code");
      }
    } catch (_e) {
      showError("Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-left mb-8">
        <h2 className="text-2xl font-bold mb-1.5 tracking-tight">{step === 'request' ? t('requestTitle') : t('resetTitle')}</h2>
        <p className="text-[13px] text-[#888888]">{step === 'request' ? t('requestSubtitle') : t('resetSubtitle')}</p>
      </div>
      {step === 'request' ? (
        <ForgotRequestForm email={email} setEmail={setEmail} onRequest={handleRequest} loading={loading} />
      ) : (
        <ForgotResetForm
          email={email} setEmail={setEmail}
          code={code} setCode={setCode}
          password={password} setPassword={setPassword}
          confirm={confirm} setConfirm={setConfirm}
          onReset={handleReset} onResend={resendCode}
          loading={loading} resendLoading={resendLoading} rateLimit={rateLimit}
        />
      )}
    </div>
  );
}
