c = open('src/components/admin/locations/CreateLocationDrawer.tsx', 'r', encoding='utf-8').read()
target = c[c.find('{plans.map'):c.find('</div>\n              )}')]

new_block = """{plans.map((p: any) => {
                  const id = String(p._id || p.id);
                  const name = p.name || id;
                  const price = p.pricePerMonth !== undefined ? Number(p.pricePerMonth) : 0;
                  const currency = p.currency || 'USD';
                  const selected = (form.allowedPlans || []).includes(id) || (form.allowedPlans || []).includes(name);
                  
                  return (
                    <button 
                      type="button"
                      key={id} 
                      onClick={() => {
                        if (selected) {
                          setForm(f => ({ ...f, allowedPlans: f.allowedPlans.filter(v => v !== id && v !== name) }));
                        } else {
                          setForm(f => ({ ...f, allowedPlans: [...f.allowedPlans, id] }));
                        }
                      }}
                      className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${selected ? 'bg-[#FF5722]/[0.06]' : 'hover:bg-white/[0.015]'}`}
                    >
                      <div className="min-w-0 pr-4">
                        <span className={`block text-sm font-medium ${selected ? 'text-white/90' : 'text-white/70'}`}>
                          {name}
                        </span>
                        <span className="block mt-0.5 font-mono text-[11px] text-white/35">
                          {id}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-6 shrink-0">
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.13em] text-white/20 text-right">Price</p>
                          <p className={`text-sm font-semibold tracking-tight mt-0.5 ${selected ? 'text-white/90' : 'text-white/60'}`}>
                            {price > 0 ? price.toFixed(2) : "0.00"} <span className="text-[10px] font-normal text-white/25">{currency}</span>
                          </p>
                        </div>
                        
                        <div className={`flex items-center justify-center w-5 h-5 rounded-full border transition-colors shrink-0 ${
                          selected ? 'bg-[#FF5722] border-[#FF5722] text-black' : 'border-white/15 text-transparent'
                        }`}>
                          <Check size={12} strokeWidth={3} />
                        </div>
                      </div>
                    </button>
                  );
                })}"""
c = c.replace(target, new_block)
open('src/components/admin/locations/CreateLocationDrawer.tsx', 'w', encoding='utf-8').write(c)

c2 = open('src/components/admin/locations/EditLocationDrawer.tsx', 'r', encoding='utf-8').read()
target2 = c2[c2.find('{plans.map'):c2.find('</div>\n              )}')]
c2 = c2.replace(target2, new_block)
open('src/components/admin/locations/EditLocationDrawer.tsx', 'w', encoding='utf-8').write(c2)
