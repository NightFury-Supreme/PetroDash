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
      className="w-full h-[42px] mt-2 flex items-center justify-center rounded-[7px] bg-[#FF5722] hover:bg-[#F4511E] text-white text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
