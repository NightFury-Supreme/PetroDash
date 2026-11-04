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
  itemClassName?: string;
  selectedItemClassName?: string;
  header?: ReactNode;
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
  itemClassName = '',
  selectedItemClassName = '',
  header,
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

  const heightClass = buttonClassName.includes('h-') ? '' : 'h-9';
  const textClass = buttonClassName.includes('text-') ? '' : 'text-sm';
  const bgClass = buttonClassName.includes('bg-') ? '' : 'bg-[#1A1A1A]';
  const borderClass = buttonClassName.includes('border-') ? '' : 'border border-[#222]';
  const textColClass = buttonClassName.includes('text-[#') || buttonClassName.includes('text-white') ? '' : 'text-[#858585]';
  const hoverClass = buttonClassName.includes('hover:') ? '' : 'hover:border-[#333] hover:bg-[#222] hover:text-white';
  const focusBorderClass = buttonClassName.includes('focus:') ? '' : 'focus:border-[#333]';
  const menuBgClass = menuClassName.includes('bg-') ? '' : 'bg-[#151515]';
  const menuBorderClass = menuClassName.includes('border-') ? '' : 'border border-[#222]';
  const menuMaxHClass = menuClassName.includes('max-h-') ? '' : 'max-h-[200px]';
  const itemTextClass = buttonClassName.includes('text-xs')
    ? 'text-xs'
    : buttonClassName.includes('text-[11px]')
    ? 'text-[11px]'
    : 'text-sm';

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && !isLoading && setOpen(!open)}
        disabled={disabled || isLoading}
        className={`group flex ${heightClass} w-full items-center justify-between gap-2 rounded-lg ${borderClass} ${bgClass} px-3 ${textClass} ${textColClass} transition-colors ${hoverClass} focus:outline-none ${focusBorderClass} ${open && buttonClassName.includes('border-[#282828]') ? 'border-[#454545] bg-[#151515]' : ''} disabled:opacity-50 ${buttonClassName}`}
      >
        <span className="truncate flex items-center gap-2 w-full">{displayContent}</span>
        {isLoading ? (
          <Loader2 size={14} className="animate-spin text-white/80 shrink-0" />
        ) : (
          <ChevronDown size={14} className={`text-[#858585] shrink-0 transition-transform group-hover:text-white ${open ? 'rotate-180 text-white' : ''}`} />
        )}
      </button>

      {open && (
        <div
          className={`absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-lg ${menuBorderClass} ${menuBgClass} p-1 shadow-xl ${menuMaxHClass} overflow-y-auto ${menuClassName}`}
        >
          {header && <div className="px-2 pb-1 pt-1">{header}</div>}
          {options.map((opt) => {
            const isSelected = opt.value === activeValue;
            const defaultItemCls = isSelected
              ? (selectedItemClassName || 'bg-white/10 text-white')
              : (itemClassName || 'text-white/70 hover:bg-white/10 hover:text-white');
            const itemH = itemClassName && itemClassName.includes('h-') ? '' : 'h-8';
            return (
              <button
                type="button"
                key={opt.value}
                disabled={opt.disabled}
                onClick={() => handleSelect(opt.value)}
                className={`flex ${itemH} w-full items-center rounded px-2 text-left ${itemTextClass} transition-colors disabled:opacity-50 ${defaultItemCls}`}
              >
                <div className="truncate flex items-center gap-2 w-full">{opt.label}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const SettingsDropdown = SelectDropdown;
