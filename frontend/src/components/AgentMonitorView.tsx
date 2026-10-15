import React from 'react';
import { 
  Cpu, 
  CheckCircle2, 
  Terminal, 
  FileSearch, 
  Code, 
  Bug, 
  ShieldAlert, 
  FileText,
  Network
} from 'lucide-react';
import { Task } from '../types';

interface AgentMonitorViewProps {
  tasks: Task[];
}

export const AgentMonitorView: React.FC<AgentMonitorViewProps> = ({ tasks }) => {
  const agents = [
    {
      role: 'orchestrator',
      name: 'Master Orchestrator',
      desc: 'Central DAG coordination, state transitions, concurrency limits, and retry supervision.',
      icon: Network,
      color: 'text-blue-400',
      border: 'border-blue-500/30'
    },
    {
      role: 'product_analyst',
      name: 'Product Analyst',
      desc: 'Translates natural-language intent into structured PRD, user stories, and testable criteria.',
      icon: FileSearch,
      color: 'text-violet-400',
      border: 'border-violet-500/30'
    },
    {
      role: 'software_architect',
      name: 'Software Architect',
      desc: 'Designs modular boundaries, data schemas, API contracts, and task dependency graphs.',
      icon: Cpu,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30'
    },
    {
      role: 'implementation_agent',
      name: 'Implementation Agent',
      desc: 'Synthesizes clean, strongly-typed code within the sandboxed project repository.',
      icon: Code,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30'
    },
    {
      role: 'testing_agent',
      name: 'Testing Agent',
      desc: 'Generates automated test suites (pytest/unittest) based directly on acceptance criteria.',
      icon: CheckCircle2,
      color: 'text-green-400',
      border: 'border-green-500/30'
    },
    {
      role: 'debugging_agent',
      name: 'Debugging Agent',
      desc: 'Analyzes test failures and error traces to generate bounded, regression-free code patches.',
      icon: Bug,
      color: 'text-amber-400',
      border: 'border-amber-500/30'
    },
    {
      role: 'independent_reviewer',
      name: 'Independent Reviewer',
      desc: 'Evaluates git diffs, security vulnerabilities, code cleanliness, and criteria compliance.',
      icon: ShieldAlert,
      color: 'text-rose-400',
      border: 'border-rose-500/30'
    },
    {
      role: 'documentation_agent',
      name: 'Documentation Agent',
      desc: 'Maintains system guides, architecture diagrams, installation instructions, and release notes.',
      icon: FileText,
      color: 'text-indigo-400',
      border: 'border-indigo-500/30'
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Cpu className="text-blue-400" size={22} />
          <span>Specialized Multi-Agent Engineering Registry</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configurable role capabilities working in coordination over structured project state and observable verification evidence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map((ag) => {
          const Icon = ag.icon;
          const assignedTasks = tasks.filter(t => t.assigned_role === ag.role);
          const activeTask = assignedTasks.find(t => t.state === 'RUNNING' || t.state === 'VERIFYING');

          return (
            <div key={ag.role} className={`forge-card p-5 flex flex-col justify-between border ${ag.border}`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={ag.color} size={18} />
                    <span className="text-xs font-bold text-slate-200">{ag.name}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    activeTask ? 'bg-blue-500/20 text-blue-400 animate-pulse' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {activeTask ? 'ACTIVE' : 'IDLE'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                  {ag.desc}
                </p>
              </div>

              <div className="border-t border-slate-800/80 pt-3 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Assigned Tasks:</span>
                  <span className="text-slate-200 font-bold">{assignedTasks.length}</span>
                </div>
                {activeTask && (
                  <div className="text-blue-400 truncate">
                    &gt; {activeTask.title}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
