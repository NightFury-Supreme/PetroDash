"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Loader2, Check, AlertTriangle } from "lucide-react";

type ModalKind = "info" | "success" | "error" | "confirm" | "prompt";

type ModalOptions = {
  title?: string;
  body?: string;
  confirmText?: string;
  cancelText?: string;
  content?: React.ReactNode;
  defaultValue?: string; // for prompt
  prefix?: string;       // for prompt (static left text)
  requiredInput?: string; // for prompt, disable confirm button until this is typed
  danger?: boolean;
  requireHold?: boolean; // requires user to hold button for 5s
  onConfirm?: (inputValue?: string) => Promise<boolean | void>; // If provided, runs before closing
};

type ModalState = {
  open: boolean;
  kind: ModalKind;
  title: string;
  body: string;
  confirmText: string;
  cancelText: string;
  content?: React.ReactNode;
  inputValue?: string; // for prompt
  prefix?: string;     // for prompt
  requiredInput?: string;
  danger?: boolean;
  requireHold?: boolean;
  resolver?: (value: any) => void;
  onConfirm?: (inputValue?: string) => Promise<boolean | void>;
  loading?: boolean;
  success?: boolean;
  error?: string;
};

const ModalContext = createContext<{
  confirm: (opts: ModalOptions) => Promise<boolean>;
  success: (opts: ModalOptions) => Promise<void>;
  error: (opts: ModalOptions) => Promise<void>;
  info: (opts: ModalOptions) => Promise<void>;
  prompt: (opts: ModalOptions) => Promise<string | null>;
} | null>(null);

function HoldButton({ 
  onClick, 
  className, 
  children, 
  holdTimeMs = 5000,
  overlayClass = "bg-black/40",
  disabled = false
}: { 
  onClick: () => void; 
  className?: string; 
  children: React.ReactNode; 
  holdTimeMs?: number; 
  overlayClass?: string;
  disabled?: boolean;
}) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = React.useRef<number>(0);

  const stopHold = useCallback(() => {
    setHolding(false);
    setProgress(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startHold = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    if ('button' in e && e.button !== 0) return; // Only left click
    setHolding(true);
    setProgress(0);
    startTimeRef.current = Date.now();
    
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / holdTimeMs) * 100, 100);
      setProgress(pct);
      
      if (pct >= 100) {
        stopHold();
        onClick();
      }
    }, 50);
  }, [holdTimeMs, onClick, stopHold]);

  React.useEffect(() => {
    return stopHold;
  }, [stopHold]);

  return (
    <button
      className={`relative overflow-hidden select-none ${className} ${holding ? 'scale-95' : ''}`}
      onMouseDown={startHold}
      onMouseUp={stopHold}
      onMouseLeave={stopHold}
      onTouchStart={startHold}
      onTouchEnd={stopHold}
      style={{ WebkitUserSelect: 'none' }}
    >
      <div 
        className={`absolute left-0 top-0 bottom-0 pointer-events-none ${overlayClass}`} 
        style={{ width: `${progress}%`, transition: 'none' }} 
      />
      <div className={`relative z-10 flex items-center gap-2 pointer-events-none ${disabled ? 'opacity-70' : ''}`}>
        {holding ? `Hold... ${Math.ceil((holdTimeMs - progress * holdTimeMs / 100) / 1000)}s` : children}
      </div>
    </button>
  );
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ModalState>({
    open: false,
    kind: "info",
    title: "",
    body: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
  });

  const openModal = useCallback((kind: ModalKind, opts: ModalOptions) => {
    return new Promise<any>((resolve) => {
      setState({
        open: true,
        kind,
        title: opts.title || (kind === "error" ? "Error" : kind === "success" ? "Success" : kind === "confirm" ? "Confirm" : kind === "prompt" ? "Enter value" : "Notice"),
        body: opts.body || "",
        confirmText: opts.confirmText || ((kind === "confirm" || kind === "prompt") ? "Confirm" : "OK"),
        cancelText: opts.cancelText || "Cancel",
        content: opts.content,
        inputValue: opts.defaultValue,
        prefix: opts.prefix,
        requiredInput: opts.requiredInput,
        danger: opts.danger,
        requireHold: opts.requireHold,
        onConfirm: opts.onConfirm,
        resolver: resolve,
        loading: false,
        success: false,
        error: undefined,
      });
    });
  }, []);

  const api = useMemo(() => ({
    confirm: (opts: ModalOptions) => openModal("confirm", opts) as Promise<boolean>,
    success: (opts: ModalOptions) => openModal("success", opts) as Promise<void>,
    error: (opts: ModalOptions) => openModal("error", opts) as Promise<void>,
    info: (opts: ModalOptions) => openModal("info", opts) as Promise<void>,
    prompt: (opts: ModalOptions) => openModal("prompt", opts) as Promise<string | null>,
  }), [openModal]);

  const close = (result?: any) => {
    const resolver = state.resolver;
    setState((s) => ({ ...s, open: false, resolver: undefined, content: undefined, loading: false, success: false, error: undefined, onConfirm: undefined }));
    if (resolver) resolver(result);
  };

  const handleConfirm = async () => {
    if (state.onConfirm) {
      setState(s => ({ ...s, loading: true, error: undefined }));
      try {
        const result = await state.onConfirm(state.inputValue);
        if (result === false) {
          setState(s => ({ ...s, loading: false }));
          return;
        }
        setState(s => ({ ...s, loading: false, success: true }));
        setTimeout(() => close(state.kind === "prompt" ? state.inputValue : true), 1500);
      } catch (err: any) {
        setState(s => ({ ...s, loading: false, error: err.message || "Action failed" }));
        setTimeout(() => setState(s => ({ ...s, error: undefined })), 3000);
      }
    } else {
      close(state.kind === "prompt" ? (state.inputValue || '') : (state.kind === "confirm" ? true : undefined));
    }
  };


  return (
    <ModalContext.Provider value={api}>
      {children}
      {state.open && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black/60 z-[999] font-['Inter',sans-serif]" 
          role="dialog" 
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              close(state.kind === "prompt" ? null : false);
            }
          }}
        >
          <div className="w-full max-w-[440px] rounded-xl border border-[#222] bg-[#161616]">
            
            <div className="px-6 py-[18px] border-b border-[#222] flex justify-between items-center">
              <h2 className={`m-0 text-[15px] font-medium flex items-center gap-[10px] ${(state.kind === 'error' || state.danger) ? 'text-red-500' : 'text-[#D4D4D4]'} [&>svg]:stroke-2`}>
                {(state.kind === 'error' || state.danger) && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                )}
                {state.kind === 'success' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                )}
                {state.kind === 'info' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                )}
                {state.title}
              </h2>
            </div>

            <div className="p-6 text-[13px] leading-[1.6] text-[#888888]">
              {state.kind === "prompt" ? (
                <div className="space-y-4">
                  {state.content ?? (state.body && <div>{state.body}</div>)}
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    {state.prefix && (
                      <span className="px-3 py-2 bg-[#1A1A1A] border border-[#222] rounded-md text-xs text-[#888888] select-text">{state.prefix}</span>
                    )}
                    <input
                      className="flex-1 bg-[#1A1A1A] border border-[#222] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#444] transition-colors"
                      autoFocus
                      value={state.inputValue || ''}
                      onChange={(e) => setState((s) => ({ ...s, inputValue: e.target.value }))}
                    />
                  </div>
                </div>
              ) : (
                state.content ?? <div>{state.body}</div>
              )}
            </div>

            <div className="px-6 py-4 bg-[#1A1A1A] border-t border-[#222] rounded-b-xl flex justify-end gap-[10px]">
              {(() => {
                const isConfirmDisabled = state.loading || state.success || (state.kind === 'prompt' && state.requiredInput !== undefined && state.inputValue?.toLowerCase() !== state.requiredInput.toLowerCase());
                return (
                  <>
                    {(state.kind === "confirm" || state.kind === "prompt") && (
                      <button 
                        className="text-[13px] font-medium py-2 px-4 rounded-md cursor-pointer transition-all duration-200 flex items-center gap-2 bg-transparent text-[#D4D4D4] border border-[#222] hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed" 
                        onClick={() => close(state.kind === "prompt" ? null : false)}
                        disabled={state.loading || state.success}
                      >
                        {state.cancelText}
                      </button>
                    )}
                    {state.requireHold ? (
                      <HoldButton
                        className={`text-[13px] font-medium py-2 px-4 rounded-md cursor-pointer transition-all duration-200 flex items-center gap-2 ${(state.kind === "error" || state.danger) && !state.success ? "bg-red-500 text-white hover:bg-red-600 border border-transparent" : (state.success ? "bg-emerald-500 text-white border border-transparent cursor-default" : "bg-white text-black border border-white hover:bg-gray-200")}`}
                        overlayClass={(state.kind === "error" || state.danger) ? "bg-white/25" : "bg-black/10"}
                        onClick={handleConfirm}
                        holdTimeMs={5000}
                        disabled={isConfirmDisabled}
                      >
                        {state.loading ? (
                          <><Loader2 size={14} className="animate-spin" />Processing...</>
                        ) : state.success ? (
                          <><Check size={14} />Done!</>
                        ) : state.error ? (
                          <><AlertTriangle size={14} className="shrink-0" /><span className="truncate max-w-[200px]">{state.error}</span></>
                        ) : (
                          <>
                            {(state.kind === "error" || state.danger) && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                              </svg>
                            )}
                            {state.confirmText}
                          </>
                        )}
                      </HoldButton>
                    ) : (
                      <button
                        className={`text-[13px] font-medium py-2 px-4 rounded-md cursor-pointer transition-all duration-200 flex items-center gap-2 ${(state.kind === "error" || state.danger) && !state.success ? "bg-red-500 text-white hover:bg-red-600 border border-transparent" : (state.success ? "bg-emerald-500 text-white border border-transparent cursor-default" : "bg-white text-black border border-white hover:bg-gray-200")} disabled:opacity-70 disabled:cursor-not-allowed`}
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled}
                      >
                        {state.loading ? (
                          <><Loader2 size={14} className="animate-spin" />Processing...</>
                        ) : state.success ? (
                          <><Check size={14} />Done!</>
                        ) : state.error ? (
                          <><AlertTriangle size={14} className="shrink-0" /><span className="truncate max-w-[200px]">{state.error}</span></>
                        ) : (
                          <>
                            {(state.kind === "error" || state.danger) && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                              </svg>
                            )}
                            {state.confirmText}
                          </>
                        )}
                      </button>
                    )}
                  </>
                );
              })()}
            </div>

          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}



