import React, { useState } from 'react';
import { 
  Rocket, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  ArrowRight, 
  Layers, 
  Play,
  Activity,
  FolderGit2
} from 'lucide-react';
import { Project, Task } from '../types';

interface DashboardViewProps {
  projects: Project[];
  tasks: Task[];
  selectedProject: Project | null;
  onSelectProject: (proj: Project) => void;
  onLaunchNewProject: (name: string, description: string, budget: number) => void;
  onStartPipeline: (projectId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  tasks,
  selectedProject,
  onSelectProject,
  onLaunchNewProject,
  onStartPipeline
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState(25);

  const completedTasks = tasks.filter(t => t.state === 'COMPLETED').length;
  const totalTasks = tasks.length;
  const passRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
  const totalSpend = projects.reduce((acc, p) => acc + (p.spent_usd || 0), 0);

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    onLaunchNewProject(name, description, budget);
    setName('');
    setDescription('');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="forge-card p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Projects</span>
            <Layers size={18} className="text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100 mt-2">{projects.length}</div>
          <div className="text-xs text-slate-500 mt-1">Autonomous repositories managed</div>
        </div>

        <div className="forge-card p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Tasks Verified</span>
            <CheckCircle size={18} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100 mt-2">
            {completedTasks} <span className="text-lg text-slate-500 font-normal">/ {totalTasks}</span>
          </div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp size={12} /> {passRate}% verification pass rate
          </div>
        </div>

        <div className="forge-card p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Platform Spend</span>
            <DollarSign size={18} className="text-violet-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100 mt-2">${totalSpend.toFixed(2)}</div>
          <div className="text-xs text-slate-500 mt-1">Across all model adapters</div>
        </div>

        <div className="forge-card p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Current Status</span>
            <Activity size={18} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {selectedProject ? selectedProject.status : 'STANDBY'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {selectedProject ? selectedProject.name : 'Select or create a project'}
          </div>
        </div>
      </div>

      {/* Main Grid: Factory Project Creator & Active Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Project Creator Form */}
        <div className="lg:col-span-2 forge-card p-6 bg-[#0E131F]/90">
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="text-blue-400" size={20} />
            <h2 className="text-lg font-bold text-slate-100">Commission New Autonomous Project</h2>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Provide a high-level software requirement. The factory Product Analyst will generate a formal specification, the Software Architect will assemble the task DAG, and the specialized agents will execute and verify the build.
          </p>

          <form onSubmit={handleLaunch} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Project Name</label>
              <input
                type="text"
                placeholder="e.g. EduPortal School Management"
                className="w-full bg-[#151C2C] border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Software Specification & Objectives
              </label>
              <textarea
                rows={4}
                placeholder="Describe features, domain models, authentication requirements, and constraints. (e.g. Build an interactive educational quiz platform with timed tests, score tracking, user profiles, and test verification suite.)"
                className="w-full bg-[#151C2C] border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-400">Budget Limit:</label>
                <div className="flex items-center gap-1 bg-[#151C2C] border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200">
                  <span>$</span>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    className="w-14 bg-transparent focus:outline-none text-slate-100"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                  />
                  <span className="text-slate-500">USD</span>
                </div>
              </div>

              <button
                type="submit"
                className="glow-btn flex items-center gap-2 text-sm"
              >
                <span>Initialize & Orchestrate</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>

        {/* Selected Project Quick Control */}
        <div className="forge-card p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">
              Selected Factory Project
            </div>
            {selectedProject ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-100">{selectedProject.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-3">{selectedProject.description}</p>
                </div>

                <div className="bg-[#0B0F17] p-3 rounded border border-slate-800 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="text-blue-400 font-bold">{selectedProject.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Budget Used:</span>
                    <span className="text-slate-300">
                      ${selectedProject.spent_usd?.toFixed(2) || '0.00'} / ${selectedProject.budget_limit_usd?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Workspace:</span>
                    <span className="text-slate-400 truncate max-w-[160px]">{selectedProject.workspace_dir}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-sm">
                No active project selected. Choose one from the list or commission a new build above.
              </div>
            )}
          </div>

          {selectedProject && (
            <div className="pt-6">
              <button
                onClick={() => onStartPipeline(selectedProject.id)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/30"
              >
                <Play size={16} />
                <span>Execute Autonomous Pipeline</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Projects Inventory Table */}
      <div className="forge-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderGit2 className="text-slate-400" size={18} />
            <h3 className="text-base font-bold text-slate-200">Active Repositories & Workspaces</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">{projects.length} Total</span>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No projects in factory registry yet. Create your first autonomous project above!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B0F17] text-slate-400 border-b border-slate-800 uppercase font-mono">
                <tr>
                  <th className="py-2.5 px-3">Project Name</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Spend</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {projects.map((p) => (
                  <tr 
                    key={p.id}
                    onClick={() => onSelectProject(p)}
                    className={`hover:bg-slate-800/30 cursor-pointer transition ${
                      selectedProject?.id === p.id ? 'bg-blue-900/10' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-medium text-slate-200">
                      <div>{p.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{p.id}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`forge-badge forge-badge-${p.status.toLowerCase()}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      ${p.spent_usd?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProject(p);
                        }}
                        className="text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        Select &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
