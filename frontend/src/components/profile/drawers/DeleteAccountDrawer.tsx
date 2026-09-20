import React, { useState } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

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
      
        const errKey = e.details?.[0]?.message || e.message;
        showError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : (e.message || 'An error occurred'));
    
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
          <button type="button" onClick={handleClose} disabled={isLoading} className="flex h-11 items-center justify-center rounded-lg border border-[#222] px-6 text-[13px] font-medium text-[#888] hover:bg-[#161616] hover:text-[#D4D4D4] transition-colors disabled:opacity-50 bg-transparent">{t('cancel')}</button>
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

