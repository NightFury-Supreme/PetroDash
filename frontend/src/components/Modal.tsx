"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type ModalKind = "info" | "success" | "error" | "confirm" | "prompt";

type ModalOptions = {
  title?: string;
  body?: string;
  confirmText?: string;
  cancelText?: string;
  content?: React.ReactNode;
  defaultValue?: string; // for prompt
  prefix?: string;       // for prompt (static left text)
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
  resolver?: (value: any) => void;
};

const ModalContext = createContext<{
  confirm: (opts: ModalOptions) => Promise<boolean>;
  success: (opts: ModalOptions) => Promise<void>;
  error: (opts: ModalOptions) => Promise<void>;
  info: (opts: ModalOptions) => Promise<void>;
  prompt: (opts: ModalOptions) => Promise<string | null>;
} | null>(null);

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
        resolver: resolve,
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
    setState((s) => ({ ...s, open: false, resolver: undefined, content: undefined }));
    if (resolver) resolver(result);
  };

  const iconClass = state.kind === "error" ? "fa-circle-xmark text-red-400" : state.kind === "success" ? "fa-circle-check text-green-400" : state.kind === "confirm" ? "fa-circle-question text-yellow-300" : state.kind === "prompt" ? "fa-circle-question text-blue-300" : "fa-circle-info text-blue-300";

  return (
    <ModalContext.Provider value={api}>
      {children}
      {state.open && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-panel">
            <div className="modal-header">
              <span className="icon-badge" style={{ transform: 'scale(.9)' }}><i className={`fas ${iconClass}`}></i></span>
              <h3 className="font-semibold text-sm">{state.title}</h3>
            </div>
            <div className="modal-body text-sm text-gray-300">
              {state.kind === "prompt" ? (
                <div className="space-y-2">
                  {state.body && <div className="text-gray-300 text-sm">{state.body}</div>}
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    {state.prefix && (
                      <span className="px-2 py-2 bg-[#202020] border border-[#404040] rounded-lg text-xs text-[#AAAAAA] select-text">{state.prefix}</span>
                    )}
                    <input
                      className="flex-1 bg-[#202020] border border-[#404040] rounded-lg px-3 py-2 text-sm text-white"
                      autoFocus
                      value={state.inputValue || ''}
                      onChange={(e) => setState((s) => ({ ...s, inputValue: e.target.value }))}
                    />
                  </div>
                </div>
              ) : (
                state.content ?? state.body
              )}
            </div>
            <div className="modal-actions">
              {(state.kind === "confirm" || state.kind === "prompt") && (
                <button className="btn-ghost" onClick={() => close(state.kind === "prompt" ? null : false)}>{state.cancelText}</button>
              )}
              <button
                className={state.kind === "error" ? "btn-danger" : "btn-white"}
                onClick={() => close(state.kind === "prompt" ? (state.inputValue || '') : (state.kind === "confirm" ? true : undefined))}
              >
                {state.confirmText}
              </button>
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



