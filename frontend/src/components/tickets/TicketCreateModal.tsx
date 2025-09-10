"use client";

import React from "react";

export default function TicketCreateModal({ open, categories, title, message, category, serverError, onChange, onClose, onCreate }:{
  open: boolean;
  categories: string[];
  title: string;
  message: string;
  category: string;
  serverError?: string|null;
  onChange: (p:{ title?: string; message?: string; category?: string; }) => void;
  onClose: () => void;
  onCreate: () => Promise<boolean>;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-[#181818] border border-[#303030] rounded-xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">New Ticket</h3>
          <button onClick={onClose} className="text-[#AAAAAA] hover:text-white"><i className="fas fa-times" /></button>
        </div>
        {serverError && <div className="text-sm text-red-400 mb-2">{serverError}</div>}
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-[#AAAAAA] mb-1">Title</label>
            <input value={title} onChange={e=>onChange({ title: e.target.value })} placeholder="Brief summary" className="w-full px-3 py-2 rounded-lg bg-[#202020] border border-[#303030] text-white" />
          </div>
          <div>
            <label className="block text-sm text-[#AAAAAA] mb-1">Category</label>
            <select value={category} onChange={e=>onChange({ category: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[#202020] border border-[#303030] text-white">
              {categories.map(c => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#AAAAAA] mb-1">Message</label>
            <textarea value={message} onChange={e=>onChange({ message: e.target.value })} placeholder="Describe your issue" rows={6} className="w-full px-3 py-2 rounded-lg bg-[#202020] border border-[#303030] text-white"></textarea>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 bg-[#303030] hover:bg-[#404040] text-white rounded-lg">Cancel</button>
            <button onClick={async ()=>{ const ok = await onCreate(); if (ok) onClose(); }} className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg font-semibold">Create</button>
          </div>
        </div>
      </div>
    </div>
  );
}


