import React, { useState } from 'react';
import { 
  GitCommit, 
  RotateCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileCode, 
  ShieldCheck, 
  ChevronRight,
  GitBranch,
  Terminal
} from 'lucide-react';
import { Project, Task } from '../types';

interface WorkspaceViewProps {
  project: Project | null;
  tasks: Task[];
  onRetryTask: (taskId: string) => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  project,
  tasks,
  onRetryTask
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  if (!project) {
    return (
      <div className="p-12 text-center text-slate-500">
        Please select or create a project on the Dashboard first.
      </div>
    );
  }

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || tasks[0] || null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Workspace Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">{project.name}</h1>
            <span className={`forge-badge forge-badge-${project.status.toLowerCase()}`}>
              {project.status}
            </span>
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-3">
            <span>Workspace: {project.workspace_dir}</span>
            <span>&bull;</span>
            <span>Tasks: {tasks.length} Total</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
            Git Branch: <span className="text-blue-400 font-bold">master</span> (Clean isolated sandbox)
          </div>
        </div>
      </div>

      {/* Task DAG & Details Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Dependency Pipeline List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Task Dependency Graph</span>
            <span className="font-mono text-slate-500">{tasks.length} nodes</span>
          </div>

          {tasks.length === 0 ? (
            <div className="forge-card p-6 text-center text-slate-500 text-xs">
              No tasks assembled yet. Run the autonomous pipeline to generate the DAG.
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task, idx) => {
                const isSelected = selectedTask?.id === task.id;
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`forge-card p-3.5 cursor-pointer transition flex items-start justify-between ${
                      isSelected ? 'border-blue-500/60 bg-blue-950/20' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500">#{idx + 1}</span>
                        <span className="text-xs font-bold text-slate-200">{task.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Role: <span className="text-blue-400">{task.assigned_role}</span>
                      </div>
                      {task.dependencies.length > 0 && (
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <GitBranch size={10} />
                          <span>Depends on: {task.dependencies.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className={`forge-badge forge-badge-${task.state.toLowerCase()}`}>
                        {task.state}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Task Inspector */}
        <div className="lg:col-span-2 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Task Execution Inspector & Verification Evidence
          </div>

          {selectedTask ? (
            <div className="forge-card p-6 space-y-5 bg-[#0C111C]">
              <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-100">{selectedTask.title}</h3>
                    <span className={`forge-badge forge-badge-${selectedTask.state.toLowerCase()}`}>
                      {selectedTask.state}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-1">
                    ID: {selectedTask.id} &bull; Retries: {selectedTask.retry_count} / {selectedTask.max_retries}
                  </div>
                </div>

                {selectedTask.state === 'FAILED' && (
                  <button
                    onClick={() => onRetryTask(selectedTask.id)}
                    className="flex items-center gap-1.5 bg-amber-600/20 text-amber-300 hover:bg-amber-600 hover:text-white border border-amber-500/40 px-3 py-1 rounded text-xs font-semibold transition"
                  >
                    <RotateCw size={13} />
                    <span>Retry Task</span>
                  </button>
                )}
              </div>

              {/* Objective */}
              <div>
                <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Objective</div>
                <div className="bg-[#121824] p-3 rounded border border-slate-800 text-xs text-slate-200 font-mono leading-relaxed">
                  {selectedTask.objective}
                </div>
              </div>

              {/* Acceptance Criteria */}
              <div>
                <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Acceptance Criteria</div>
                <ul className="space-y-1.5">
                  {selectedTask.acceptance_criteria.map((c, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <ShieldCheck size={14} className="text-emerald-400 flex-shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Observable Verification Evidence */}
              <div>
                <div className="text-xs font-semibold uppercase text-slate-400 mb-1 flex items-center justify-between">
                  <span>Observable Verification Evidence</span>
                  {selectedTask.verification && (
                    <span className="font-mono text-xs text-emerald-400">
                      Exit Code: {selectedTask.verification.exit_code} &bull; Passed: {selectedTask.verification.passed_tests}
                    </span>
                  )}
                </div>

                {selectedTask.verification ? (
                  <div className="bg-[#070A10] p-4 rounded border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Command: <code className="text-blue-400">{selectedTask.verification.test_suite}</code></span>
                      <span className="text-slate-500">Verified at: {new Date(selectedTask.verification.verified_at).toLocaleTimeString()}</span>
                    </div>

                    <pre className="text-xs text-slate-300 font-mono overflow-x-auto max-h-48 p-2 bg-[#0B0F17] rounded border border-slate-800/60">
                      {selectedTask.verification.output_snippet || "No logs available"}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-[#0B0F17] p-4 rounded border border-slate-800 text-slate-500 text-xs text-center">
                    Verification evidence will be captured automatically once task enters VERIFYING state.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="forge-card p-12 text-center text-slate-500 text-sm">
              Select a task from the graph to inspect its parameters, acceptance criteria, and verification artifacts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
