export function AdminLedgerTableSkeleton() {
  return (
    <div className="bg-[#181818] border border-[#303030] rounded-xl overflow-hidden shadow-lg">
      {/* Table Header */}
      <div className="p-6 border-b border-[#303030] bg-[#202020]">
        <div className="grid grid-cols-6 gap-6">
          {['Date', 'Provider', 'Order ID', 'Amount', 'Status', 'Actions'].map((header, i) => (
            <div 
              key={i} 
              className="h-4 bg-gradient-to-r from-[#303030] to-[#404040] rounded-lg animate-pulse" 
              style={{ 
                animationDelay: `${i * 100}ms`,
                animationDuration: '1.5s'
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-[#303030]">
        {[...Array(8)].map((_, rowIndex) => (
          <div key={rowIndex} className="p-6 hover:bg-[#202020] transition-colors">
            <div className="grid grid-cols-6 gap-6">
              {/* Date */}
              <div className="h-5 w-32 bg-gradient-to-r from-[#202020] to-[#303030] rounded-lg animate-pulse"></div>
              
              {/* Provider */}
              <div className="h-5 w-20 bg-gradient-to-r from-[#202020] to-[#303030] rounded-lg animate-pulse"></div>
              
              {/* Order ID */}
              <div className="h-5 w-40 bg-gradient-to-r from-[#202020] to-[#303030] rounded-lg animate-pulse"></div>
              
              {/* Amount */}
              <div className="h-5 w-24 bg-gradient-to-r from-[#202020] to-[#303030] rounded-lg animate-pulse"></div>
              
              {/* Status */}
              <div className="h-5 w-20 bg-gradient-to-r from-[#202020] to-[#303030] rounded-lg animate-pulse"></div>
              
              {/* Actions */}
              <div className="h-5 w-12 bg-gradient-to-r from-[#202020] to-[#303030] rounded-lg animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading Footer */}
      <div className="p-6 border-t border-[#303030] bg-[#202020]">
        <div className="flex items-center justify-center gap-3">
          <div className="w-4 h-4 bg-gradient-to-r from-[#404040] to-[#505050] rounded-full animate-pulse" style={{ animationDuration: '1s' }}></div>
          <div className="w-4 h-4 bg-gradient-to-r from-[#404040] to-[#505050] rounded-full animate-pulse" style={{ animationDuration: '1s', animationDelay: '0.2s' }}></div>
          <div className="w-4 h-4 bg-gradient-to-r from-[#404040] to-[#505050] rounded-full animate-pulse" style={{ animationDuration: '1s', animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}



