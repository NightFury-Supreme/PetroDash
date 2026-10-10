"use client";

import { useEffect, useState, ReactNode } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";

interface DeleteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  entityType: string;
  entityName: string;
  entitySubText?: string;
  icon?: ReactNode;
  warningPoints?: string[];
  requireConfirmText?: boolean;
}

import { useToast } from "@/components/ui/ToastProvider";
import { useTranslations } from "next-intl";

export function DeleteDrawer({
  isOpen,
  onClose,
  onConfirm,
  entityType,
  entityName,
  entitySubText,
  icon,
  warningPoints,
  requireConfirmText = true,
}: DeleteDrawerProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { showError } = useToast();
  const t = useTranslations('UI.deleteDrawer');

  useEffect(() => {
    if (isOpen) {
      setConfirmText("");
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (requireConfirmText && confirmText.trim().toLowerCase() !== entityName.trim().toLowerCase()) return;
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      console.error(err);
      showError(err.message || t('failedToDelete', { type: entityType.toLowerCase() }));
      setIsDeleting(false);
    }
  };

  const isConfirmDisabled = requireConfirmText && confirmText.trim().toLowerCase() !== entityName.trim().toLowerCase();

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t('title', { type: entityType })}
      subtitle={t('subtitle', { type: entityType.toLowerCase() })}
      footer={
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg border border-[#222] bg-transparent px-5 py-2 text-sm font-medium text-[#888] transition-colors hover:border-[#333] hover:text-[#D4D4D4]"
          >
            {t('cancel')}
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled || isDeleting}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
              isConfirmDisabled || isDeleting
                ? "bg-[#111] text-[#555] cursor-not-allowed"
                : "bg-red-500 text-white hover:bg-red-600 shadow-sm"
            }`}
          >
            {isDeleting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <X size={16} />
            )}
            {t('deleteBtn', { type: entityType })}
          </button>
        </div>
      }
    >
      <div className="border-b border-white/[0.07] pb-6 mb-8 mt-2">
        <div className="flex flex-row items-center gap-5">
          {icon && (
            <div className="flex shrink-0 items-center justify-center text-zinc-300">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-[16px] font-semibold text-zinc-200 truncate leading-snug">{entityName}</h2>
            {entitySubText && (
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-[#888]">
                  {entitySubText}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {warningPoints && warningPoints.length > 0 && (
        <div className="border-l-2 border-red-500 pl-5 py-1 mb-10">
          <div className="flex items-center gap-2 text-red-500 mb-4">
            <AlertTriangle size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">{t('beforeContinue')}</span>
          </div>
          <ul className="space-y-3">
            {warningPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-zinc-400">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-red-500"></span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {requireConfirmText && (
        <div>
          <h2 className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500 mb-4">
            {t.rich('typeToConfirm', { name: () => <span className="text-zinc-100">{entityName.toUpperCase()}</span> })}
          </h2>
          <div className="flex overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#161616] focus-within:border-orange-500/50 transition-colors">
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={entityName.toUpperCase()}
              className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-[13px] text-white outline-none placeholder:text-zinc-600"
            />
          </div>
        </div>
      )}
    </Drawer>
  );
}
