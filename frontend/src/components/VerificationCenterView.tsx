import React from 'react';
import { ShieldCheck, CheckCircle2, XCircle, FileCode, AlertOctagon, Terminal } from 'lucide-react';
import { Task } from '../types';

interface VerificationCenterViewProps {
  tasks: Task[];
}

export const VerificationCenterView: React.FC<VerificationCenterViewProps> = ({ tasks }) => {
  const verifiedTasks = tasks.filter(t => t.verification);
  const passedCount = verifiedTasks.filter(t => t.verification?.exit_code === 0).length;
  const failedCount = verifiedTasks.filter(t => (t.verification?.exit_code || 0) !== 0).length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="text-emerald-400" size={22} />
            <span>Verification & Evidence Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            "Verification over confidence: require observable evidence of successful execution before declaring completion."
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded">
            <CheckCircle2 size={14} />
            <span>{passedCount} Verified Passed</span>
          </div>
          <div className="flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1.5 rounded">
            <XCircle size={14} />
            <span>{failedCount} Failed Verification</span>
          </div>
        </div>
      </div>

      {verifiedTasks.length === 0 ? (
        <div className="forge-card p-12 text-center text-slate-500 text-sm">
          No verification suites have executed yet. Run an autonomous pipeline to generate test runs and collect observable evidence.
        </div>
      ) : (
        <div className="space-y-4">
          {verifiedTasks.map((task) => {
            const v = task.verification!;
            const isSuccess = v.exit_code === 0;

            return (
              <div key={task.id} className="forge-card p-5 space-y-4 bg-[#0A0E17]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-500">{task.id}</span>
                      <h3 className="text-sm font-bold text-slate-100">{task.title}</h3>
                      <span className={`forge-badge ${isSuccess ? 'forge-badge-completed' : 'forge-badge-failed'}`}>
                        Exit Code {v.exit_code}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-1">
                      Assigned Agent: <span className="text-blue-400">{task.assigned_role}</span> &bull; 
                      Passed: <span className="text-emerald-400 font-bold">{v.passed_tests}</span> &bull; 
                      Failed: <span className="text-red-400 font-bold">{v.failed_tests}</span>
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-500 font-mono">
                    {new Date(v.verified_at).toLocaleString()}
                  </div>
                </div>

                {/* Test Command & Output Snippet */}
                <div className="bg-[#05070B] p-3 rounded border border-slate-800 text-xs font-mono space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Terminal size={14} className="text-blue-400" />
                    <span>Command: <code className="text-slate-200">{v.test_suite}</code></span>
                  </div>
                  <pre className="text-slate-300 p-2.5 bg-[#0B0F17] rounded border border-slate-800/80 overflow-x-auto max-h-56">
                    {v.output_snippet || "No stdout/stderr logged"}
                  </pre>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
