import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/ToastProvider";

import { useModal } from "@/components/Modal";
import { ChevronDown, Check, Plus, Loader2 } from "lucide-react";

export function PlansTab({ plans, allPlans, userId, onRefresh }: any) {
  const [newPlanId, setNewPlanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modal = useModal();
  const { showSuccess, showError } = useToast();
  const [activeActions, setActiveActions] = useState<Record<string, { type: 'add' | 'remove' | 'removeAll', status: 'loading' | 'done' }>>({});

  const setActionState = (planId: string, type: 'add' | 'remove' | 'removeAll', status: 'loading' | 'done' | null) => {
    setActiveActions(prev => {
      if (status === null) {
        const next = { ...prev };
        delete next[planId];
        return next;
      }
      return { ...prev, [planId]: { type, status } };
    });
  };
  
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addPlan = async () => {
    if (!newPlanId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/users/${userId}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: newPlanId, months: 1 })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to add plan');
      showSuccess('The plan has been successfully added to the user.');
      setNewPlanId('');
      onRefresh();
    } catch (e: any) {
      showError(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const removePlan = async (planId: string) => {
    const confirmed = await modal.confirm({ title: 'Remove Plan', body: 'Are you sure you want to remove all instances of this plan from the user?' });
    if (!confirmed) return;
    setActionState(planId, 'removeAll', 'loading');
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/users/${userId}/plans/${planId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) throw new Error('Failed to remove plan');
      onRefresh();
      setActionState(planId, 'removeAll', 'done');
      setTimeout(() => setActionState(planId, 'removeAll', null), 2000);
    } catch (e: any) {
      setActionState(planId, 'removeAll', null);
      showError(e.message);
    }
  };

  const quickAddPlan = async (pid: string) => {
    setActionState(pid, 'add', 'loading');
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/users/${userId}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: pid, months: 1 })
      });
      onRefresh();
      setActionState(pid, 'add', 'done');
      setTimeout(() => setActionState(pid, 'add', null), 2000);
    } catch (e: any) {
      setActionState(pid, 'add', null);
      showError(e.message || 'Failed to add');
    }
  };

  const removePlanInstance = async (planId: string, instanceId: string) => {
    setActionState(planId, 'remove', 'loading');
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/users/${userId}/plans/instance/${instanceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      onRefresh();
      setActionState(planId, 'remove', 'done');
      setTimeout(() => setActionState(planId, 'remove', null), 2000);
    } catch (e: any) {
      setActionState(planId, 'remove', null);
      showError(e.message);
    }
  };

  const groupedPlans = Object.values(
    plans.reduce((acc: any, p: any) => {
      const pId = p.planId?._id || p._id; // fallback
      if (!acc[pId]) {
        acc[pId] = {
          planId: pId,
          name: p.planId?.name || 'Unknown Plan',
          instances: []
        };
      }
      acc[pId].instances.push(p);
      return acc;
    }, {})
  );

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">Active Plans</h3>
            <p className="mt-2 text-sm text-white/35">Manage subscription plans assigned to this user.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`h-[42px] min-w-[200px] flex items-center justify-between gap-[7px] px-[11px] border rounded-md text-[11px] transition-colors
                  ${dropdownOpen ? 'bg-[#222] border-[#222] text-[#ddd]' : 'bg-[#1A1A1A] border-transparent text-[#858585] hover:bg-[#222] hover:text-[#ddd]'}
                `}
              >
                <span className={newPlanId ? "text-[#ddd]" : "text-[#858585]"}>
                  {newPlanId ? allPlans.find((p: any) => p._id === newPlanId)?.name : "Select a plan to add"}
                </span>
                <ChevronDown size={12} className={newPlanId ? "text-[#ddd]" : "text-[#858585]"} />
              </button>

              {dropdownOpen && (
                <div className="absolute z-50 top-[calc(100%+8px)] right-0 w-[240px] border border-[#222] rounded-md bg-[#151515] p-2 shadow-xl max-h-[300px] overflow-y-auto">
                  <div className="px-2 pb-2 pt-1">
                    <span className="text-[#666] text-[8px] font-semibold uppercase tracking-[0.7px]">Available Plans</span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    {allPlans.map((p: any) => (
                      <button
                        key={p._id}
                        onClick={() => {
                          setNewPlanId(p._id);
                          setDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-2 py-2 rounded-md text-[11px] transition-colors
                          ${newPlanId === p._id ? 'text-[#ff5722]' : 'text-[#888] hover:bg-[#222] hover:text-[#ddd]'}
                        `}
                      >
                        <span className="truncate">{p.name} - ${p.pricePerMonth}/mo</span>
                        {newPlanId === p._id && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={addPlan} disabled={loading || !newPlanId} className="flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-lg bg-white/10 px-4 text-sm font-medium text-white transition-all hover:bg-white/20 disabled:opacity-50">
              <Plus size={16} /> Add Plan
            </button>
          </div>
        </div>

        {groupedPlans.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
            <p className="text-sm text-white/50">No plans assigned.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {groupedPlans.map((g: any) => (
              <div key={g.planId} className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium text-white">{g.name}</p>
                  <p className="text-xs text-white/50 font-mono mt-0.5">{g.planId}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 h-[34px]">
                    <button 
                      onClick={() => removePlanInstance(g.planId, g.instances[g.instances.length - 1]._id)} 
                      disabled={activeActions[g.planId]?.status === 'loading'}
                      className="text-white/50 hover:text-white px-2 py-1.5 text-lg leading-none transition-colors disabled:opacity-50 flex items-center justify-center w-6 h-full"
                    >
                      {activeActions[g.planId]?.type === 'remove' ? (
                        activeActions[g.planId].status === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} className="text-emerald-400" strokeWidth={3} />
                      ) : '-'}
                    </button>
                    <span className="text-white text-sm w-4 text-center">{g.instances.length}</span>
                    <button 
                      onClick={() => quickAddPlan(g.planId)} 
                      disabled={activeActions[g.planId]?.status === 'loading'}
                      className="text-white/50 hover:text-white px-2 py-1.5 text-lg leading-none transition-colors disabled:opacity-50 flex items-center justify-center w-6 h-full"
                    >
                      {activeActions[g.planId]?.type === 'add' ? (
                        activeActions[g.planId].status === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} className="text-emerald-400" strokeWidth={3} />
                      ) : '+'}
                    </button>
                  </div>

                  <button 
                    onClick={() => removePlan(g.planId)} 
                    disabled={activeActions[g.planId]?.status === 'loading'}
                    className="flex items-center justify-center min-w-[80px] gap-1.5 h-[34px] rounded-lg bg-red-500/10 px-3 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                  >
                    {activeActions[g.planId]?.type === 'removeAll' ? (
                      activeActions[g.planId].status === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} className="text-red-400" strokeWidth={3} />
                    ) : null}
                    {activeActions[g.planId]?.type === 'removeAll' && activeActions[g.planId].status === 'done' ? 'Removed' : 'Remove All'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
