import React, { useEffect, useRef, useState } from 'react';
import { CitySimulationEngine } from '../simulation/engine';
import { CityGovernmentCouncil } from '../simulation/agents';
import { CityScene } from './city3d/CityScene';
import { CityHUD } from './city3d/CityHUD';
import { 
  Building, 
  Vehicle,
  AgentCharacter,
  CameraMode, 
  OverlayMode, 
  ScenarioType, 
  AgentObservation,
  SimulationEvent,
  CityMetrics
} from '../simulation/types';

export const CitySimulationView: React.FC = () => {
  const engineRef = useRef<CitySimulationEngine>(new CitySimulationEngine());
  const councilRef = useRef<CityGovernmentCouncil>(new CityGovernmentCouncil());

  // Reactive UI state synchronized with simulation engine
  const [metrics, setMetrics] = useState<CityMetrics>(engineRef.current.metrics);
  const [simulationTime, setSimulationTime] = useState<number>(engineRef.current.simulationTime);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(engineRef.current.simulationSpeed);
  const [activeScenario, setActiveScenario] = useState<ScenarioType>(engineRef.current.activeScenario);
  const [cameraMode, setCameraMode] = useState<CameraMode>('ORBIT');
  const [overlayMode, setOverlayMode] = useState<OverlayMode>('NONE');

  const [selectedEntity, setSelectedEntity] = useState<{ type: 'BUILDING' | 'VEHICLE' | 'AGENT'; id: string } | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentCharacter | null>(null);

  const [agentCharacters, setAgentCharacters] = useState<AgentCharacter[]>(engineRef.current.agentCharacters);
  const [activeUnitedProject, setActiveUnitedProject] = useState(engineRef.current.activeUnitedProject);

  const [agents, setAgents] = useState<AgentObservation[]>(
    Array.from(councilRef.current.agents.values())
  );
  const [events, setEvents] = useState<SimulationEvent[]>(councilRef.current.events);

  // Main 60fps Animation & Authoritative Simulation Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let tickAccumulator = 0;

    const loop = (currentTime: number) => {
      animId = requestAnimationFrame(loop);
      const delta = (currentTime - lastTime) / 1000.0;
      lastTime = currentTime;

      const engine = engineRef.current;
      const council = councilRef.current;

      // Authoritative Simulation Tick
      engine.tick(delta);
      tickAccumulator += delta;

      // Agent Council evaluates every 1.5 seconds
      if (tickAccumulator >= 1.5 / Math.max(1, engine.simulationSpeed)) {
        tickAccumulator = 0;
        council.evaluateAndAct(engine);
        setAgents(Array.from(council.agents.values()));
        setEvents([...council.events]);
      }

      // Sync UI metrics periodically
      if (engine.tickCount % 5 === 0) {
        setMetrics({ ...engine.metrics });
        setSimulationTime(engine.simulationTime);
        setAgentCharacters([...engine.agentCharacters]);
        setActiveUnitedProject(engine.activeUnitedProject ? { ...engine.activeUnitedProject } : null);

        // Keep entity telemetry up to date if selected
        if (selectedEntity?.type === 'VEHICLE') {
          const v = engine.vehicles.find(item => item.id === selectedEntity.id);
          if (v) setSelectedVehicle({ ...v });
        } else if (selectedEntity?.type === 'AGENT') {
          const ag = engine.agentCharacters.find(item => item.id === selectedEntity.id);
          if (ag) setSelectedAgent({ ...ag });
        }
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [selectedEntity]);

  // Update selected entity inspector (Building, Vehicle, or Agent)
  useEffect(() => {
    const engine = engineRef.current;
    if (selectedEntity?.type === 'BUILDING') {
      const b = engine.buildings.find(item => item.id === selectedEntity.id) || null;
      setSelectedBuilding(b);
      setSelectedVehicle(null);
      setSelectedAgent(null);
    } else if (selectedEntity?.type === 'VEHICLE') {
      const v = engine.vehicles.find(item => item.id === selectedEntity.id) || null;
      setSelectedVehicle(v);
      setSelectedBuilding(null);
      setSelectedAgent(null);
    } else if (selectedEntity?.type === 'AGENT') {
      const ag = engine.agentCharacters.find(item => item.id === selectedEntity.id) || null;
      setSelectedAgent(ag);
      setSelectedBuilding(null);
      setSelectedVehicle(null);
    } else {
      setSelectedBuilding(null);
      setSelectedVehicle(null);
      setSelectedAgent(null);
    }
  }, [selectedEntity]);

  // Handlers
  const handleSetSpeed = (speed: number) => {
    engineRef.current.simulationSpeed = speed;
    setSimulationSpeed(speed);
  };

  const handleSelectScenario = (scen: ScenarioType) => {
    engineRef.current.loadScenario(scen);
    setActiveScenario(scen);
    setMetrics({ ...engineRef.current.metrics });
    setAgentCharacters([...engineRef.current.agentCharacters]);
  };

  const handleSelectEntity = (type: 'BUILDING' | 'VEHICLE' | 'AGENT', id: string) => {
    setSelectedEntity({ type, id });
  };

  const handleDoubleClickAgent = (agentId: string) => {
    const ag = engineRef.current.agentCharacters.find(a => a.id === agentId);
    if (ag) {
      setSelectedEntity({ type: 'AGENT', id: agentId });
      setSelectedAgent({ ...ag });
    }
  };

  const handleEnterAgentFPV = (agentId: string) => {
    const ag = engineRef.current.agentCharacters.find(a => a.id === agentId);
    if (ag) {
      setSelectedEntity({ type: 'AGENT', id: agentId });
      setSelectedAgent({ ...ag });
    }
  };

  const handleDeployUnitedProject = (title: string, desc: string) => {
    const proj = engineRef.current.deployUnitedProject(title, desc);
    setActiveUnitedProject({ ...proj });
    setMetrics({ ...engineRef.current.metrics });
  };

  const handleAssignTaskToAgent = (agentId: string, task: string) => {
    engineRef.current.assignTaskToAgent(agentId, task);
    setAgentCharacters([...engineRef.current.agentCharacters]);
    const ag = engineRef.current.agentCharacters.find(a => a.id === agentId);
    if (ag) setSelectedAgent({ ...ag });
  };

  const handleMoveAgent = (agentId: string, dx: number, dz: number) => {
    const ag = engineRef.current.agentCharacters.find(a => a.id === agentId);
    if (ag) {
      ag.x += dx;
      ag.z += dz;
      ag.targetX = ag.x;
      ag.targetZ = ag.z;
    }
  };

  const handleTriggerIntervention = (action: string) => {
    if (selectedBuilding) {
      selectedBuilding.powerSupplied = true;
      selectedBuilding.waterSupplied = true;
      selectedBuilding.wasteAccumulated = 0;
      selectedBuilding.onFire = false;
      engineRef.current.recalculateMetrics();
      setMetrics({ ...engineRef.current.metrics });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-65px)] overflow-hidden bg-[#06080E]">
      {/* 3D WebGL Three.js City World */}
      <CityScene
        buildings={engineRef.current.buildings}
        roads={engineRef.current.roads}
        intersections={engineRef.current.intersections}
        vehicles={engineRef.current.vehicles}
        pedestrians={engineRef.current.pedestrians}
        agentCharacters={agentCharacters}
        incidents={engineRef.current.incidents}
        simulationTime={simulationTime}
        cameraMode={cameraMode}
        overlayMode={overlayMode}
        selectedEntityId={selectedEntity?.id || null}
        selectedAgentId={selectedAgent?.id || null}
        onSelectEntity={handleSelectEntity}
        onDoubleClickAgent={handleDoubleClickAgent}
        onMoveAgent={handleMoveAgent}
      />

      {/* Overseer Control Center & HUD */}
      <CityHUD
        metrics={metrics}
        agents={agents}
        agentCharacters={agentCharacters}
        activeUnitedProject={activeUnitedProject}
        events={events}
        simulationTime={simulationTime}
        simulationSpeed={simulationSpeed}
        activeScenario={activeScenario}
        cameraMode={cameraMode}
        overlayMode={overlayMode}
        selectedBuilding={selectedBuilding}
        selectedVehicle={selectedVehicle}
        selectedAgent={selectedAgent}
        onSetSpeed={handleSetSpeed}
        onSelectScenario={handleSelectScenario}
        onSelectCameraMode={setCameraMode}
        onSelectOverlayMode={setOverlayMode}
        onTriggerIntervention={handleTriggerIntervention}
        onDeployUnitedProject={handleDeployUnitedProject}
        onAssignTaskToAgent={handleAssignTaskToAgent}
        onCloseAgentModal={() => setSelectedAgent(null)}
        onEnterAgentFPV={handleEnterAgentFPV}
      />
    </div>
  );
};
