"use client";

interface ResourceCardProps {
  title: string;
  used: number;
  limit: number;
  unit: string;
  icon: string;
  color: string;
}

export function ResourceCard({ title, used, limit, unit, icon, color }: ResourceCardProps) {
  const isUnlimited = limit <= 0;
  
  return (
    <div className="bg-[#202020] border border-[#303030] rounded-xl p-3 sm:p-4 hover:bg-[#272727] transition-colors group">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 ${color} rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
          <i className={`fas ${icon} text-white text-sm sm:text-base`}></i>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs sm:text-sm text-[#AAAAAA] font-medium">{title}</div>
          <div className="text-lg sm:text-xl font-bold text-white">
            {used.toLocaleString()}
            <span className="text-xs sm:text-sm font-normal text-[#AAAAAA] ml-1">{unit}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-[#AAAAAA]">Limit</div>
          <div className="text-sm font-medium text-white">
            {isUnlimited ? '∞' : `${limit.toLocaleString()}`}
          </div>
        </div>
      </div>
      
      {!isUnlimited && (
        <div className="w-full bg-[#181818] rounded-full h-1.5 mt-2 sm:mt-3">
          <div 
            className="h-1.5 rounded-full bg-white"
            style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}
