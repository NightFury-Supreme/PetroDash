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
    <label className="space-y-1 block">
      <span className="text-sm text-muted">{label}</span>
      <input
        className="w-full rounded-lg p-3"
        style={{ background: 'transparent', border: '1px solid var(--border)' }}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {error && <span className="text-xs" style={{ color: '#ff6b6b' }}>{error}</span>}
    </label>
  );
}
