"use client";

interface AuthSubmitProps {
  children: React.ReactNode;
  disabled?: boolean;
}

export default function AuthSubmit({ children, disabled }: AuthSubmitProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full rounded-lg px-4 py-3 font-medium"
      style={{ background: disabled ? '#ffffffcc' : '#ffffff', color: '#111', border: '1px solid var(--border)' }}
    >
      {children}
    </button>
  );
}
