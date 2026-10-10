"use client";

interface AuthFieldProps {
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  error?: string;
  onChange: (value: string) => void;
}

export default function AuthField({ label, type = 'text', value, placeholder, error, onChange }: AuthFieldProps) {
  return (
    <label className="block mb-4">
      <span className="block text-[11px] font-medium text-[#888888] mb-1.5 uppercase tracking-wider">{label}</span>
      <input
        className={`w-full h-[42px] rounded-[7px] px-[13px] bg-[#121212] border outline-none text-[#d5d5d5] text-[13px] placeholder:text-[#505050] transition-colors focus:bg-[#151515] ${
          error ? 'border-red-500/50 focus:border-red-500' : 'border-[#282828] focus:border-[#454545]'
        }`}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {error && <span className="block mt-1.5 text-[11px] text-red-400">{error}</span>}
    </label>
  );
}
