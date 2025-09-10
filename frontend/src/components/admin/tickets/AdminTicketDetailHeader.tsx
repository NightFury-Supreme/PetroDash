"use client";

export default function AdminTicketDetailHeader({ ticket, contentPadding, onAction }:{ ticket: any; contentPadding: number; onAction: (action: 'close'|'resolve'|'delete')=>Promise<void>; }){
  return (
    <div className="fixed top-0 right-0 z-40" style={{ left: contentPadding }}>
      <div className="h-20 px-6 flex items-center justify-between border-b border-[#303030] bg-[#0f0f0f]/80 backdrop-blur">
        <div className="flex items-center gap-4 w-full">
          <a href="/admin/tickets" className="w-10 h-10 rounded-xl border border-[#303030] flex items-center justify-center text-white hover:bg-[#111]"><i className="fas fa-arrow-left"/></a>
          <div className="w-12 h-12 bg-[#202020] border border-[#303030] rounded-2xl flex items-center justify-center text-white"><i className="fa-solid fa-ticket"/></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white truncate">{ticket?.title || 'Ticket'}</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${ticket?.status==='open'?'bg-green-600/20 text-green-300 border-green-700/50':ticket?.status==='pending'?'bg-yellow-600/20 text-yellow-300 border-yellow-700/50':ticket?.status==='resolved'?'bg-blue-600/20 text-blue-300 border-blue-700/50':'bg-[#303030] text-[#AAAAAA] border-[#404040]'}`}>{ticket?.status}</span>
              {ticket?.category && <span className="text-[10px] px-2 py-0.5 rounded-full border bg-[#303030] text-white border-[#404040]"><i className="fas fa-folder mr-1"/> {ticket.category}</span>}
              {ticket?.deletedByUser && <span className="text-[10px] px-2 py-0.5 rounded-full border bg-red-600/20 text-red-300 border-red-700/50">DELETED</span>}
            </div>
            <div className="text-sm text-[#AAAAAA] truncate">{ticket?.user?.username || ticket?.user?.email || 'User'}</div>
          </div>
          <div className="ml-auto">
            <div className="relative">
              <button id="adm-ticket-menu-btn" className="w-10 h-10 rounded-xl border border-[#303030] flex items-center justify-center text-white hover:bg-[#111]" onClick={(e)=>{
                e.stopPropagation();
                const menu = document.getElementById('adm-ticket-menu');
                if (menu) menu.classList.toggle('hidden');
              }}><i className="fas fa-ellipsis-h"/></button>
              <div id="adm-ticket-menu" className="hidden absolute right-0 mt-2 w-48 rounded-lg border border-[#303030] bg-[#181818] shadow-xl z-50" onClick={(e)=>e.stopPropagation()}>
                <button onClick={async()=>{ await onAction('close'); const m=document.getElementById('adm-ticket-menu'); if(m) m.classList.add('hidden'); }} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#202020]">Close Ticket</button>
                <button onClick={async()=>{ await onAction('resolve'); const m=document.getElementById('adm-ticket-menu'); if(m) m.classList.add('hidden'); }} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#202020]">Resolve</button>
                {!ticket?.deletedByUser && (
                  <button onClick={async()=>{ await onAction('delete'); }} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-[#202020]">Soft Delete</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


