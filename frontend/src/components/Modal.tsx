"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type ModalKind = "info" | "success" | "error" | "confirm";

type ModalOptions = {
  title?: string;
  body?: string;
  confirmText?: string;
  cancelText?: string;
};

type ModalState = {
  open: boolean;
  kind: ModalKind;
  title: string;
  body: string;
  confirmText: string;
  cancelText: string;
  resolver?: (value: boolean | void) => void;
};

const ModalContext = createContext<{
  confirm: (opts: ModalOptions) => Promise<boolean>;
  success: (opts: ModalOptions) => Promise<void>;
  error: (opts: ModalOptions) => Promise<void>;
  info: (opts: ModalOptions) => Promise<void>;
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
    return new Promise<boolean | void>((resolve) => {
      setState({
        open: true,
        kind,
        title: opts.title || (kind === "error" ? "Error" : kind === "success" ? "Success" : kind === "confirm" ? "Confirm" : "Notice"),
        body: opts.body || "",
        confirmText: opts.confirmText || (kind === "confirm" ? "Confirm" : "OK"),
        cancelText: opts.cancelText || "Cancel",
        resolver: resolve,
      });
    });
  }, []);

  const api = useMemo(() => ({
    confirm: (opts: ModalOptions) => openModal("confirm", opts) as Promise<boolean>,
    success: (opts: ModalOptions) => openModal("success", opts) as Promise<void>,
    error: (opts: ModalOptions) => openModal("error", opts) as Promise<void>,
    info: (opts: ModalOptions) => openModal("info", opts) as Promise<void>,
  }), [openModal]);

  const close = (result?: boolean) => {
    const resolver = state.resolver;
    setState((s) => ({ ...s, open: false, resolver: undefined }));
    if (resolver) resolver(result);
  };

  const iconClass = state.kind === "error" ? "fa-circle-xmark text-red-400" : state.kind === "success" ? "fa-circle-check text-green-400" : state.kind === "confirm" ? "fa-circle-question text-yellow-300" : "fa-circle-info text-blue-300";

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
              {state.body}
            </div>
            <div className="modal-actions">
              {state.kind === "confirm" && (
                <button className="btn-ghost" onClick={() => close(false)}>{state.cancelText}</button>
              )}
              <button
                className={state.kind === "error" ? "btn-danger" : "btn-white"}
                onClick={() => close(state.kind === "confirm" ? true : undefined)}
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



