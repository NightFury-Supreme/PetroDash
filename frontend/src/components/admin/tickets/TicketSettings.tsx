import React, { useMemo, useState, useEffect } from "react";
import { Plus, Save, Settings, X, Loader2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/ToastProvider";

interface Category {
  id: string;
  name: string;
  ticketCount: number;
}

interface TicketSettingsProps {
  onClose: () => void;
}

export default function TicketSettings({ onClose }: TicketSettingsProps) {
  const { showError, showSuccess } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
      const [saving, setSaving] = useState(false);
  
  const load = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/admin/tickets/settings/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let d: any = {};
      try { d = await r.json(); } catch {}
      
      const u = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/admin/tickets/settings/categories/usage`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let ud: any = {};
      try { ud = await u.json(); } catch {}

      if (r.ok && Array.isArray(d?.categories)) {
        const usageData = ud?.usage || {};
        const loadedCategories: Category[] = d.categories.map((c: string) => ({
          id: c, 
          name: c,
          ticketCount: usageData[c] || 0,
        }));
        setCategories(loadedCategories);
      }
    } catch {
      showError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const normalizedNewCategory = newCategory.trim();
  const canAdd = normalizedNewCategory.length > 0 && normalizedNewCategory.length <= 32;

  const categoryExists = useMemo(() => {
    return categories.some(
      (category) => category.name.toLowerCase() === normalizedNewCategory.toLowerCase()
    );
  }, [categories, normalizedNewCategory]);

  const addCategory = () => {
    if (!canAdd || categoryExists) return;

    setCategories((current) => [
      ...current,
      {
        id: normalizedNewCategory,
        name: normalizedNewCategory,
        ticketCount: 0,
      },
    ]);

    setNewCategory("");
          };

  const removeCategory = (id: string) => {
    const category = categories.find((item) => item.id === id);
    if (!category) return;
    if (category.ticketCount > 0) return;

    setCategories((current) => current.filter((item) => item.id !== id));
          };

  const handleSave = async () => {
    setSaving(true);
            
    try {
      const token = localStorage.getItem("auth_token");
      const categoryNames = categories.map((c) => c.name);

      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/admin/tickets/settings/categories`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categories: categoryNames }),
      });
      
      let d: any = {};
      try { d = await r.json(); } catch {}
      
      if (r.ok) {
        showSuccess("Settings saved successfully.");
        await load();
      } else {
                showError(d?.error || "Failed to save");
        if (Array.isArray(d?.inUse) && d.inUse.length) {
          showError(`${d.error}: ${d.inUse.join(", ")}`);
        }
        
      }
    } catch {
            showError("An unexpected error occurred while saving.");
      
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Ticket Settings"
      subtitle="Manage ticket categories"
      icon={<Settings className="text-[#D4D4D4]" size={22} />}
      footer={
        <div className="flex items-center justify-end w-full">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className={`flex w-full sm:w-auto min-w-[145px] items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[11px] font-semibold transition-all ${saving || loading ? "bg-[#161616] text-[#888] cursor-not-allowed" : "bg-[#FF5722] text-white hover:bg-[#FF6B32] hover:-translate-y-[1px]"}`}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>
              {saving ? "Saving..." : "Save Changes"}
            </span>
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-col min-h-0 space-y-8 animate-in fade-in duration-300 pointer-events-none">
          <section>
            <div className="h-5 w-32 rounded bg-white/[0.05] animate-pulse" />
            <div className="mt-2 h-4 w-64 rounded bg-white/[0.03] animate-pulse" />
            
            <div className="mt-5 flex gap-3">
              <div className="h-[42px] flex-1 rounded-lg bg-white/[0.04] animate-pulse" />
              <div className="h-[42px] w-[88px] rounded-lg bg-white/[0.04] animate-pulse" />
            </div>
          </section>

          <section>
            <div className="h-5 w-40 rounded bg-white/[0.05] animate-pulse" />
            <div className="mt-2 mb-6 h-4 w-72 rounded bg-white/[0.03] animate-pulse" />
            
            <div>
              <div className="hidden gap-4 grid-cols-[30px_1.5fr_1fr_70px] border-b border-white/[0.06] px-2 pb-3 md:grid">
                <div className="h-2.5 w-4 rounded bg-white/[0.03] animate-pulse" />
                <div className="h-2.5 w-24 rounded bg-white/[0.03] animate-pulse" />
                <div className="h-2.5 w-16 rounded bg-white/[0.03] animate-pulse" />
                <div className="h-2.5 w-12 rounded bg-white/[0.03] animate-pulse ml-auto" />
              </div>
              
              <div className="divide-y divide-white/[0.06]">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="grid grid-cols-1 gap-4 px-2 py-5 md:grid-cols-[30px_1.5fr_1fr_70px] md:items-center">
                    <div className="h-3 w-4 rounded bg-white/[0.05] animate-pulse hidden md:block" />
                    <div className="h-3.5 w-28 rounded bg-white/[0.05] animate-pulse" />
                    <div className="h-3.5 w-8 rounded bg-white/[0.05] animate-pulse" />
                    <div className="h-8 w-8 rounded-lg bg-white/[0.03] animate-pulse md:ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="flex flex-col min-h-0 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          

          {/* ADD CATEGORY */}
          <section>
            <h2 className="text-base font-semibold text-white">Add Category</h2>
            <p className="mt-0.5 text-sm text-[#888]">Create a category for a new type of support request.</p>
            
            <div className="mt-5 flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newCategory}
                  maxLength={32}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCategory();
                    }
                  }}
                  placeholder="e.g. Technical"
                  className="w-full rounded-lg border border-[#222] bg-[#161616] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60"
                />
                {newCategory && (
                  <button
                    onClick={() => setNewCategory("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                disabled={!canAdd || categoryExists}
                onClick={addCategory}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#FF5722] hover:bg-[#F4511E] px-5 py-2.5 text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={15} />
                <span>Add</span>
              </button>
            </div>
            {categoryExists && <p className="mt-1.5 text-xs text-red-400">This category already exists.</p>}
            {!categoryExists && normalizedNewCategory.length > 0 && normalizedNewCategory.length < 3 && (
              <p className="mt-1.5 text-xs text-[#888]">Use at least 3 characters.</p>
            )}
          </section>

          {/* CATEGORIES LIST */}
          <section>
            <div className="flex items-center justify-between mb-0.5">
              <h2 className="text-base font-semibold text-white">Current Categories</h2>
            </div>
            <p className="mt-0.5 text-sm text-[#888] mb-6">Organize incoming support tickets by request type.</p>

            <div>
              {/* TABLE HEADER */}
              <div className="hidden gap-4 grid-cols-[30px_1.5fr_1fr_70px] border-b border-white/[0.06] px-2 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
                <span>#</span>
                <span>Category Name</span>
                <span>Tickets</span>
                <span className="text-right">Action</span>
              </div>

              {/* TABLE LIST */}
              <div className="divide-y divide-white/[0.06]">
                {categories.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#666]">No categories defined.</div>
                ) : (
                  categories.map((category, index) => {
                    const canRemove = category.ticketCount === 0;

                    return (
                      <div
                        key={category.id}
                        className="group grid grid-cols-1 gap-4 px-2 py-5 transition hover:bg-white/[0.015] md:grid-cols-[30px_1.5fr_1fr_70px] md:items-center"
                      >
                        <div className="min-w-0 hidden md:block">
                          <span className="block font-mono text-[10px] text-white/35">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Category Name</p>
                          <div className="flex items-center gap-2">
                            <span className="truncate text-xs font-medium text-white/70">
                              {category.name}
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Tickets</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white/70">
                              {category.ticketCount}
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0 md:text-right">
                          <button
                            disabled={!canRemove}
                            onClick={() => removeCategory(category.id)}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus:outline-none disabled:cursor-not-allowed ${
                              canRemove
                                ? "text-[#888] hover:bg-red-500/10 hover:text-red-400 focus:ring-2 focus:ring-red-400/30"
                                : "text-white/20 opacity-50"
                            }`}
                            title={canRemove ? `Remove ${category.name}` : "Category is being used"}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>

        </div>
      )}
    </Drawer>
  );
}
