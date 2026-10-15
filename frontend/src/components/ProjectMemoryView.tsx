import React, { useState } from 'react';
import { BookOpen, Search, Tag, FileText, Bug, Layers } from 'lucide-react';
import { ProjectMemoryEntry } from '../types';

interface ProjectMemoryViewProps {
  memoryEntries: ProjectMemoryEntry[];
}

export const ProjectMemoryView: React.FC<ProjectMemoryViewProps> = ({ memoryEntries }) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filtered = memoryEntries.filter(e => {
    const matchesCat = selectedCategory === 'ALL' || e.category === selectedCategory;
    const matchesQuery = !query || 
      e.title.toLowerCase().includes(query.toLowerCase()) || 
      e.content.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="text-blue-400" size={22} />
            <span>Persistent Project Memory & Knowledge Base</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            "Preserve architectural decisions, interfaces, constraints, and lessons learned across agent iterations."
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search ADRs and findings..."
              className="bg-[#121824] border border-slate-700 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-64"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <select
            className="bg-[#121824] border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="ADR">ADR</option>
            <option value="TECH_SPEC">Tech Spec</option>
            <option value="KNOWN_BUG">Known Bug</option>
            <option value="INTERFACE_CONTRACT">Interface Contract</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="forge-card p-12 text-center text-slate-500 text-sm">
          No project memory entries found. ADRs and technical learnings will populate as agents decompose and solve tasks.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((entry) => (
            <div key={entry.id} className="forge-card p-5 space-y-3 bg-[#0B0F19]">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    {entry.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100 mt-2">{entry.title}</h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {new Date(entry.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="text-xs text-slate-300 font-mono bg-[#05070B] p-3 rounded border border-slate-800 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {entry.content}
              </div>

              {entry.tags.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1">
                  <Tag size={12} className="text-slate-500" />
                  {entry.tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded font-mono">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
