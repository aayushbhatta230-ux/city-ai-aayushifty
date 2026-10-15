import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  FastForward, 
  Sun, 
  Moon, 
  Compass, 
  Layers, 
  Cpu, 
  Radio, 
  Flame, 
  AlertTriangle, 
  Zap, 
  Droplet, 
  DollarSign, 
  Users, 
  Car, 
  Heart, 
  ChevronRight, 
  ChevronLeft,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { 
  CityMetrics, 
  AgentObservation, 
  SimulationEvent, 
  ScenarioType, 
  CameraMode, 
  OverlayMode, 
  Building,
  Vehicle
} from '../../simulation/types';

interface CityHUDProps {
  metrics: CityMetrics;
  agents: AgentObservation[];
  events: SimulationEvent[];
  simulationTime: number;
  simulationSpeed: number;
  activeScenario: ScenarioType;
  cameraMode: CameraMode;
  overlayMode: OverlayMode;
  selectedBuilding: Building | null;
  onSetSpeed: (speed: number) => void;
  onSelectScenario: (scen: ScenarioType) => void;
  onSelectCameraMode: (mode: CameraMode) => void;
  onSelectOverlayMode: (overlay: OverlayMode) => void;
  onTriggerIntervention: (actionName: string) => void;
}

export const CityHUD: React.FC<CityHUDProps> = ({
  metrics,
  agents,
  events,
  simulationTime,
  simulationSpeed,
  activeScenario,
  cameraMode,
  overlayMode,
  selectedBuilding,
  onSetSpeed,
  onSelectScenario,
  onSelectCameraMode,
  onSelectOverlayMode,
  onTriggerIntervention
}) => {
  const [showAgentsPanel, setShowAgentsPanel] = useState(true);
  const [showInspector, setShowInspector] = useState(true);

  // Format decimal hour to 12-hour AM/PM string
  const hours = Math.floor(simulationTime);
  const minutes = Math.floor((simulationTime - hours) * 60);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const timeString = `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden">
      {/* Top Header: Simulation Telemetry & KPI Ribbon */}
      <div className="p-4 flex items-center justify-between gap-4">
        {/* Brand & Time Control */}
        <div className="bg-[#0A0E17]/95 backdrop-blur border border-slate-800 rounded-xl px-4 py-2.5 shadow-2xl pointer-events-auto flex items-center gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center font-bold text-white shadow-lg">
              C
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100 tracking-wider flex items-center gap-2">
                <span>FORGE AI CITY</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                  AUTONOMOUS
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">LIVING SIMULATION STATE</div>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          {/* Time & Speed controls */}
          <div className="flex items-center gap-3">
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
              <button
                onClick={() => onSetSpeed(5)}
                className={`px-2 py-1 rounded transition text-[11px] font-bold ${simulationSpeed === 5 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                5x
              </button>
            </div>
          </div>
        </div>

        {/* Real Live City KPIs */}
        <div className="bg-[#0A0E17]/95 backdrop-blur border border-slate-800 rounded-xl px-5 py-2.5 shadow-2xl pointer-events-auto flex items-center gap-6 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-blue-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Population</div>
              <div className="font-bold text-slate-100">{metrics.population.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Car size={15} className={metrics.trafficCongestion > 25 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'} />
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Traffic Bottleneck</div>
              <div className={`font-bold ${metrics.trafficCongestion > 25 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {metrics.trafficCongestion}%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Zap size={15} className={metrics.powerGridStatus < 100 ? 'text-red-400' : 'text-yellow-400'} />
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Power Grid</div>
              <div className="font-bold text-slate-100">{metrics.powerGridStatus}% ({metrics.powerDemand}MW)</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Droplet size={15} className="text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Water Network</div>
              <div className="font-bold text-slate-100">{metrics.waterGridStatus}%</div>
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

          {metrics.activeIncidentsCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse font-bold">
              <Flame size={14} />
              <span>{metrics.activeIncidentsCount} INCIDENT</span>
            </div>
          )}
        </div>

        {/* Scenario & View Selectors */}
        <div className="bg-[#0A0E17]/95 backdrop-blur border border-slate-800 rounded-xl px-4 py-2.5 shadow-2xl pointer-events-auto flex items-center gap-3">
          {/* Scenario dropdown */}
          <select
            value={activeScenario}
            onChange={(e) => onSelectScenario(e.target.value as ScenarioType)}
            className="bg-[#121824] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            aria-label="Active City Scenario"
          >
            <option value="BALANCED_METROPOLIS">Scenario: Balanced Metropolis</option>
            <option value="RUSH_HOUR_GRIDLOCK">Scenario: Rush-Hour Gridlock</option>
            <option value="POWER_GRID_FAILURE">Scenario: Power Grid Failure</option>
            <option value="INDUSTRIAL_FIRE_EMERGENCY">Scenario: Industrial Fire Alert</option>
            <option value="TECH_BOOM_EXPANSION">Scenario: Tech Boom Expansion</option>
          </select>

          {/* Overlays dropdown */}
          <select
            value={overlayMode}
            onChange={(e) => onSelectOverlayMode(e.target.value as OverlayMode)}
            className="bg-[#121824] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-blue-400 focus:outline-none focus:border-blue-500 font-mono"
            aria-label="Visual Overlays Mode"
          >
            <option value="NONE">Overlay: Standard 3D</option>
            <option value="TRAFFIC">Overlay: Traffic Heatmap</option>
            <option value="POWER">Overlay: Power Grid</option>
            <option value="ZONING">Overlay: District Zoning</option>
          </select>

          {/* Camera Mode */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800">
            <button
              onClick={() => onSelectCameraMode('ORBIT')}
              className={`px-2 py-1 rounded text-[11px] font-mono transition ${cameraMode === 'ORBIT' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Orbit
            </button>
            <button
              onClick={() => onSelectCameraMode('TOP_DOWN')}
              className={`px-2 py-1 rounded text-[11px] font-mono transition ${cameraMode === 'TOP_DOWN' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              2D Plan
            </button>
            <button
              onClick={() => onSelectCameraMode('STREET_LEVEL')}
              className={`px-2 py-1 rounded text-[11px] font-mono transition ${cameraMode === 'STREET_LEVEL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Street
            </button>
          </div>
        </div>
      </div>

      {/* Middle Row: Left Agent Government Drawer & Right Building Inspector */}
      <div className="flex-1 flex justify-between p-4 pointer-events-none overflow-hidden">
        {/* Left: AI City Government Council */}
        <div className={`transition-all duration-300 pointer-events-auto ${showAgentsPanel ? 'w-80' : 'w-10'}`}>
          <div className="bg-[#0B0F19]/95 backdrop-blur border border-slate-800 rounded-xl p-4 shadow-2xl h-[460px] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-blue-400" />
                <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  AI City Government ({agents.length})
                </span>
              </div>
              <button 
                onClick={() => setShowAgentsPanel(!showAgentsPanel)} 
                className="text-slate-500 hover:text-white"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {agents.map((ag) => {
                const isIntervening = ag.status === 'INTERVENING';
                return (
                  <div key={ag.agentRole} className="bg-[#080B12] p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{ag.name}</span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isIntervening ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse' :
                        ag.status === 'OPTIMIZING' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {ag.status}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono line-clamp-1">
                      Observed: <span className="text-slate-300">{ag.metricObserved}</span>
                    </div>
                    <div className="text-[10px] text-blue-400 font-mono line-clamp-2">
                      &gt; {ag.latestInsight}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Selected Building / Entity Inspector */}
        <div className={`transition-all duration-300 pointer-events-auto ${showInspector ? 'w-80' : 'w-10'}`}>
          <div className="bg-[#0B0F19]/95 backdrop-blur border border-slate-800 rounded-xl p-4 shadow-2xl h-[460px] flex flex-col justify-between">
            <div>
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
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Zone: <span className="text-blue-400 font-bold">{selectedBuilding.zone}</span> &bull; Type: {selectedBuilding.type}
                    </div>
                  </div>

                  <div className="bg-[#080B12] p-3 rounded-lg border border-slate-800 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Occupancy:</span>
                      <span className="text-slate-200">{selectedBuilding.residents} / {selectedBuilding.maxResidents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Workers:</span>
                      <span className="text-slate-200">{selectedBuilding.workers} / {selectedBuilding.maxWorkers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Power Demand:</span>
                      <span className={selectedBuilding.powerSupplied ? 'text-emerald-400' : 'text-red-400'}>
                        {selectedBuilding.powerDemand} kW ({selectedBuilding.powerSupplied ? 'Active' : 'Blackout'})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Water Demand:</span>
                      <span className="text-cyan-400">{selectedBuilding.waterDemand} L/hr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Solid Waste:</span>
                      <span className={selectedBuilding.wasteAccumulated > 50 ? 'text-amber-400' : 'text-slate-300'}>
                        {selectedBuilding.wasteAccumulated.toFixed(0)}%
                      </span>
                    </div>
                    {selectedBuilding.onFire && (
                      <div className="text-red-400 font-bold animate-pulse pt-1">
                        [!] ACTIVE STRUCTURAL FIRE INCIDENT
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-500 text-xs">
                  Click on any building or infrastructure in the 3D city to inspect live utility demands, occupancy, and status.
                </div>
              )}
            </div>

            {selectedBuilding && (
              <div className="pt-2 border-t border-slate-800 flex gap-2">
                <button
                  onClick={() => onTriggerIntervention('DISPATCH_SERVICES')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded text-xs transition"
                >
                  Direct Municipal Priority
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Live Autonomous Event Feed */}
      <div className="p-4 pointer-events-auto">
        <div className="bg-[#0A0E17]/95 backdrop-blur border border-slate-800 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400 flex-shrink-0">
            <Radio size={14} className="text-emerald-400 animate-pulse" />
            <span className="font-bold text-slate-200 uppercase">Live Event Stream:</span>
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
