import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

export interface SelectDropdownOption<T extends string = string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export interface SelectDropdownProps<T extends string = string> {
  value: T;
  options: SelectDropdownOption<T>[];
  onChange: (val: T) => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  renderSelected?: (selectedOption: SelectDropdownOption<T> | undefined) => ReactNode;
}

export function SelectDropdown<T extends string = string>({
  value,
  options,
  onChange,
  disabled,
  loading: externalLoading,
  placeholder,
  className = 'w-full max-w-md',
  buttonClassName = '',
  menuClassName = '',
  renderSelected,
}: SelectDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  const [optimisticValue, setOptimisticValue] = useState<T | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const isLoading = externalLoading || internalLoading;

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelect = async (optValue: T) => {
    setOpen(false);
    if (optValue === value) return;

    setOptimisticValue(optValue);
    try {
      const result = onChange(optValue);
      if (result && typeof (result as Promise<void>).then === 'function') {
        setInternalLoading(true);
        await result;
      }
    } catch (err) {
      setOptimisticValue(null);
      throw err;
    } finally {
      setInternalLoading(false);
      setOptimisticValue(null);
    }
  };

  const activeValue = optimisticValue ?? value;
  const selectedOption = options.find((o) => o.value === activeValue);
  const displayContent = renderSelected
    ? renderSelected(selectedOption)
    : selectedOption?.label ?? placeholder ?? activeValue;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && !isLoading && setOpen(!open)}
        disabled={disabled || isLoading}
        className={`flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-[#222] bg-[#1A1A1A] px-3 text-sm text-[#999] transition-colors hover:border-[#333] hover:bg-[#222] hover:text-[#ddd] focus:outline-none focus:border-[#333] disabled:opacity-50 ${buttonClassName}`}
      >
        <span className="truncate flex items-center gap-2">{displayContent}</span>
        {isLoading ? (
          <Loader2 size={14} className="animate-spin text-white/80 shrink-0" />
        ) : (
          <ChevronDown size={14} className={`opacity-50 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && (
        <div
          className={`absolute left-0 right-0 top-10 z-50 rounded-lg border border-[#222] bg-[#151515] p-1 shadow-xl max-h-[200px] overflow-y-auto ${menuClassName}`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === activeValue;
            return (
              <button
                type="button"
                key={opt.value}
                disabled={opt.disabled}
                onClick={() => handleSelect(opt.value)}
                className={`flex h-8 w-full items-center rounded px-2 text-left text-sm transition-colors disabled:opacity-50 ${
                  isSelected
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="truncate flex items-center gap-2">{opt.label}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const SettingsDropdown = SelectDropdown;
