import { CitySimulationEngine } from './engine';
import { AgentObservation, AgentRoleType, SimulationEvent } from './types';

export class CityGovernmentCouncil {
  public agents: Map<AgentRoleType, AgentObservation> = new Map();
  public events: SimulationEvent[] = [];
  private lastEvaluationTick: number = 0;

  constructor() {
    this.initAgents();
  }

  private initAgents(): void {
    const roles: { role: AgentRoleType; name: string; objective: string }[] = [
      { role: 'COORDINATOR', name: 'Central City Coordinator', objective: 'Balance inter-agency priorities, distribute municipal treasury, and oversee civilization continuity.' },
      { role: 'TRAFFIC', name: 'Traffic Management Agent', objective: 'Eliminate intersection bottlenecks, optimize signal timing, and guarantee emergency vehicle routing.' },
      { role: 'URBAN_PLANNER', name: 'Urban Planning Agent', objective: 'Analyze housing occupancy and employment deficits to commission strategic construction projects.' },
      { role: 'ENERGY', name: 'Energy Management Agent', objective: 'Balance power generation against consumer demand to prevent blackouts and optimize grid stability.' },
      { role: 'WATER_WASTE', name: 'Water & Sanitation Agent', objective: 'Supervise reservoir pressure and dispatch automated waste collection fleets to accumulating zones.' },
      { role: 'PUBLIC_SAFETY', name: 'Public Safety Agent', objective: 'Detect urban incidents, dispatch emergency vehicles, and measure rapid response times.' },
      { role: 'ECONOMY', name: 'Economy & Finance Agent', objective: 'Optimize municipal taxation, track departmental expenditures, and protect fiscal sustainability.' },
      { role: 'WELFARE', name: 'Citizen Welfare Agent', objective: 'Monitor citizen happiness, commute stress, and public service equity across all districts.' },
    ];

    roles.forEach(r => {
      this.agents.set(r.role, {
        agentRole: r.role,
        name: r.name,
        status: 'STANDBY',
        currentObjective: r.objective,
        metricObserved: 'Normal Baseline',
        latestInsight: 'All municipal subsystems operating within standard parameters.',
        lastAction: 'Observing city telemetry.',
        lastOutcome: 'Baseline steady state confirmed.',
        interventionsCount: 0,
        confidenceScore: 0.95
      });
    });
  }

  // --- Step Agent Council Decision Loop ---
  public evaluateAndAct(engine: CitySimulationEngine): SimulationEvent[] {
    const newEvents: SimulationEvent[] = [];
    const now = new Date().toLocaleTimeString();

    // 1. Traffic Agent Evaluation
    const trafficAgent = this.agents.get('TRAFFIC')!;
    if (engine.metrics.trafficCongestion > 25) {
      // Congestion detected -> intervention: adjust intersection signal green durations
      trafficAgent.status = 'INTERVENING';
      trafficAgent.metricObserved = `Traffic Congestion: ${engine.metrics.trafficCongestion}%`;
      trafficAgent.latestInsight = `Identified vehicle bottlenecks at Avenue 2 and Street 3 intersections.`;

      // Action: optimize intersection timing
      engine.intersections.forEach(inter => {
        inter.greenDuration = 12.0; // increase green wave
      });
      // Clear any closed roads
      engine.roads.forEach(r => { r.isClosed = false; });

      trafficAgent.lastAction = 'Extended signal green phase to 12.0s and reopened congested avenue bypasses.';
      trafficAgent.lastOutcome = 'Intersection flow restored; vehicle queue latency decreasing.';
      trafficAgent.interventionsCount++;

      newEvents.push({
        id: `ev-${Date.now()}-1`,
        timestamp: now,
        agentRole: 'TRAFFIC',
        category: 'TRAFFIC',
        message: 'Traffic Agent adjusted signal cycles to 12s on congested avenues. Bottleneck clearing.',
        severity: 'SUCCESS'
      });
    } else {
      trafficAgent.status = 'ANALYZING';
      trafficAgent.metricObserved = `Traffic Congestion: ${engine.metrics.trafficCongestion}% (Nominal)`;
    }

    // 2. Public Safety Agent Evaluation
    const safetyAgent = this.agents.get('PUBLIC_SAFETY')!;
    const activeIncidents = engine.incidents.filter(i => i.status === 'ACTIVE');
    if (activeIncidents.length > 0) {
      safetyAgent.status = 'INTERVENING';
      const targetInc = activeIncidents[0];
      targetInc.status = 'RESPONDING';

      // Dispatch emergency vehicle
      const emergencyVeh = engine.vehicles.find(v => v.isEmergency);
      if (emergencyVeh) {
        emergencyVeh.targetIncidentId = targetInc.id;
        emergencyVeh.speed = 55; // high speed response
      }

      safetyAgent.metricObserved = `${activeIncidents.length} Active Incident: ${targetInc.title}`;
      safetyAgent.latestInsight = `Dispatched emergency response unit to coordinates (${targetInc.x.toFixed(0)}, ${targetInc.z.toFixed(0)}).`;
      safetyAgent.lastAction = `Mobilized emergency units with siren priority for ${targetInc.type}.`;
      safetyAgent.lastOutcome = `Target incident under containment; estimated resolution in ${targetInc.timeRemaining.toFixed(0)}s.`;
      safetyAgent.interventionsCount++;

      newEvents.push({
        id: `ev-${Date.now()}-2`,
        timestamp: now,
        agentRole: 'PUBLIC_SAFETY',
        category: 'SAFETY',
        message: `Public Safety Agent mobilized emergency dispatch to ${targetInc.title}. Response active.`,
        severity: 'ALERT'
      });
    } else {
      safetyAgent.status = 'STANDBY';
      safetyAgent.metricObserved = 'Zero active emergency incidents.';
    }

    // 3. Energy Management Agent Evaluation
    const energyAgent = this.agents.get('ENERGY')!;
    if (engine.metrics.powerDemand > engine.metrics.powerProduction) {
      energyAgent.status = 'INTERVENING';
      const deficit = engine.metrics.powerDemand - engine.metrics.powerProduction;
      // Action: activate auxiliary grid reserves
      engine.metrics.powerProduction += deficit + 20;
      engine.buildings.forEach(b => { b.powerSupplied = true; });

      energyAgent.metricObserved = `Grid Deficit: ${deficit} MW`;
      energyAgent.latestInsight = `Power demand spike detected. Activated secondary solar and battery storage reserves.`;
      energyAgent.lastAction = `Coupled auxiliary battery reserves (+${deficit + 20} MW) into city grid.`;
      energyAgent.lastOutcome = `100% grid stability achieved; zero brownouts.`;
      energyAgent.interventionsCount++;

      newEvents.push({
        id: `ev-${Date.now()}-3`,
        timestamp: now,
        agentRole: 'ENERGY',
        category: 'ENERGY',
        message: `Energy Agent activated auxiliary battery reserves. Full grid stability restored.`,
        severity: 'SUCCESS'
      });
    } else {
      energyAgent.status = 'OPTIMIZING';
      energyAgent.metricObserved = `Supply: ${engine.metrics.powerProduction} MW / Demand: ${engine.metrics.powerDemand} MW`;
    }

    // 4. Urban Planning Agent Evaluation
    const plannerAgent = this.agents.get('URBAN_PLANNER')!;
    const uncompletedProjects = engine.buildings.filter(b => b.underConstruction);
    if (engine.metrics.population > 1200 && uncompletedProjects.length === 0 && engine.metrics.treasury > 400000) {
      // Propose and authorize construction of high-density housing
      const candidate = engine.buildings.find(b => b.type === 'HOUSE');
      if (candidate) {
        candidate.underConstruction = true;
        candidate.constructionProgress = 5;
        candidate.type = 'APARTMENT';
        candidate.roofStyle = 'SCAFFOLDING';
        candidate.height = 14;
        candidate.maxResidents = 60;
        engine.metrics.treasury -= 35000;

        plannerAgent.status = 'INTERVENING';
        plannerAgent.metricObserved = `Population Density: ${engine.metrics.population} citizens`;
        plannerAgent.latestInsight = `Housing demand high. Re-zoned suburban plot into high-capacity Eco-Apartments.`;
        plannerAgent.lastAction = `Allocated $35,000 from treasury for high-density apartment construction.`;
        plannerAgent.lastOutcome = `Construction begun. Projecting +60 resident capacity upon completion.`;
        plannerAgent.interventionsCount++;

        newEvents.push({
          id: `ev-${Date.now()}-4`,
          timestamp: now,
          agentRole: 'URBAN_PLANNER',
          category: 'PLANNING',
          message: `Urban Planning Agent authorized construction of Eco-Apartments in Block #${candidate.id}.`,
          severity: 'INFO'
        });
      }
    } else {
      plannerAgent.status = 'ANALYZING';
      plannerAgent.metricObserved = `Active Construction Sites: ${uncompletedProjects.length}`;
    }

    // 5. Water & Waste Agent Evaluation
    const waterAgent = this.agents.get('WATER_WASTE')!;
    const dirtyBuildings = engine.buildings.filter(b => b.wasteAccumulated > 60);
    if (dirtyBuildings.length > 3) {
      waterAgent.status = 'INTERVENING';
      dirtyBuildings.forEach(b => { b.wasteAccumulated = 5; });
      waterAgent.metricObserved = `${dirtyBuildings.length} Buildings with critical waste accumulation`;
      waterAgent.latestInsight = `Dispatched automated sanitation collection fleet along Avenue 3.`;
      waterAgent.lastAction = `Cleaned and recycled accumulated solid waste across ${dirtyBuildings.length} city blocks.`;
      waterAgent.lastOutcome = `Sanitation index restored to 95%.`;
      waterAgent.interventionsCount++;

      newEvents.push({
        id: `ev-${Date.now()}-5`,
        timestamp: now,
        agentRole: 'WATER_WASTE',
        category: 'WATER',
        message: `Water & Sanitation Agent dispatched recycling fleet. ${dirtyBuildings.length} blocks cleaned.`,
        severity: 'SUCCESS'
      });
    } else {
      waterAgent.status = 'STANDBY';
      waterAgent.metricObserved = `Water Supply: ${engine.metrics.waterSupply} kL / Demand: ${engine.metrics.waterDemand} kL`;
    }

    // 6. Citizen Welfare Agent
    const welfareAgent = this.agents.get('WELFARE')!;
    welfareAgent.metricObserved = `Citizen Satisfaction: ${engine.metrics.citizenSatisfaction}%`;
    welfareAgent.latestInsight = engine.metrics.citizenSatisfaction > 80 
      ? 'Citizen morale high; commute times and utility availability satisfy municipal targets.'
      : 'Citizens reporting commute delays or incident anxiety. Requesting priority traffic clearance.';

    // 7. Economy Agent
    const econAgent = this.agents.get('ECONOMY')!;
    econAgent.metricObserved = `Treasury: $${engine.metrics.treasury.toLocaleString()} (+$${engine.metrics.incomeRate - engine.metrics.expenseRate}/tick)`;
    econAgent.latestInsight = 'Municipal tax revenues stable. Healthy cash reserves available for capital infrastructure.';

    // 8. Coordinator Agent
    const coordAgent = this.agents.get('COORDINATOR')!;
    coordAgent.metricObserved = `City Health: ${engine.metrics.citizenSatisfaction}% &bull; Security Level: ALPHA`;
    coordAgent.latestInsight = `All 7 departmental agencies synchronized. No resource deadlocks detected.`;

    this.events = [...newEvents, ...this.events].slice(0, 80);
    return newEvents;
  }
}
