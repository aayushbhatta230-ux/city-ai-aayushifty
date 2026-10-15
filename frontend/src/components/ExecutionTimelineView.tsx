import React from 'react';
import { Activity, CheckCircle, Clock, AlertTriangle, ShieldCheck, GitCommit } from 'lucide-react';
import { ForgeTelemetryEvent } from '../types';

interface ExecutionTimelineViewProps {
  events: ForgeTelemetryEvent[];
}

export const ExecutionTimelineView: React.FC<ExecutionTimelineViewProps> = ({ events }) => {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Activity className="text-violet-400" size={22} />
          <span>Execution Telemetry & Timeline</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Chronological record of planning, code generation, verification results, and repair cycles.
        </p>
      </div>

      <div className="forge-card p-6">
        {events.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No telemetry events recorded yet. Run a pipeline to stream live timeline events.
          </div>
        ) : (
          <div className="relative border-l border-slate-800 ml-4 space-y-6 py-2">
            {events.slice().reverse().map((ev, index) => {
              const state = ev.payload?.state || ev.payload?.step || 'EVENT';
              const isSuccess = state === 'COMPLETED' || state === 'SUCCESS';
              const isFailure = state === 'FAILED';
              const isRunning = state === 'RUNNING' || state === 'VERIFYING';

              return (
                <div key={ev.event_id || index} className="relative pl-6">
                  {/* Dot */}
                  <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-[#0B0F17] flex items-center justify-center ${
                    isSuccess ? 'border-emerald-500 text-emerald-400' :
                    isFailure ? 'border-red-500 text-red-400' :
                    isRunning ? 'border-blue-500 text-blue-400' : 'border-slate-600 text-slate-400'
                  }`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">
                        {ev.payload?.title || ev.payload?.message || ev.topic}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        isSuccess ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        isFailure ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      }`}>
                        {state}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-3">
                      <span>Topic: {ev.topic}</span>
                      <span>&bull;</span>
                      <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    </div>

                    {ev.payload?.evidence && (
                      <div className="mt-2 bg-[#070A10] p-3 rounded border border-slate-800 text-[11px] font-mono text-slate-300">
                        <div>Test Suite: {ev.payload.evidence.test_suite}</div>
                        <div>Exit Code: {ev.payload.evidence.exit_code} &bull; Passed: {ev.payload.evidence.passed_tests} &bull; Failed: {ev.payload.evidence.failed_tests}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
