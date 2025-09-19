"use client";

type Smtp = { host?: string; port?: number; secure?: boolean; user?: string; pass?: string; fromEmail?: string };

export default function SmtpForm({ smtp, onChange, fieldErrors }:{ smtp: Smtp; onChange: (path: string, value: any)=>void; fieldErrors: Record<string, string>; }) {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">SMTP Host</label>
          <input 
            className={`w-full h-12 bg-[#202020] border ${fieldErrors['payments.smtp.host'] ? 'border-red-500' : 'border-[#303030]'} rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors`} 
            placeholder="smtp.gmail.com" 
            value={smtp?.host || ''} 
            onChange={e => onChange('payments.smtp.host', e.target.value)} 
          />
          {fieldErrors['payments.smtp.host'] && <div className="text-red-400 text-xs mt-1">{fieldErrors['payments.smtp.host']}</div>}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">Port</label>
          <input 
            className={`w-full h-12 bg-[#202020] border ${fieldErrors['payments.smtp.port'] ? 'border-red-500' : 'border-[#303030]'} rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors`} 
            placeholder="587" 
            type="number" 
            value={smtp?.port || 587} 
            onChange={e => onChange('payments.smtp.port', Number(e.target.value))} 
          />
          {fieldErrors['payments.smtp.port'] && <div className="text-red-400 text-xs mt-1">{fieldErrors['payments.smtp.port']}</div>}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">Username</label>
          <input 
            className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors" 
            placeholder="your-email@gmail.com" 
            value={smtp?.user || ''} 
            onChange={e => onChange('payments.smtp.user', e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">Password</label>
          <input 
            className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors" 
            placeholder="App Password" 
            type="password" 
            value={smtp?.pass || ''} 
            onChange={e => onChange('payments.smtp.pass', e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">From Email</label>
          <input 
            className={`w-full h-12 bg-[#202020] border ${fieldErrors['payments.smtp.fromEmail'] ? 'border-red-500' : 'border-[#303030]'} rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors`} 
            placeholder="noreply@yoursite.com" 
            value={smtp?.fromEmail || ''} 
            onChange={e => onChange('payments.smtp.fromEmail', e.target.value)} 
          />
          {fieldErrors['payments.smtp.fromEmail'] && <div className="text-red-400 text-xs mt-1">{fieldErrors['payments.smtp.fromEmail']}</div>}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">Security</label>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={!!smtp?.secure} 
                onChange={e => onChange('payments.smtp.secure', e.target.checked)} 
              />
              <div className="w-11 h-6 bg-[#303030] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b0b0f] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
            </label>
            <span className="text-white font-medium">Use TLS/SSL</span>
          </div>
        </div>
      </div>
    </div>
  );
}



