import re

with open('src/components/admin/locations/CreateLocationDrawer.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

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
                className="flex items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(loading || uploadingFlag) ? <><Loader2 size={15} className="animate-spin shrink-0" /> Creating...</> : <><Globe size={15} /> Create Location</>}
              </button>
            )}
          </div>
        }"""

c = c.replace(old_footer, new_footer)

with open('src/components/admin/locations/CreateLocationDrawer.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Done Footer')
