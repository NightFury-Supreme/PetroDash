"use client";

export default function AdminTicketsFilters({ q, status, categories, catFilter, onQ, onStatus, onCat, onRefresh }:{
  q: string;
  status: string;
  categories: string[];
  catFilter: string;
  onQ: (v: string)=>void;
  onStatus: (v: string)=>void;
  onCat: (v: string)=>void;
  onRefresh: ()=>void;
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-2 items-center">
      <input value={q} onChange={e=>onQ(e.target.value)} placeholder="Quick filter (title, category, or ID)" className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-white" />
      <select value={status} onChange={e=>onStatus(e.target.value)} className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-white">
        <option value="">All Status</option>
        <option value="open">Open</option>
        <option value="pending">Pending</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>
      <select value={catFilter} onChange={e=>onCat(e.target.value)} className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-white">
        <option value="">All Categories</option>
        {categories.map(c => (<option key={c} value={c}>{c}</option>))}
      </select>
      <button onClick={onRefresh} className="px-4 py-2 bg-[var(--surface)] hover:bg-[var(--hover)] text-white rounded-lg border border-[var(--border)] transition-colors">Apply</button>
    </div>
  );
}


