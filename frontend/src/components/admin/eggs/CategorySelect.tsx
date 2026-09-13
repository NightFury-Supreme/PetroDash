"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Loader2, Trash2, Edit2 } from "lucide-react";

type Category = {
  id: string;
  name: string;
  eggCount: number;
};

export function CategorySelect({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  
  const [newCat, setNewCat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const loadCategories = () => {
    const token = localStorage.getItem('auth_token');
    fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs/categories`, { 
      headers: token ? { Authorization: `Bearer ${token}` } : {} 
    })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCategories(d); })
      .catch(() => {});
  };

  useEffect(() => {
    loadCategories();
    const clickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setEditingId(null);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const handleCreate = async () => {
    if (!newCat.trim()) return;
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newCat.trim() })
      });
      if (res.ok) {
        const cat = await res.json();
        setCategories([...categories, cat]);
        onChange(cat.id);
        setNewCat('');
        setIsCreating(false);
        setIsOpen(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create');
      }
    } catch {
      setError('Failed to create category');
    }
    setLoading(false);
  };

  const handleRename = async (id: string) => {
    if (!editVal.trim()) return;
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editVal.trim() })
      });
      if (res.ok) {
        const updatedCat = await res.json();
        setCategories(categories.map(c => c.id === id ? { ...c, name: updatedCat.name } : c));
        setEditingId(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to rename');
      }
    } catch {
      setError('Failed to rename');
    }
    setLoading(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCategories(categories.filter(c => c.id !== id));
        if (value === id) onChange('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete');
      }
    } catch {
      setError('Failed to delete');
    }
    setLoading(false);
  };

  const buttonClass = isOpen
    ? 'bg-[#222] border-[#222] text-[#ddd]' 
    : 'bg-[#101010] border-[#2A2A2A] text-[#D4D4D4] hover:border-[#FF5722]/50 hover:text-[#ddd]';

  const selectedCat = categories.find(c => c.id === value);

  return (
    <div className="relative" ref={ref}>
      <div 
        onClick={() => !isCreating && !editingId && setIsOpen(!isOpen)}
        className={`w-full rounded-md border px-4 py-2.5 text-sm cursor-pointer flex justify-between items-center transition-colors outline-none ${buttonClass}`}
      >
        {selectedCat ? selectedCat.name : <span className="text-[#858585]">Select a category...</span>}
        <ChevronDown size={14} className={`text-[#858585] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 top-[calc(100%+6px)] left-0 w-full border border-[#2A2A2A] rounded-md bg-[#151515] p-1.5 shadow-xl max-h-64 overflow-y-auto">
          {!isCreating && !editingId ? (
            <div className="flex flex-col gap-1">
              {categories.map(c => (
                <div 
                  key={c.id}
                  onClick={() => { onChange(c.id); setIsOpen(false); }}
                  className="flex items-center justify-between w-full px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-[#FF5722]/10 hover:text-[#FF5722] text-[#D4D4D4] cursor-pointer group"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="truncate">{c.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-white/[0.04] text-[#888]">{c.eggCount} eggs</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingId(c.id); setEditVal(c.name); }}
                      className="text-[#888] hover:text-white transition-colors"
                      title="Rename"
                    >
                      <Edit2 size={13} />
                    </button>
                    {c.eggCount === 0 && (
                      <button 
                        onClick={(e) => handleDelete(e, c.id)}
                        className="text-[#888] hover:text-[#ef4444] transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="px-2 py-2 text-xs text-[#858585] italic">No categories found</div>
              )}
              <div className="h-[1px] bg-[#2A2A2A] my-1" />
              <div 
                onClick={() => { setIsCreating(true); setError(null); }}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-[#FF5722]/10 hover:text-[#FF5722] text-[#FF5722] cursor-pointer"
              >
                <Plus size={14} /> Create new category
              </div>
            </div>
          ) : isCreating ? (
            <div className="p-2 bg-[#151515] flex flex-col gap-2">
              <input 
                autoFocus
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="New category name"
                className="w-full h-8 rounded-md border border-[#2A2A2A] bg-[#101010] px-2 text-sm text-[#D4D4D4] outline-none focus:border-[#FF5722]/50 transition-colors"
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleCreate}
                  disabled={loading || !newCat.trim()}
                  className="flex-1 h-7 bg-[#FF5722] text-white text-xs font-medium rounded-md flex justify-center items-center hover:bg-[#F4511E] transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                </button>
                <button 
                  onClick={() => { setIsCreating(false); setNewCat(''); }}
                  disabled={loading}
                  className="flex-1 h-7 bg-[#222] border border-[#2A2A2A] text-[#D4D4D4] text-xs font-medium rounded-md hover:bg-[#2A2A2A] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="p-2 bg-[#151515] flex flex-col gap-2">
              <div className="text-xs text-[#858585] px-1">Rename category</div>
              <input 
                autoFocus
                value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRename(editingId!)}
                placeholder="Category name"
                className="w-full h-8 rounded-md border border-[#2A2A2A] bg-[#101010] px-2 text-sm text-[#D4D4D4] outline-none focus:border-[#FF5722]/50 transition-colors"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => handleRename(editingId!)}
                  disabled={loading || !editVal.trim()}
                  className="flex-1 h-7 bg-[#FF5722] text-white text-xs font-medium rounded-md flex justify-center items-center hover:bg-[#F4511E] transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                </button>
                <button 
                  onClick={() => { setEditingId(null); setEditVal(''); }}
                  disabled={loading}
                  className="flex-1 h-7 bg-[#222] border border-[#2A2A2A] text-[#D4D4D4] text-xs font-medium rounded-md hover:bg-[#2A2A2A] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
