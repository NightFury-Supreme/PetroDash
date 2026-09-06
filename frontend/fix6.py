import re

with open('src/components/admin/locations/CreateLocationDrawer.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Add state
c = c.replace('const [error, setError] = useState<string | null>(null);',
              'const [error, setError] = useState<string | null>(null);\n  const [failed, setFailed] = useState(false);\n  const [saved, setSaved] = useState(false);')

# Update handleSubmit
old_submit = """  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      let finalFlag = form.flag;

      if (pendingFlagFile) {
        setUploadingFlag(true);
        const formData = new FormData();
        formData.append('file', pendingFlagFile);

        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadRes.ok) throw new Error('Failed to upload flag image');
        const data = await uploadRes.json();
        finalFlag = data.filePath;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, flag: finalFlag }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error((data as any)?.error || 'Failed to create location');

      onSuccess();
    } catch (e: any) {
      setError(e.message || 'Failed to create location');
      setLoading(false);
    }
  };"""

new_submit = """  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    setFailed(false);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      let finalFlag = form.flag;

      if (pendingFlagFile) {
        setUploadingFlag(true);
        const formData = new FormData();
        formData.append('file', pendingFlagFile);

        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadRes.ok) {
           const errData = await uploadRes.json().catch(() => ({}));
           throw new Error(errData.error || 'Failed to upload flag image');
        }
        
        const data = await uploadRes.json();
        finalFlag = data.filePath;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, flag: finalFlag }),
      });

      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data?.error || 'Failed to create location');

      setSaved(true);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (e: any) {
      setError(e.message || 'Failed to create location');
      setFailed(true);
      setTimeout(() => setFailed(false), 3000);
    } finally {
      setLoading(false);
      setUploadingFlag(false);
    }
  };"""

c = c.replace(old_submit, new_submit)

# Replace footer
old_footer = """        footer={
          <div className="flex items-center justify-between w-full">
            <div>{error && <p className="text-xs text-red-400 max-w-[200px] truncate">{error}</p>}</div>
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button type="button" onClick={() => setCurrentStepIndex(i => i - 1)} className="rounded-lg border border-[#222] bg-transparent px-4 py-2.5 text-sm font-medium text-[#D4D4D4] transition-colors hover:bg-[#161616]">Back</button>
              )}
              <button type="button" onClick={onClose} className="rounded-lg border border-[#222] bg-transparent px-4 py-2.5 text-sm font-medium text-[#D4D4D4] transition-colors hover:bg-[#161616]">Cancel</button>
              {isLastStep ? (
                <button type="button" onClick={handleSubmit} disabled={loading || uploadingFlag} className="flex items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50">
                  {(loading || uploadingFlag) ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : 'Create Location'}
                </button>
              ) : (
                <button type="button" onClick={() => setCurrentStepIndex(i => i + 1)} disabled={!canGoNext()} className="flex items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
              )}
            </div>
          </div>
        }"""

new_footer = """        footer={
          <div className="flex items-center justify-between w-full">
            {currentStepIndex > 0 ? (
              <button
                type="button"
                onClick={() => setCurrentStepIndex(i => i - 1)}
                className="px-4 py-2 text-sm font-medium text-[#888] hover:text-white transition-colors"
              >
                Back
              </button>
            ) : (
              <div></div>
            )}
            
            {currentStepIndex < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStepIndex(i => i + 1)}
                disabled={!canGoNext()}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || uploadingFlag}
                className={`flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  failed ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                  saved ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                  'bg-[#FF5722] hover:bg-[#F4511E]'
                }`}
              >
                {loading || uploadingFlag ? (
                  <><Loader2 size={15} className="animate-spin shrink-0" /> Creating...</>
                ) : saved ? (
                  <><Check size={15} className="shrink-0" /> Created!</>
                ) : failed ? (
                  <>
                    <Globe size={15} className="shrink-0 opacity-50" />
                    <span className="truncate">{error || 'Failed'}</span>
                  </>
                ) : (
                  <>
                    <Globe size={15} />
                    Create Location
                  </>
                )}
              </button>
            )}
          </div>
        }"""

c = c.replace(old_footer, new_footer)

with open('src/components/admin/locations/CreateLocationDrawer.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Done Create')
