"use client";

type Template = { subject?: string; html?: string; text?: string };
type EmailBrand = { name?: string; logoUrl?: string; footerText?: string; brandColor?: string };

const TEMPLATE_NAMES: Record<string, string> = {
  accountCreateWithVerification: 'Verification Email',
  accountCreated: 'Account Created',
  accountDeleted: 'Account Deleted',
  accountDeletedByAdmin: 'Account Deleted (Admin)',
  accountBanned: 'Account Banned',
  accountUnbanned: 'Account Unbanned',
  loginAlert: 'Login Alert',
  serverCreated: 'Server Created',
  serverDeleted: 'Server Deleted',
  planPurchased: 'Plan Purchased',
  ticketCreated: 'Ticket Created',
  ticketReply: 'Ticket Reply'
};

export default function TemplatesEditor({ templates, brand, token, selectedKey, onSelect, onChange }:{
  templates: Record<string, Template>;
  brand: EmailBrand;
  token: string | null;
  selectedKey: string | undefined;
  onSelect: (key: string)=>void;
  onChange: (path: string, value: any)=>void;
}) {
  const key = selectedKey && templates[selectedKey] ? selectedKey : Object.keys(templates || {})[0];
  const tpl = key ? templates[key] : undefined;

  const renderPreviewHtml = () => {
    const htmlBody = tpl?.html || '<p>Preview</p>';
    const color = brand?.brandColor || '#0ea5e9';
    const footer = brand?.footerText || '';
    return `
    <div style="font-family:Segoe UI,Arial,sans-serif;background:#f6f8fb;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden;">
        <div style="padding:24px;color:#111827;line-height:1.6;">
          ${htmlBody}
        </div>
        <div style="padding:16px 20px;color:#6b7280;font-size:12px;border-top:1px solid #eef2f7;">${footer}</div>
      </div>
    </div>`;
  };


  const insert = (insertHtml: string) => {
    if (!key) return;
    onChange(`emailTemplates.${key}.html`, `${(tpl?.html || '').trim()}\n${insertHtml}`);
  };

  const handleHtmlKeyDown = (e: any) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      const insertText = '  ';
      const next = value.substring(0, start) + insertText + value.substring(end);
      target.value = next;
      target.selectionStart = target.selectionEnd = start + insertText.length;
      onChange(`emailTemplates.${key}.html`, next);
    }
  };

  const htmlLines = (tpl?.html || '').split('\n');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Email Template</label>
            <select className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white focus:border-[#404040] focus:outline-none transition-colors" value={key || ''} onChange={e => onSelect(e.target.value)}>
              {Object.keys(templates || {}).map(k => (
                <option key={k} value={k} className="bg-[#202020] text-white">{TEMPLATE_NAMES[k] || k}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <div className="text-[#bbb]">Quick HTML:</div>
        <button className="px-2 py-1 bg-[#222] text-[#ddd] rounded" onClick={() => insert('<h2>Heading</h2>')}>Heading</button>
        <button className="px-2 py-1 bg-[#222] text-[#ddd] rounded" onClick={() => insert('<p>Paragraph</p>')}>Paragraph</button>
        <button className="px-2 py-1 bg-[#222] text-[#ddd] rounded" onClick={() => insert('<a href="#" class="btn">Button</a>')}>Button</button>
        <button className="px-2 py-1 bg-[#222] text-[#ddd] rounded" onClick={() => insert('<hr/>')}>Divider</button>
      </div>

      <div className="text-xs text-[#999]">Placeholders: {'{{username}} {{verificationLink}} {{siteName}} {{siteIcon}} {{logoUrl}} {{brandColor}} {{serverName}} {{planName}} {{ip}} {{userAgent}} {{time}} {{reason}} {{until}} {{title}} {{snippet}}'}</div>

      {key && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-300px)]">
          <div className="space-y-4 h-full">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Email Subject</label>
              <input className="w-full h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors" placeholder="Welcome to {{siteName}}!" value={tpl?.subject || ''} onChange={e => onChange(`emailTemplates.${key}.subject`, e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">HTML Content</label>
              <div className="w-full h-[calc(100%-80px)] min-h-[400px] bg-[#0d0d0d] border border-[#303030] rounded-lg flex overflow-hidden">
                <div className="hidden md:block w-12 select-none text-right text-[#666] bg-[#0b0b0b] border-r border-[#303030] px-2 py-2 font-mono text-xs leading-6 overflow-auto">
                  {htmlLines.map((_, i) => (
                    <div key={i}>{i+1}</div>
                  ))}
                </div>
                <textarea
                  className="flex-1 outline-none resize-none bg-transparent text-white p-3 font-mono text-sm leading-6 placeholder-[#AAAAAA]"
                  placeholder="<h1>Welcome {{username}}!</h1><p>Thank you for joining {{siteName}}.</p>"
                  value={tpl?.html || ''}
                  onChange={e => onChange(`emailTemplates.${key}.html`, e.target.value)}
                  onKeyDown={handleHtmlKeyDown}
                />
              </div>
            </div>
          </div>
          <div className="h-full">
            <div className="text-[#bbb] text-sm mb-2">Live Preview</div>
            <iframe title="preview" className="w-full h-full bg-white rounded-lg border border-[#e5e7eb]" srcDoc={renderPreviewHtml()} />
          </div>
        </div>
      )}
    </div>
  );
}


