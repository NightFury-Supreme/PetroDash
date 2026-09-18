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
  
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [loginMethod, setLoginMethod] = useState("email");
  const [changeMode, setChangeMode] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tfaCode, setTfaCode] = useState("");

  useEffect(() => {
    try { setEmail(sessionStorage.getItem("verify_email") || ""); } catch {}
    let active = true;
    const check = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        if (!token) { if (active) router.replace("/login"); return; }
        const base = process.env.NEXT_PUBLIC_API_BASE || "";
        const [res, brandingRes] = await Promise.all([
          fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
          fetch(`${base}/api/branding`, { cache: "no-store" })
        ]);
        if (res.ok) {
          let data: any = {}; try { data = await res.json(); } catch {}
          let brandingData: any = {}; try { brandingData = await brandingRes.json(); } catch {}
          setTfaEnabled(Boolean(data.tfaEnabled));
          setLoginMethod(data.loginMethod || "email");
          if (!changeMode && data.email) {
            setEmail(data.email);
          }
          if (data.emailVerified || brandingData.emailVerification === false) {
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
    // eslint-disable-next-line unused-imports/no-unused-vars
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
        if (res.status === 429) {
           const retry = data.retryAfter || 60;
           setRateLimit(retry);
           setError(data.message || `Rate limit exceeded. Please try again in ${Math.ceil(retry/60)} minute(s).`);
        } else {
           setError(data.error || 'Failed to send verification code');
        }
      }
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (_e) {
      setError('Failed to send verification code');
    } finally {
      setResendLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) { setError('Please enter a valid email address'); return; }
    if (loginMethod === 'email' && password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (tfaEnabled && tfaCode.length !== 6) { setError('Please enter a valid 6-digit 2FA code'); return; }
    
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      const base = process.env.NEXT_PUBLIC_API_BASE || "";
      const payload: any = { email: newEmail };
      if (loginMethod === 'email') payload.password = password;
      if (tfaEnabled) payload.tfaCode = tfaCode;
      
      const res = await fetch(`${base}/api/auth/profile/email`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setEmail(newEmail);
        setChangeMode(false);
        setPassword("");
        setTfaCode("");
        setCode("");
        setSuccess('Email updated successfully! A new verification code has been sent.');
        setCodeSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to update email');
      }
    } catch {
      setError('Network error while updating email.');
    } finally {
      setLoading(false);
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

  if (changeMode) {
    return (
      <div className="w-full max-w-md mx-auto rounded-2xl p-8 text-center" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <AuthHeader iconClass="fas fa-envelope-open-text" iconBg="bg-[#3a200d]" title="Change Email" />
        <p className="text-[#AAAAAA] mb-6">Update your account email address.</p>
        
        <div className="space-y-4 text-left">
          <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-wider text-[#888] font-medium">New Email Address</label>
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="new@example.com" className="w-full h-11 rounded-lg border border-[#303030] bg-[#161616] px-4 text-[13px] text-white outline-none focus:border-[#FF5722] transition-colors" />
          </div>
          
          {loginMethod === 'email' && (
            <div className="space-y-2">
              <label className="block text-[11px] uppercase tracking-wider text-[#888] font-medium">Current Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full h-11 rounded-lg border border-[#303030] bg-[#161616] px-4 text-[13px] text-white outline-none focus:border-[#FF5722] transition-colors" />
            </div>
          )}
          
          {tfaEnabled && (
            <div className="space-y-2">
              <label className="block text-[11px] uppercase tracking-wider text-[#888] font-medium">2FA Code</label>
              <input type="text" maxLength={6} value={tfaCode} onChange={e => setTfaCode(e.target.value.replace(/\D/g, ''))} placeholder="123456" className="w-full h-11 rounded-lg border border-[#303030] bg-[#161616] px-4 text-[14px] text-white tracking-[0.2em] font-mono text-center outline-none focus:border-[#FF5722] transition-colors" />
            </div>
          )}

          {error && <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-sm mt-4 text-center">{error}</div>}
          
          <div className="space-y-3 mt-6">
            <button onClick={handleChangeEmail} disabled={loading} className="w-full bg-[#FF5722] hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors">
              {loading ? (
                <span className="flex items-center justify-center gap-2"><i className="fas fa-spinner fa-spin"></i>Updating...</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><i className="fas fa-save"></i>Change Email</span>
              )}
            </button>
            <button onClick={() => { setChangeMode(false); setError(null); }} disabled={loading} className="w-full bg-[#222] hover:bg-[#333] disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl p-8 text-center" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <AuthHeader iconClass="fas fa-envelope" iconBg="bg-[#0d3a3a]" title="Email Verification" />
      <p className="text-[#AAAAAA] mb-6">{codeSent ? 'Enter the 8-digit verification code sent to your email address.' : 'Click the button below to send a verification code to your email address.'}</p>
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-[#161616] border border-[#222] rounded-lg p-3">
          <div className="text-sm text-left truncate pr-2">
            <span className="text-[#AAAAAA] block text-[10px] uppercase tracking-wider mb-0.5">Email</span>
            <span className="font-medium text-white">{email}</span>
          </div>
          <button onClick={() => { setChangeMode(true); setNewEmail(email); setError(null); }} className="shrink-0 px-3 py-1.5 bg-[#222] hover:bg-[#333] border border-[#333] rounded-md text-[11px] font-medium text-[#aaa] hover:text-white transition-colors">
            Edit
          </button>
        </div>
        {codeSent && (
          <div className="space-y-2 pt-2">
            <label className="block text-[11px] uppercase tracking-wider text-[#888] font-medium text-left">Verification Code</label>
              <input type="text" value={code} onChange={handleCodeChange} placeholder="00000000" maxLength={8} className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest bg-[#161616] border border-[#303030] rounded-xl text-white placeholder-[#666] focus:outline-none focus:border-[#FF5722] transition-colors" style={{ letterSpacing: '0.5em' }} />
          </div>
        )}
        {success && !success.toLowerCase().includes('email verified') && (
          <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 text-sm">{success}</div>
        )}
        {error && (
          <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-sm">{error}</div>
        )}
        <div className="space-y-3 pt-2">
          {codeSent && (
            <button onClick={verifyCode} disabled={loading || code.length !== 8} className="w-full bg-[#FF5722] hover:bg-[#F4511E] disabled:bg-[#333] disabled:text-[#888] disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors">
              {loading ? (
                <span className="flex items-center justify-center gap-2"><i className="fas fa-spinner fa-spin"></i>Verifying...</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><i className="fas fa-check"></i>Verify Email</span>
              )}
            </button>
          )}
          <button onClick={resendCode} disabled={resendLoading || rateLimit > 0} className={`w-full font-semibold py-3 px-6 rounded-xl transition-colors ${codeSent ? 'bg-[#222] hover:bg-[#333] text-white disabled:opacity-50' : 'bg-[#FF5722] hover:bg-[#F4511E] text-white disabled:bg-[#333] disabled:text-[#888]'}`}>
            {resendLoading ? (
              <span className="flex items-center justify-center gap-2"><i className="fas fa-spinner fa-spin"></i>Sending...</span>
            ) : rateLimit > 0 ? (
              <span className="flex items-center justify-center gap-2"><i className="fas fa-clock"></i>Resend in {Math.floor(rateLimit / 60) > 0 ? `${Math.floor(rateLimit / 60)}m ` : ''}{rateLimit % 60}s</span>
            ) : (
              <span className="flex items-center justify-center gap-2"><i className="fas fa-paper-plane"></i>{codeSent ? 'Resend Code' : 'Send Verification Code'}</span>
            )}
          </button>
        </div>
      </div>
      <div className="mt-6 text-xs text-[#888]">Check your email inbox and spam folder for the verification code. The code expires in 15 minutes.</div>
    </div>
  );
}