"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthHeader from "@/components/auth/AuthHeader";

export default function VerifyCard() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [rateLimit, setRateLimit] = useState<number>(0);

  useEffect(() => {
    try { setEmail(sessionStorage.getItem("verify_email") || ""); } catch {}
    let active = true;
    const check = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        if (!token) { if (active) router.replace("/login"); return; }
        const base = process.env.NEXT_PUBLIC_API_BASE || "";
        const res = await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.emailVerified) {
            if (!active) return;
            try { sessionStorage.removeItem("verify_email"); } catch {}
            router.replace("/dashboard");
          }
        } else if (res.status === 401) {
          if (active) router.replace("/login");
        }
      } catch {
        if (active) router.replace("/login");
      }
    };
    check();
    const id = setInterval(check, 5000);
    return () => { active = false; clearInterval(id); };
  }, [router]);

  useEffect(() => {
    if (rateLimit > 0) {
      const timer = setTimeout(() => setRateLimit(rateLimit - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [rateLimit]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
    setCode(value);
    setError(null);
  };

  const verifyCode = async () => {
    if (code.length !== 8) { setError('Please enter an 8-digit verification code'); return; }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      const base = process.env.NEXT_PUBLIC_API_BASE || "";
      const res = await fetch(`${base}/api/auth/verify/code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, code })
      });
      if (res.ok) {
        try { sessionStorage.removeItem("verify_email"); } catch {}
        setSuccess('Email verified successfully');
        setError(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Invalid verification code');
      }
    } catch (_e) {
      setError('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (resendLoading || rateLimit > 0) return;
    setResendLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      const base = process.env.NEXT_PUBLIC_API_BASE || "";
      const res = await fetch(`${base}/api/auth/verify/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setRateLimit(60);
        setCodeSent(true);
        setSuccess('Verification code sent! Check your email.');
        setError(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to send verification code');
      }
    } catch (_e) {
      setError('Failed to send verification code');
    } finally {
      setResendLoading(false);
    }
  };

  if (success && success.toLowerCase().includes('email verified')) {
    return (
      <div className="w-full max-w-md mx-auto rounded-2xl p-8 text-center" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <AuthHeader iconClass="fas fa-check" iconBg="bg-[#0d3a0d]" title="Email Verified!" />
        <p className="text-[#AAAAAA] text-lg">Your email address has been successfully verified.</p>
        <div className="mt-8">
          <button onClick={() => router.replace('/dashboard')} className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-3 px-6 rounded-xl transition-colors">
            <span className="flex items-center justify-center gap-2">
              <i className="fas fa-arrow-right text-black"></i>
              Go to Dashboard
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl p-8 text-center" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <AuthHeader iconClass="fas fa-envelope" iconBg="bg-[#0d3a3a]" title="Email Verification" />
      <p className="text-[#AAAAAA] mb-6">{codeSent ? 'Enter the 8-digit verification code sent to your email address.' : 'Click the button below to send a verification code to your email address.'}</p>
      <div className="space-y-4">
        <div className="text-sm">
          <span className="text-[#AAAAAA]">Email:</span> <span className="font-medium">{email}</span>
        </div>
        {codeSent && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white text-left">Verification Code</label>
              <input type="text" value={code} onChange={handleCodeChange} placeholder="00000000" maxLength={8} className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest bg-[#202020] border border-[#303030] rounded-xl text-white placeholder-[#666] focus:outline-none focus:border-blue-500 transition-colors" style={{ letterSpacing: '0.5em' }} />
          </div>
        )}
        {success && !success.toLowerCase().includes('email verified') && (
          <div className="p-3 rounded-lg bg-green-900/20 border border-green-500/30 text-green-400 text-sm">{success}</div>
        )}
        {error && (
          <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-sm">{error}</div>
        )}
        <div className="space-y-3">
          {codeSent && (
            <button onClick={verifyCode} disabled={loading || code.length !== 8} className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed text-black font-semibold py-3 px-6 rounded-xl transition-colors">
              {loading ? (
                <span className="flex items-center justify-center gap-2"><i className="fas fa-spinner fa-spin text-black"></i>Verifying...</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><i className="fas fa-check text-black"></i>Verify Email</span>
              )}
            </button>
          )}
          <button onClick={resendCode} disabled={resendLoading || rateLimit > 0} className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed text-black font-semibold py-3 px-6 rounded-xl transition-colors">
            {resendLoading ? (
              <span className="flex items-center justify-center gap-2"><i className="fas fa-spinner fa-spin text-black"></i>Sending...</span>
            ) : rateLimit > 0 ? (
              <span className="flex items-center justify-center gap-2"><i className="fas fa-clock text-black"></i>Resend in {rateLimit}s</span>
            ) : (
              <span className="flex items-center justify-center gap-2"><i className="fas fa-paper-plane text-black"></i>{codeSent ? 'Resend Code' : 'Send Verification Code'}</span>
            )}
          </button>
        </div>
      </div>
      <div className="mt-6 text-xs text-[#888]">Check your email inbox and spam folder for the verification code. The code expires in 15 minutes.</div>
    </div>
  );
}