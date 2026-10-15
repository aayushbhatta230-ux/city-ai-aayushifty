import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Sun, 
  Moon, 
  Cpu, 
  Flame, 
  Zap, 
  DollarSign, 
  Users, 
  Car, 
  Heart, 
  ChevronRight, 
  ChevronLeft,
  Building2,
  Navigation,
  Eye,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Layers,
  Compass,
  Sliders,
  ShieldCheck,
  Radio,
  FileCode2,
  X
} from 'lucide-react';
import { 
  CityMetrics, 
  AgentObservation, 
  SimulationEvent, 
  ScenarioType, 
  CameraMode, 
  OverlayMode, 
  Building,
  Vehicle,
  AgentCharacter,
  UnitedProject
} from '../../simulation/types';

interface CityHUDProps {
  metrics: CityMetrics;
  agents: AgentObservation[];
  agentCharacters: AgentCharacter[];
  activeUnitedProject: UnitedProject | null;
  events: SimulationEvent[];
  simulationTime: number;
  simulationSpeed: number;
  activeScenario: ScenarioType;
  cameraMode: CameraMode;
  overlayMode: OverlayMode;
  selectedBuilding: Building | null;
  selectedVehicle?: Vehicle | null;
  selectedAgent: AgentCharacter | null;
  onSetSpeed: (speed: number) => void;
  onSelectScenario: (scen: ScenarioType) => void;
  onSelectCameraMode: (mode: CameraMode) => void;
  onSelectOverlayMode: (overlay: OverlayMode) => void;
  onTriggerIntervention: (actionName: string) => void;
  onDeployUnitedProject: (title: string, desc: string) => void;
  onAssignTaskToAgent: (agentId: string, task: string) => void;
  onCloseAgentModal: () => void;
  onEnterAgentFPV: (agentId: string) => void;
}

export const CityHUD: React.FC<CityHUDProps> = ({
  metrics,
  agents,
  agentCharacters,
  activeUnitedProject,
  events,
  simulationTime,
  simulationSpeed,
  activeScenario,
  cameraMode,
  overlayMode,
  selectedBuilding,
  selectedVehicle,
  selectedAgent,
  onSetSpeed,
  onSelectScenario,
  onSelectCameraMode,
  onSelectOverlayMode,
  onTriggerIntervention,
  onDeployUnitedProject,
  onAssignTaskToAgent,
  onCloseAgentModal,
  onEnterAgentFPV
}) => {
  const [showAgentsPanel, setShowAgentsPanel] = useState(true);
  const [showInspector, setShowInspector] = useState(true);
  const [unitedTaskInput, setUnitedTaskInput] = useState('');
  const [individualTaskInput, setIndividualTaskInput] = useState('');

  // Format decimal hour to 12-hour AM/PM string
  const hours = Math.floor(simulationTime);
  const minutes = Math.floor((simulationTime - hours) * 60);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const timeString = `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;

  const handleUnitedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitedTaskInput.trim()) return;
    onDeployUnitedProject(unitedTaskInput.trim(), 'Autonomous collective multi-agent engineering task.');
    setUnitedTaskInput('');
  };

  const handleIndividualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!individualTaskInput.trim() || !selectedAgent) return;
    onAssignTaskToAgent(selectedAgent.id, individualTaskInput.trim());
    setIndividualTaskInput('');
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden">
      {/* 1. TOP HEADER: Telemetry & United Mission Directive Bar */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Clock Controls */}
          <div className="bg-[#0A0E17]/95 backdrop-blur border border-slate-800 rounded-xl px-4 py-2.5 shadow-2xl pointer-events-auto flex items-center gap-5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center font-bold text-white shadow-lg">
                F
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100 tracking-wider flex items-center gap-2">
                  <span>FORGE AI METROPOLIS</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                    LIVING AGENTS
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">AUTONOMOUS MULTI-AGENT FACTORY</div>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-800" />

            {/* Time controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-900 px-3 py-1.5 rounded border border-slate-800 text-slate-200">
                {simulationTime >= 6 && simulationTime <= 18 ? (
                  <Sun size={14} className="text-amber-400" />
                ) : (
                  <Moon size={14} className="text-blue-400" />
                )}
                <span className="font-bold">{timeString}</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => onSetSpeed(simulationSpeed === 0 ? 1 : 0)}
                  className={`p-1.5 rounded transition ${simulationSpeed === 0 ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'}`}
                  title="Pause / Resume"
                >
                  {simulationSpeed === 0 ? <Play size={13} /> : <Pause size={13} />}
                </button>
                <button
                  onClick={() => onSetSpeed(1)}
                  className={`px-2 py-1 rounded transition text-[11px] font-bold ${simulationSpeed === 1 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  1x
                </button>
                <button
                  onClick={() => onSetSpeed(2)}
                  className={`px-2 py-1 rounded transition text-[11px] font-bold ${simulationSpeed === 2 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  2x
                </button>
              </div>
            </div>
          </div>

          {/* Real Live Metrics Bar */}
          <div className="bg-[#0A0E17]/95 backdrop-blur border border-slate-800 rounded-xl px-5 py-2.5 shadow-2xl pointer-events-auto flex items-center gap-6 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-blue-400" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Population</div>
                <div className="font-bold text-slate-100">{metrics.population.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Zap size={15} className="text-yellow-400" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Grid Status</div>
                <div className="font-bold text-slate-100">{metrics.powerGridStatus}%</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign size={15} className="text-emerald-400" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Treasury</div>
                <div className="font-bold text-slate-100">${(metrics.treasury / 1000).toFixed(0)}k</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Heart size={15} className="text-rose-400" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Satisfaction</div>
                <div className="font-bold text-slate-100">{metrics.citizenSatisfaction}%</div>
              </div>
            </div>
          </div>

          {/* Camera Modes & FPV */}
          <div className="bg-[#0A0E17]/95 backdrop-blur border border-slate-800 rounded-xl px-4 py-2.5 shadow-2xl pointer-events-auto flex items-center gap-2">
            <button
              onClick={() => onSelectCameraMode('ORBIT')}
              className={`px-2.5 py-1.5 rounded text-xs font-mono transition ${cameraMode === 'ORBIT' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Drone Orbit
            </button>
            <button
              onClick={() => onSelectCameraMode('TOP_DOWN')}
              className={`px-2.5 py-1.5 rounded text-xs font-mono transition ${cameraMode === 'TOP_DOWN' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              2D Plan
            </button>
            <button
              onClick={() => onSelectCameraMode('FPV')}
              className={`px-2.5 py-1.5 rounded text-xs font-mono transition flex items-center gap-1.5 ${cameraMode === 'FPV' ? 'bg-amber-600 text-white font-bold' : 'text-amber-400 hover:text-white'}`}
            >
              <Eye size={13} />
              <span>FPV Mode</span>
            </button>
            <button
              onClick={() => onSelectCameraMode('SHOULDER_CAM')}
              className={`px-2.5 py-1.5 rounded text-xs font-mono transition ${cameraMode === 'SHOULDER_CAM' ? 'bg-cyan-600 text-white font-bold' : 'text-cyan-400 hover:text-white'}`}
            >
              Shoulder Cam
            </button>
          </div>
        </div>

        {/* 2. United Mission Directive Input Bar */}
        <div className="bg-[#0B0F19]/95 backdrop-blur border border-blue-500/30 rounded-xl px-4 py-3 shadow-2xl pointer-events-auto flex items-center justify-between gap-4">
          <form onSubmit={handleUnitedSubmit} className="flex-1 flex items-center gap-3">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase font-mono flex-shrink-0">
              <Sparkles size={16} className="text-amber-400 animate-pulse" />
              <span>United Mission:</span>
            </div>
            <input
              type="text"
              value={unitedTaskInput}
              onChange={(e) => setUnitedTaskInput(e.target.value)}
              placeholder="Assign a collective mission to all AI agents (e.g., 'Build authenticated REST API with SQLite and Docker')..."
              className="flex-1 bg-[#06080E] border border-slate-700/80 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-blue-600/30 flex-shrink-0"
            >
              <Send size={13} />
              <span>Deploy United Task</span>
            </button>
          </form>

          {/* Quick Mission Templates */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-slate-400 border-l border-slate-800 pl-4">
            <span className="text-slate-500">Quick:</span>
            <button
              onClick={() => onDeployUnitedProject('FastAPI Token Auth API', 'Implement JWT auth and middleware')}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-300"
            >
              + REST API
            </button>
            <button
              onClick={() => onDeployUnitedProject('Automated Pytest Suite', 'Write unit & integration tests')}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-300"
            >
              + Regression
            </button>
            <button
              onClick={() => onDeployUnitedProject('Security Hardening', 'Audit sandbox jail and sanitize secrets')}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 text-slate-300"
            >
              + Security
            </button>
          </div>
        </div>

        {/* Active United Project Progress Banner */}
        {activeUnitedProject && (
          <div className="bg-[#080D1A]/95 backdrop-blur border border-blue-500/40 rounded-xl p-3 shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-slate-100">UNITED MISSION: {activeUnitedProject.title}</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px]">
                  {activeUnitedProject.status}
                </span>
              </div>
              <span className="text-slate-400">{activeUnitedProject.progress.toFixed(0)}% Complete</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
              <div 
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full transition-all duration-300"
                style={{ width: `${activeUnitedProject.progress}%` }}
              />
            </div>

            {/* Stage Logs */}
            <div className="text-[11px] font-mono text-slate-300 flex items-center justify-between">
              <span className="text-slate-400 truncate max-w-xl">
                &gt; {activeUnitedProject.stageLogs[activeUnitedProject.stageLogs.length - 1]?.message}
              </span>
              {activeUnitedProject.deliverables.length > 0 && (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  <span>{activeUnitedProject.deliverables.length} Deliverables Ready</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* FPV Mode Active Banner */}
        {cameraMode === 'FPV' && selectedAgent && (
          <div className="bg-amber-950/80 border border-amber-500/50 rounded-xl px-4 py-2 flex items-center justify-between text-xs font-mono text-amber-200 pointer-events-auto">
            <div className="flex items-center gap-2">
              <Eye size={15} className="text-amber-400 animate-pulse" />
              <span>FIRST-PERSON VIEW: Walking as <strong>{selectedAgent.name}</strong> ({selectedAgent.title})</span>
              <span className="text-slate-400">| Use W/A/S/D or Arrow Keys to navigate streets</span>
            </div>
            <button
              onClick={() => onSelectCameraMode('ORBIT')}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-bold"
            >
              Exit FPV
            </button>
          </div>
        )}
      </div>

      {/* 2. MIDDLE ROW: Left AI Agent Council Drawer & Right Urban Inspector */}
      <div className="flex-1 flex justify-between p-4 pointer-events-none overflow-hidden">
        {/* Left: The 8 Living AI Agent Characters List */}
        <div className={`transition-all duration-300 pointer-events-auto ${showAgentsPanel ? 'w-84' : 'w-10'}`}>
          <div className="bg-[#0B0F19]/95 backdrop-blur border border-slate-800 rounded-xl p-4 shadow-2xl h-[460px] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-blue-400" />
                <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  The 8 AI Agents ({agentCharacters.length})
                </span>
              </div>
              <button onClick={() => setShowAgentsPanel(!showAgentsPanel)} className="text-slate-500 hover:text-white">
                <ChevronLeft size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {agentCharacters.map((ag) => {
                const isSelected = selectedAgent?.id === ag.id;
                return (
                  <div 
                    key={ag.id}
                    onClick={() => onEnterAgentFPV(ag.id)}
                    className={`p-2.5 rounded-lg border transition cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-950/60 border-blue-500 shadow-md' 
                        : 'bg-[#080B12] border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ag.color }} />
                        <span className="text-xs font-bold text-slate-200">{ag.name}</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {ag.status}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 line-clamp-1">
                      {ag.title}
                    </div>

                    <div className="text-[10px] text-blue-400 font-mono mt-1 line-clamp-1">
                      &gt; {ag.currentTask}
                    </div>

                    <div className="text-[9px] text-slate-500 font-mono mt-1 flex justify-between border-t border-slate-900 pt-1">
                      <span>HQ: {ag.department.split('(')[0]}</span>
                      <span className="text-amber-400">Double-Click to Direct</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Urban Inspector (Building / Vehicle) */}
        <div className={`transition-all duration-300 pointer-events-auto ${showInspector ? 'w-80' : 'w-10'}`}>
          <div className="bg-[#0B0F19]/95 backdrop-blur border border-slate-800 rounded-xl p-4 shadow-2xl h-[460px] flex flex-col justify-between">
            <div className="overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-emerald-400" />
                  <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    Urban Inspector
                  </span>
                </div>
                <button onClick={() => setShowInspector(!showInspector)} className="text-slate-500 hover:text-white">
                  <ChevronRight size={16} />
                </button>
              </div>

              {selectedBuilding ? (
                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{selectedBuilding.name}</h3>
                    {selectedBuilding.signName && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                        {selectedBuilding.signName}
                      </span>
                    )}
                    <div className="text-[11px] text-slate-400 mt-1">
                      Department: <span className="text-slate-200">{selectedBuilding.department || selectedBuilding.zone}</span>
                    </div>
                  </div>

                  <div className="bg-[#080B12] p-3 rounded-lg border border-slate-800 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Height & Floors:</span>
                      <span className="text-slate-200">{selectedBuilding.height}m ({selectedBuilding.floors} Floors)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Workers Assigned:</span>
                      <span className="text-slate-200">{selectedBuilding.workers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Power Grid:</span>
                      <span className={selectedBuilding.powerSupplied ? 'text-emerald-400' : 'text-red-400'}>
                        {selectedBuilding.powerDemand} kW (Nominal)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Water Network:</span>
                      <span className="text-cyan-400">{selectedBuilding.waterDemand} L/hr</span>
                    </div>
                  </div>
                </div>
              ) : selectedVehicle ? (
                <div className="space-y-3 font-mono text-xs">
                  <h3 className="text-sm font-bold text-slate-100">{selectedVehicle.type} ({selectedVehicle.id})</h3>
                  <div className="bg-[#080B12] p-3 rounded-lg border border-slate-800 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Speed:</span>
                      <span className="text-slate-200">{selectedVehicle.speed.toFixed(0)} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Route:</span>
                      <span className="text-slate-200 truncate">{selectedVehicle.destinationName}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-500 text-xs space-y-2">
                  <p>Click any landmark building, vehicle, or double-click an AI Agent in 3D to direct them.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. DOUBLE-CLICK AGENT MISSION MODAL */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto p-4">
          <div className="bg-[#0B0F19] border border-blue-500/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden font-mono text-xs">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#080D1A]">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-lg"
                  style={{ backgroundColor: selectedAgent.color }}
                >
                  {selectedAgent.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>{selectedAgent.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40">
                      LVL {selectedAgent.level}
                    </span>
                  </h2>
                  <div className="text-[11px] text-slate-400">{selectedAgent.title}</div>
                </div>
              </div>

              <button 
                onClick={onCloseAgentModal}
                className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Assigned Department:</div>
                <div className="text-slate-200 bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-800">
                  {selectedAgent.department}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Live Thought Stream:</div>
                <div className="text-blue-400 bg-blue-950/20 px-3 py-2 rounded-lg border border-blue-900/40">
                  &gt; {selectedAgent.currentThought}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Specialized Skills:</div>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    {selectedAgent.skills.map(sk => (
                      <div key={sk} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{sk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Active Toolchain:</div>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    {selectedAgent.toolsInUse.map(tool => (
                      <div key={tool} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <span>{tool}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Direct Task Assignment Form */}
              <form onSubmit={handleIndividualSubmit} className="pt-2 border-t border-slate-800 space-y-2">
                <div className="text-[10px] text-slate-400 font-bold uppercase">
                  Assign Direct Task Directive:
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={individualTaskInput}
                    onChange={(e) => setIndividualTaskInput(e.target.value)}
                    placeholder={`Direct ${selectedAgent.name.split(' ')[0]} to execute a task...`}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Send size={12} />
                    <span>Dispatch</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-[#080D1A] flex justify-between items-center">
              <button
                onClick={() => {
                  onCloseAgentModal();
                  onEnterAgentFPV(selectedAgent.id);
                  onSelectCameraMode('FPV');
                }}
                className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition"
              >
                <Eye size={14} />
                <span>Enter Agent FPV</span>
              </button>

              <button
                onClick={() => {
                  onCloseAgentModal();
                  onEnterAgentFPV(selectedAgent.id);
                  onSelectCameraMode('SHOULDER_CAM');
                }}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition"
              >
                <Navigation size={14} />
                <span>Over-Shoulder Cam</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. BOTTOM BAR: Live Autonomous Event Stream */}
      <div className="p-4 pointer-events-auto">
        <div className="bg-[#0A0E17]/95 backdrop-blur border border-slate-800 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400 flex-shrink-0">
            <Radio size={14} className="text-emerald-400 animate-pulse" />
            <span className="font-bold text-slate-200 uppercase">Live Autonomous Activity:</span>
          </div>

          <div className="flex-1 overflow-x-auto whitespace-nowrap space-x-6 text-slate-300">
            {events.slice(0, 4).map((ev) => (
              <span key={ev.id} className="inline-flex items-center gap-1.5">
                <span className="text-slate-500">[{ev.timestamp}]</span>
                <span className="text-blue-400 font-bold">[{ev.category}]:</span>
                <span>{ev.message}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
