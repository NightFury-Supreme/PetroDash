"use client";

export default function AdminTicketMessages({ ticket }:{ ticket: any }){
  return (
    <div className="pb-28 px-2 space-y-3 h-[calc(100vh-180px)] overflow-y-auto overflow-x-hidden">
      {(ticket?.messages || []).map((m:any, idx:number) => {
        const isFromUser = String(m.author?._id || m.author) === String(ticket.user?._id || ticket.user);
        const authorName = m.author?.username || m.author?.email || (isFromUser ? 'User' : 'Admin');
        const rowCls = isFromUser ? 'justify-end' : 'justify-start';
        const bubbleBase = 'max-w-[80%] rounded-2xl px-4 py-2 shadow border';
        const bubbleAdmin = m.internal ? 'bg-[#181818] border-[#303030] text-white rounded-tl-none' : 'bg-[#181818] border-[#303030] text-white rounded-tl-none';
        const bubbleUser = 'bg-[#202020] border-[#303030] text-white rounded-tr-none';
        return (
          <div key={idx} className={`w-full flex ${rowCls}`}>
            <div className={`flex flex-col ${isFromUser ? 'items-end' : 'items-start'} max-w-full`}>
              <div className={`text-xs ${isFromUser ? 'text-right' : 'text-left'} text-[#CCCCCC] mb-1 flex ${isFromUser ? 'justify-end' : 'justify-start'} items-center gap-2 w-full`}>
                <span className="text-white">{authorName}</span>
                {!isFromUser && <span className={`text-[10px] px-2 py-0.5 rounded-full border ${m.internal ? 'bg-yellow-600/20 text-yellow-300 border-yellow-700/50' : 'bg-[#202020] text-white border-[#303030]'}`}>{m.internal ? 'INTERNAL' : 'ADMIN'}</span>}
              </div>
              <div className={`${bubbleBase} ${isFromUser ? bubbleUser : bubbleAdmin} relative`}>
                <div className="whitespace-pre-wrap break-words pr-16">{m.body}</div>
                <div className="absolute bottom-1 right-3 text-[11px] text-[#AAAAAA]">{new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


