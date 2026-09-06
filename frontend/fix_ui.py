import re

with open('src/components/admin/locations/CreateLocationDrawer.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Remove headerExtra
c = re.sub(r'headerExtra=\{.*?\}\s*footer=\{', 'footer={', c, flags=re.DOTALL)

# 2. Add Horizontal Step Indicator inside the body
old_body_start = '<div className="px-1 pb-6">'
new_body_start = """<div className="flex flex-col min-h-[300px]">
          {/* Horizontal Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            {STEPS.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-medium z-10 transition-colors ${
                  idx === currentStepIndex
                    ? 'bg-[#FF5722] text-white'
                    : idx < currentStepIndex
                    ? 'bg-[#FF5722]/10 text-[#FF5722]'
                    : 'bg-white/[0.02] text-white/30 border border-white/[0.07]'
                }`}>
                  {idx < currentStepIndex ? <Check size={16} /> : (idx + 1)}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-4 transition-colors ${idx < currentStepIndex ? 'bg-[#FF5722]/50' : 'bg-white/[0.07]'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          
          <div className="flex-1 pb-8 min-w-0">"""

c = c.replace(old_body_start, new_body_start)

# We need to add one more </div> to close the <div className="flex-1 pb-8 min-w-0"> we just added.
# At the end of the file, we have:
#             )}
#           </div>
#         )}
#       </div>
#     </Drawer>

end_target = """        )}
      </div>
    </Drawer>"""

end_replace = """        )}
        </div>
      </div>
    </Drawer>"""
c = c.replace(end_target, end_replace)

with open('src/components/admin/locations/CreateLocationDrawer.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Done")
