import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import React, { useState } from 'react';
import { useToast } from "@/components/ui/ToastProvider";
import { Drawer } from '@/components/ui/Drawer';
import { AlertTriangle
} from "lucide-react";

export function DeleteAccountDrawer({ isOpen,
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
  const t = useTranslations('Profile');
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
      
        showError(e.message);
    
      setIsLoading(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title={t('deleteAccount')} subtitle={t('deleteAccountDesc')} icon={<AlertTriangle className="text-red-500" size={20} />}>
      <div className="grid gap-6 mt-2">
        <div className="space-y-4 text-[13px] text-[#A0A0A0] leading-relaxed">
          <p>
            {t('deleteWarning1')}
          </p>
          <p>
            {t('deleteWarning2')}
          </p>
          <p>
            {t('deleteWarning3')}
          </p>
        </div>

        <div className="rounded-lg bg-[#3A1414] p-3 text-[#E5484D] text-[13px]">
          {t('deleteIrreversible')}
        </div>

        {loginMethod === 'email' && (
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#888] mb-2 font-medium">{t('confirmPassword')}</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              disabled={isLoading}
              className="w-full h-11 rounded-lg border border-[#222] bg-[#161616] px-4 text-[13px] text-white outline-none focus:border-red-500/50 transition-colors disabled:opacity-50" 
              placeholder={t('placeholderPassword')} 
            />
          </div>
        )}

        {tfaEnabled && (
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-[11px] uppercase tracking-wider text-[#888] font-medium">{useBackupCode ? t('backupCode') : t('tfaCode')}</label>
              <button type="button" onClick={() => { setUseBackupCode(!useBackupCode); setTfaCode(''); }} className="text-[12px] font-medium text-red-400 hover:text-red-300 transition-colors">
                {useBackupCode ? t('use2faCode') : t('useBackupCode')}
              </button>
            </div>
            <input 
              type="text" 
              maxLength={useBackupCode ? 8 : 6} 
              value={tfaCode} 
              onChange={(e) => setTfaCode(e.target.value.replace(useBackupCode ? /[^0-9a-fA-F]/g : /\D/g, ''))} 
              disabled={isLoading}
              className="w-full h-11 rounded-lg border border-[#222] bg-[#161616] px-4 text-[14px] text-white outline-none focus:border-red-500/50 transition-colors tracking-[0.2em] font-mono text-center disabled:opacity-50" 
              placeholder={useBackupCode ? t('placeholderBackup') : t('placeholder123456')} 
            />
          </div>
        )}

        <div>
          <label className="block text-[11px] uppercase tracking-wider text-[#888] mb-2 font-medium">{t('typeDeleteAccount')}</label>
          <input 
            type="text" 
            value={confirmPhrase} 
            onChange={(e) => setConfirmPhrase(e.target.value)} 
            disabled={isLoading}
            className="w-full h-11 rounded-lg border border-[#222] bg-[#161616] px-4 text-[13px] text-white outline-none focus:border-red-500/50 transition-colors disabled:opacity-50" 
            placeholder={t('deleteMyAccount')} 
          />
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={handleClose} disabled={isLoading} className="flex h-11 items-center justify-center rounded-lg border border-[#222] px-6 text-[13px] font-medium text-[#888] hover:bg-[#161616] hover:text-[#D4D4D4] transition-colors disabled:opacity-50 bg-transparent">{t('cancel')}</button>
          <button 
            type="button" 
            onClick={handleDelete} 
            disabled={isLoading || confirmPhrase.toLowerCase() !== t('deleteMyAccount').toLowerCase() || (loginMethod === 'email' && !password) || (tfaEnabled && (useBackupCode ? tfaCode.length !== 8 : tfaCode.length !== 6))}
            className={`flex h-11 items-center justify-center gap-2 rounded-lg px-6 text-[13px] font-medium transition-colors disabled:cursor-not-allowed ${
              (isLoading || confirmPhrase.toLowerCase() !== t('deleteMyAccount').toLowerCase() || (loginMethod === 'email' && !password) || (tfaEnabled && (useBackupCode ? tfaCode.length !== 8 : tfaCode.length !== 6))) ? 'bg-[#333] text-[#888]' : 
              'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isLoading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Trash2 size={15} />}
            {t('deleteAccountButton')}
          </button>
        </div>
      </div>
    </Drawer>
  );
}

