"use client";

interface AuthSubmitProps {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function AuthSubmit({ children, disabled, onClick }: AuthSubmitProps) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={disabled}
      className="w-full h-[42px] mt-2 flex items-center justify-center rounded-[7px] bg-[#FF5722] hover:bg-[#F4511E] text-white text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
