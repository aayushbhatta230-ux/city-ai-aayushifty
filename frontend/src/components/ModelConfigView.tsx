import React from 'react';
import { Settings, CheckCircle2, XCircle, RefreshCw, Layers, ShieldCheck, Zap } from 'lucide-react';

export const ModelConfigView: React.FC = () => {
  const providers = [
    {
      name: 'Deterministic Mock Engine',
      id: 'mock',
      type: 'Local / Offline',
      status: 'AVAILABLE',
      cost: '$0.00 / 1M tokens',
      fallbackIndex: 4,
      desc: 'Zero-cost high-fidelity deterministic engine for evaluations, offline runs, and automated CI.'
    },
    {
      name: 'Google Gemini 1.5 Pro / Flash',
      id: 'gemini',
      type: 'Cloud API',
      status: 'CONFIGURED',
      cost: '$0.35 in / $1.05 out',
      fallbackIndex: 2,
      desc: 'Large 1M+ context window adapter for repository-wide synthesis and architectural planning.'
    },
    {
      name: 'OpenAI GPT-4o & Compatible Endpoints',
      id: 'openai',
      type: 'Cloud API / vLLM',
      status: 'CONFIGURED',
      cost: '$2.50 in / $10.00 out',
      fallbackIndex: 1,
      desc: 'Industry standard reasoning adapter with fallback to compatible DeepSeek or Groq endpoints.'
    },
    {
      name: 'Local Ollama Runtime',
      id: 'ollama',
      type: 'Local Inference (http://localhost:11434)',
      status: 'AUTO-DISCOVER',
      cost: '$0.00 (Local Compute)',
      fallbackIndex: 3,
      desc: 'Private, on-premise execution adapter for air-gapped workstations and offline engineering.'
    }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Settings className="text-blue-400" size={22} />
          <span>Model Routing Engine & Provider Adapters</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          "Model independence: support multiple AI providers through replaceable adapters and automatic resilience fallback chains."
        </p>
      </div>

      <div className="forge-card p-6 space-y-6 bg-[#0B0F19]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-200">Configured Resilience Fallback Chain</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Primary provider requests gracefully cascade down this chain upon timeouts or rate limits.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-blue-400 bg-blue-950/40 px-3 py-1 rounded border border-blue-500/30">
            <Zap size={14} />
            <span>OpenAI &rarr; Gemini &rarr; Ollama &rarr; Mock Engine</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((p) => (
            <div key={p.id} className="forge-card p-5 space-y-3 bg-[#0E1422] border border-slate-800">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{p.name}</h3>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">{p.type}</div>
                </div>
                <span className="forge-badge forge-badge-completed text-[10px]">
                  {p.status}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {p.desc}
              </p>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Cost: <span className="text-slate-200">{p.cost}</span></span>
                <span>Priority: #{p.fallbackIndex}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
