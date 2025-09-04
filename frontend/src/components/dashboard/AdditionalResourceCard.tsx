"use client";

interface AdditionalResourceCardProps {
  title: string;
  used: number;
  limit: number;
  icon: string;
}

export function AdditionalResourceCard({ title, used, limit, icon }: AdditionalResourceCardProps) {
  return (
    <div className="bg-[#202020] border border-[#303030] rounded-xl p-3 sm:p-4 hover:bg-[#272727] transition-colors">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#303030] rounded-lg flex items-center justify-center">
          <i className={`fas ${icon} text-[#AAAAAA] text-xs sm:text-sm`}></i>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[#AAAAAA]">{title}</div>
          <div className="text-base sm:text-lg font-bold text-white">{used}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-[#AAAAAA]">Limit</div>
          <div className="text-sm font-medium text-white">{limit}</div>
        </div>
      </div>
    </div>
  );
}
