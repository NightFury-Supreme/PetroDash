'use client';
import { useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import AuthSubmit from '@/components/auth/layout/AuthSubmit';
import { useToast } from '@/components/ui/ToastProvider';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export default function TwoFactorForm({ tempToken, onSuccess, onCancel }: { tempToken: string; onSuccess: (token: string) => void; onCancel: () => void }) {
  const { showError } = useToast();
  const [tfaCode, setTfaCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);

  const codeReady = useBackupCode ? tfaCode.length === 8 : tfaCode.length === 6;

  const on2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tfaCode) { showError('Code is required'); return; }
    setLoading(true);
    try {
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/login/2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code: tfaCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '2FA failed');
      if (!data?.token) throw new Error('Invalid response');
      onSuccess(data.token);
    } catch (err: any) {
      showError(err.message || '2FA failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={on2FASubmit} className="space-y-5 text-center">
      <div className="text-left mb-8">
        <h2 className="text-2xl font-bold mb-1.5 tracking-tight">Two-Factor Authentication</h2>
        <p className="text-[13px] text-[#888888]">
          {useBackupCode ? 'Enter one of your 8-character backup codes.' : 'Enter the 6-digit code from your authenticator app.'}
        </p>
      </div>
      <div className="text-left">
        <label className="block text-[11px] font-medium text-[#888888] mb-1.5 uppercase tracking-wider">
          {useBackupCode ? 'Backup Code' : 'Authentication Code'}
        </label>
        <input
          type="text"
          value={tfaCode}
          onChange={(e) => {
            const v = e.target.value;
            setTfaCode(useBackupCode ? v.toLowerCase().replace(/[^a-f0-9]/g, '') : v.replace(/\D/g, ''));
          }}
          maxLength={useBackupCode ? 8 : 6}
          placeholder={useBackupCode ? 'a1b2c3d4' : '123456'}
          className={`w-full h-[42px] rounded-[7px] px-[13px] bg-[#121212] border outline-none text-[#d5d5d5] transition-colors focus:bg-[#151515] font-mono text-center tracking-[0.2em] ${
            useBackupCode ? 'text-[14px]' : 'text-[16px]'
          } border-[#282828] focus:border-[#454545]`}
          autoFocus
          autoComplete="one-time-code"
        />
        {tfaCode.length > 0 && (
          <div className={`mt-2 flex items-center gap-1.5 text-[11px] ${codeReady ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
            {codeReady ? <Check size={11} /> : <AlertCircle size={11} />}
            <span>{codeReady ? (useBackupCode ? 'Backup code ready.' : '6-digit code ready.') : (useBackupCode ? 'Must be exactly 8 characters (a-f, 0-9).' : 'Must be exactly 6 digits.')}</span>
          </div>
        )}
      </div>
      <AuthSubmit disabled={loading || !codeReady}>{loading ? 'Verifying.' : 'Verify'}</AuthSubmit>
      <div className="flex flex-col items-start gap-2 pt-1">
        <button type="button" onClick={() => { setUseBackupCode(!useBackupCode); setTfaCode(''); }} className="text-[12px] text-[#FF5722] hover:text-[#F4511E] transition-colors">
          {useBackupCode ? 'Use authenticator app instead' : 'Use a backup code instead'}
        </button>
        <button type="button" onClick={onCancel} className="text-[12px] text-[#888888] hover:text-[#FF5722] transition-colors">
          Return to login
        </button>
      </div>
    </form>
  );
}
