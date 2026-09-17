'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';
import VerifyCodeForm from './VerifyCodeForm';
import ChangeEmailForm from './ChangeEmailForm';

export default function VerifyCoordinator() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const tErrors = useTranslations('Auth.errors');
  const tVerify = useTranslations('Auth.verify');
  
  const [email, setEmail] = useState("");
  const [loginMethod, setLoginMethod] = useState("");
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [changeMode, setChangeMode] = useState(false);
  
  const [code, setCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tfaCode, setTfaCode] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (rateLimit > 0) {
      const t = setTimeout(() => setRateLimit((v) => v - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [rateLimit]);

  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) { router.replace('/login'); return; }
        const base = process.env.NEXT_PUBLIC_API_BASE || "";
        const res = await fetchWithRetry(`${base}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) { localStorage.removeItem("auth_token"); router.replace('/login'); return; }
        const data = await res.json();
        if (!mounted) return;
        if (data.emailVerified) { router.replace('/dashboard'); return; }
        setEmail(data.email || "");
        setLoginMethod(data.loginMethod || "");
        setTfaEnabled(data.tfaEnabled || false);
        setInitialLoading(false);
      } catch (err) {
        if (mounted) router.replace('/login');
      }
    };
    fetchStatus();
    return () => { mounted = false; };
  }, []);

  const verifyCode = async () => {
    if (code.length !== 8 || loading) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      const base = process.env.NEXT_PUBLIC_API_BASE || "";
      const res = await fetchWithRetry(`${base}/api/auth/verify`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ code })
      });
      if (res.ok) {
        showSuccess(tVerify('successVerified'));
        setTimeout(() => router.replace('/dashboard'), 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        showError(data.error || tErrors('invalidVerifyCode'));
      }
    } catch (_e) {
      showError(tErrors('invalidVerifyCode'));
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendLoading || rateLimit > 0) return;
    setResendLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      const base = process.env.NEXT_PUBLIC_API_BASE || "";
      const res = await fetchWithRetry(`${base}/api/auth/verify/resend`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setRateLimit(60);
        setCodeSent(true);
        showSuccess(tVerify('successSent'));
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
           const retry = data.retryAfter || 60;
           setRateLimit(retry);
           showError(data.message || tErrors('rateLimitExceeded'));
        } else {
           showError(data.error || tErrors('failedSendVerify'));
        }
      }
    } catch (_e) {
      showError(tErrors('failedSendVerify'));
    } finally {
      setResendLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) { showError(tErrors('validEmailRequired')); return; }
    if (loginMethod === 'email' && password.length < 6) { showError(tErrors('password6Chars')); return; }
    if (tfaEnabled && tfaCode.length !== 6) { showError(tErrors('valid2faCode')); return; }
    
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      const base = process.env.NEXT_PUBLIC_API_BASE || "";
      const payload: any = { email: newEmail };
      if (loginMethod === 'email') payload.password = password;
      if (tfaEnabled) payload.tfaCode = tfaCode;
      
      const res = await fetchWithRetry(`${base}/api/auth/profile/email`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload)
      });
      if (res.ok) {
        setEmail(newEmail);
        setChangeMode(false);
        setPassword("");
        setTfaCode("");
        setCode("");
        showSuccess(tVerify('successUpdated'));
        setCodeSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        showError(data.error || tErrors('failedUpdateEmail'));
      }
    } catch {
      showError(tErrors('networkErrorUpdateEmail'));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="py-12 flex justify-center"><i className="fas fa-spinner fa-spin text-2xl text-[#FF5722]"></i></div>;
  }

  if (changeMode) {
    return (
      <ChangeEmailForm
        newEmail={newEmail} setNewEmail={setNewEmail}
        password={password} setPassword={setPassword}
        tfaCode={tfaCode} setTfaCode={setTfaCode}
        loginMethod={loginMethod} tfaEnabled={tfaEnabled}
        onSave={handleChangeEmail} onCancel={() => setChangeMode(false)}
        loading={loading}
      />
    );
  }

  return (
    <VerifyCodeForm
      email={email} code={code} setCode={setCode}
      codeSent={codeSent}
      onChangeEmailRequest={() => { setChangeMode(true); setNewEmail(email); }}
      onVerify={verifyCode} onResend={resendCode}
      loading={loading} resendLoading={resendLoading} rateLimit={rateLimit}
    />
  );
}
