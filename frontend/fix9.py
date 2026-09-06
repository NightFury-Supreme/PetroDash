import re

with open('src/components/admin/locations/CreateLocationDrawer.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

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

# Using regex to replace the footer section
c = re.sub(r'footer=\{[\s\S]*?\}\s*>\s*<div className="flex flex-col', new_footer + '\n      >\n        <div className="flex flex-col', c)

with open('src/components/admin/locations/CreateLocationDrawer.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Done Regex Footer')
