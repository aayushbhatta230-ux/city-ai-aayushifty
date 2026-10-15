import React, { useEffect, useRef, useState } from 'react';
import { CitySimulationEngine } from '../simulation/engine';
import { CityGovernmentCouncil } from '../simulation/agents';
import { CityScene } from './city3d/CityScene';
import { CityHUD } from './city3d/CityHUD';
import { 
  Building, 
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

  const [selectedEntity, setSelectedEntity] = useState<{ type: 'BUILDING' | 'VEHICLE' | 'INCIDENT'; id: string } | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

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

      // Agent Council evaluates every 1.5 seconds (or accelerated by simulationSpeed)
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
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Update selected building inspector
  useEffect(() => {
    if (selectedEntity?.type === 'BUILDING') {
      const b = engineRef.current.buildings.find(item => item.id === selectedEntity.id) || null;
      setSelectedBuilding(b);
    } else {
      setSelectedBuilding(null);
    }
  }, [selectedEntity, metrics]);

  // Handlers
  const handleSetSpeed = (speed: number) => {
    engineRef.current.simulationSpeed = speed;
    setSimulationSpeed(speed);
  };

  const handleSelectScenario = (scen: ScenarioType) => {
    engineRef.current.loadScenario(scen);
    setActiveScenario(scen);
    setMetrics({ ...engineRef.current.metrics });
  };

  const handleSelectEntity = (type: 'BUILDING' | 'VEHICLE' | 'INCIDENT', id: string) => {
    setSelectedEntity({ type, id });
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
        incidents={engineRef.current.incidents}
        simulationTime={simulationTime}
        cameraMode={cameraMode}
        overlayMode={overlayMode}
        selectedEntityId={selectedEntity?.id || null}
        onSelectEntity={handleSelectEntity}
      />

      {/* Overseer Control Center & HUD */}
      <CityHUD
        metrics={metrics}
        agents={agents}
        events={events}
        simulationTime={simulationTime}
        simulationSpeed={simulationSpeed}
        activeScenario={activeScenario}
        cameraMode={cameraMode}
        overlayMode={overlayMode}
        selectedBuilding={selectedBuilding}
        onSetSpeed={handleSetSpeed}
        onSelectScenario={handleSelectScenario}
        onSelectCameraMode={setCameraMode}
        onSelectOverlayMode={setOverlayMode}
        onTriggerIntervention={handleTriggerIntervention}
      />
    </div>
  );
};
