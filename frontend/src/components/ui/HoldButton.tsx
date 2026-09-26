"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";

export interface HoldButtonProps {
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
  holdTimeMs?: number;
  overlayClass?: string;
  disabled?: boolean;
}

export function HoldButton({
  onClick,
  className = "",
  children,
  holdTimeMs = 5000,
  overlayClass = "bg-black/40",
  disabled = false,
}: HoldButtonProps) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

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
    if ("button" in e && e.button !== 0) return;
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
  }, [disabled, holdTimeMs, onClick, stopHold]);

  useEffect(() => {
    return stopHold;
  }, [stopHold]);

  return (
    <button
      className={`relative overflow-hidden select-none ${className} ${holding ? "scale-95" : ""}`}
      onMouseDown={startHold}
      onMouseUp={stopHold}
      onMouseLeave={stopHold}
      onTouchStart={startHold}
      onTouchEnd={stopHold}
      style={{ WebkitUserSelect: "none" }}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 pointer-events-none ${overlayClass}`}
        style={{ width: `${progress}%`, transition: "none" }}
      />
      <div className={`relative z-10 flex items-center gap-2 pointer-events-none ${disabled ? "opacity-70" : ""}`}>
        {holding ? `Hold... ${Math.ceil((holdTimeMs - (progress * holdTimeMs) / 100) / 1000)}s` : children}
      </div>
    </button>
  );
}
