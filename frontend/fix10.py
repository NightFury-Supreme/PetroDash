import re

files = [
    'src/components/admin/locations/CreateLocationDrawer.tsx',
    'src/components/admin/locations/EditLocationDrawer.tsx'
]

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        c = f.read()
    
    if 'const [isDragging' not in c:
        c = c.replace('const [pendingFlagFile', 'const [isDragging, setIsDragging] = useState(false);\n  const [pendingFlagFile')
    
    # We will use regex to replace the entire 'Location Flag / Icon' div
    # The div starts with <div> then <label ...>Location Flag / Icon</label>
    # and ends right before <div><label ...>Node IP</label>
    
    old_ui_pattern = r'<div>\s*<label[^>]*>Location Flag / Icon</label>.*?</div>\s*<div>\s*<label[^>]*>Node IP</label>'
    
    new_ui = """<div>
                  <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Location Flag / Icon</label>
                  <div className="flex items-center gap-3">
                    {(flagPreview || form.flag) && (
                      <div className="relative w-11 h-11 bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <img
                          src={flagPreview || (form.flag && form.flag !== 'pending' ? `${process.env.NEXT_PUBLIC_API_BASE || ''}${form.flag}` : '')}
                          alt="Flag"
                          className="w-full h-full object-contain"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div
                      className="flex-1 min-w-0"
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileSelection(e.dataTransfer.files?.[0]); }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => handleFileSelection(e.target.files?.[0])}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFlag}
                        className={`flex items-center justify-between w-full rounded-lg border px-4 h-[44px] text-sm text-[#888] transition-colors outline-none ${isDragging ? 'bg-[#FF5722]/10 border-[#FF5722] text-[#FF5722]' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'}`}
                      >
                        <span className="truncate">
                          {uploadingFlag ? 'Uploading...' : form.flag ? 'Change flag (or drop/paste)' : 'Upload icon (or drop/paste)'}
                        </span>
                        {uploadingFlag ? <Loader2 size={16} className="animate-spin text-[#888] shrink-0" /> : <Upload size={16} className="text-[#888] shrink-0" />}
                      </button>
                    </div>

                    {form.flag && (
                      <button
                        type="button"
                        onClick={handleRemoveFlag}
                        className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 text-[10px] text-[#666]">Upload a PNG, JPG, or SVG image (max 5MB)</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">Node IP</label>"""
    
    c = re.sub(old_ui_pattern, new_ui, c, flags=re.DOTALL)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(c)

print('Done')
