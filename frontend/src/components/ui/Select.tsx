import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string;
  [key: string]: any;
}

interface SelectProps {
  value: string;
  options?: SelectOption[];
  onChange?: (val: string) => void;
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
  size?: 'sm' | 'md';
  renderButtonContent?: (selectedLabel: string | undefined) => ReactNode;
  renderDropdown?: (props: { close: () => void }) => ReactNode;
}

export function Select({
  value,
  options = [],
  onChange,
  placeholder = 'Select an option...',
  className = '',
  dropdownClassName,
  size = 'md',
  renderButtonContent,
  renderDropdown
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeLabel = options.find((o) => o.value === value)?.label;

  const buttonClass = open
    ? 'bg-[#1A1A1A] border-[#FF5722] text-white'
    : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#D4D4D4] hover:border-[#FF5722]/50 hover:text-white';

  const sizeClass = size === 'sm' 
    ? 'h-8 px-3 text-xs rounded-md' 
    : 'px-4 py-2.5 text-sm rounded-lg';

  const dropdownItemSizeClass = size === 'sm' ? 'h-8 px-2 text-xs' : 'h-9 px-3 text-sm';

  return (
    <div className={`relative w-full ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between gap-2 border transition-colors focus:outline-none ${buttonClass} ${sizeClass}`}
      >
        <span className="truncate text-left">
          {renderButtonContent ? renderButtonContent(activeLabel) : (activeLabel || placeholder)}
        </span>
        <ChevronDown size={size === 'sm' ? 12 : 14} className={`opacity-50 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`absolute top-[calc(100%+4px)] z-50 rounded-lg border border-[#2A2A2A] bg-[#151515] p-1.5 shadow-xl max-h-[250px] overflow-y-auto ${dropdownClassName || 'left-0 right-0'}`}>
          {renderDropdown ? (
            renderDropdown({ close: () => setOpen(false) })
          ) : (
            <div className="flex flex-col gap-1">
              {options.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => { onChange?.(opt.value); setOpen(false); }}
                  className={`flex w-full items-center rounded-md text-left transition-colors ${dropdownItemSizeClass} ${opt.value === value ? 'bg-white/10 text-white' : 'text-[#D4D4D4] hover:bg-white/5 hover:text-white'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
