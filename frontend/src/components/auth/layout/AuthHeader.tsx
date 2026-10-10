"use client";

interface AuthHeaderProps {
  iconClass: string;
  iconBg?: string;
  title: string;
}

export default function AuthHeader({ iconClass, iconBg = "bg-[#0d3a3a]", title }: AuthHeaderProps) {
  return (
    <div className="flex items-center justify-center gap-3 mb-4">
      <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center`}>
        <i className={`${iconClass} text-white text-2xl`}></i>
      </div>
      <h1 className="text-3xl font-extrabold text-white">{title}</h1>
    </div>
  );
}
