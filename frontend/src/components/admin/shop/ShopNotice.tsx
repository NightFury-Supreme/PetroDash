export function ShopNotice() {
  return (
    <div className="bg-[#202020] border border-[#303030] rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#181818] rounded-lg flex items-center justify-center">
          <i className="fas fa-info-circle text-white"></i>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-white mb-1">Shop Management</h4>
          <p className="text-xs text-[#AAAAAA]">
            These are preset shop items. You can toggle enabled status and adjust pricing/amounts. 
            Creation and deletion are disabled to maintain system integrity.
          </p>
        </div>
      </div>
    </div>
  );
}



