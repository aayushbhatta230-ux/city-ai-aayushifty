import { 
  Building, 
  RoadSegment, 
  Intersection, 
  Vehicle, 
  Citizen, 
  Pedestrian, 
  Incident, 
  CityMetrics, 
  ScenarioType, 
  ZoneType, 
  BuildingType, 
  RoofStyle,
  AgentCharacter,
  UnitedProject,
  AgentRoleType
} from './types';

export class CitySimulationEngine {
  public buildings: Building[] = [];
  public roads: RoadSegment[] = [];
  public intersections: Intersection[] = [];
  public vehicles: Vehicle[] = [];
  public citizens: Citizen[] = [];
  public pedestrians: Pedestrian[] = [];
  public incidents: Incident[] = [];
  public metrics: CityMetrics;

  // The 8 Living Autonomous AI Agents
  public agentCharacters: AgentCharacter[] = [];
  public activeUnitedProject: UnitedProject | null = null;
  public selectedAgentId: string | null = null;
  public fpvAgentId: string | null = null;

  public simulationTime: number = 9.0; // 0.0 - 24.0 (Hour of day)
  public simulationSpeed: number = 1.0; // 0 = paused, 1 = normal, 2 = fast, 5 = ultra
  public tickCount: number = 0;
  public activeScenario: ScenarioType = 'BALANCED_METROPOLIS';

  constructor() {
    this.metrics = this.createDefaultMetrics();
    this.generateCityLayout();
    this.initAIAgentCharacters();
  }

  private createDefaultMetrics(): CityMetrics {
    return {
      population: 3200,
      employmentRate: 96.5,
      avgCommuteTime: 14.8,
      trafficCongestion: 12.0,
      powerProduction: 320.0,
      powerDemand: 240.0,
      powerGridStatus: 100.0,
      waterSupply: 4200.0,
      waterDemand: 3100.0,
      waterGridStatus: 100.0,
      treasury: 750000,
      incomeRate: 520,
      expenseRate: 280,
      citizenSatisfaction: 92.0,
      activeIncidentsCount: 0,
      carbonIndex: 21.0
    };
  }

  public generateCityLayout(): void {
    this.buildings = [];
    this.roads = [];
    this.intersections = [];
    this.vehicles = [];
    this.citizens = [];
    this.pedestrians = [];
    this.incidents = [];

    // 1. Generate 6x6 Connected Road Network
    const gridSize = 5; // 6 avenues x 6 streets (5 blocks across)
    const spacing = 28; // Distance between avenues
    const offset = (gridSize * spacing) / 2;

    // Intersections
    for (let r = 0; r <= gridSize; r++) {
      for (let c = 0; c <= gridSize; c++) {
        const x = c * spacing - offset;
        const z = r * spacing - offset;
        this.intersections.push({
          id: `inter-${r}-${c}`,
          x,
          z,
          signalState: (r + c) % 2 === 0 ? 'NS_GREEN' : 'EW_GREEN',
          greenDuration: 7.5,
          timer: ((r * 1.5) + (c * 2.2)) % 7.5
        });
      }
    }

    // East-West Roads
    for (let r = 0; r <= gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const x1 = c * spacing - offset;
        const z1 = r * spacing - offset;
        const x2 = (c + 1) * spacing - offset;
        const z2 = r * spacing - offset;
        this.roads.push({
          id: `road-ew-${r}-${c}`,
          name: `Avenue ${r + 1} E-W`,
          start: [x1, z1],
          end: [x2, z2],
          lanes: 2,
          density: 0.1,
          speedLimit: 50,
          isClosed: false,
          orientation: 'EW'
        });
      }
    }

    // North-South Roads
    for (let c = 0; c <= gridSize; c++) {
      for (let r = 0; r < gridSize; r++) {
        const x1 = c * spacing - offset;
        const z1 = r * spacing - offset;
        const x2 = c * spacing - offset;
        const z2 = (r + 1) * spacing - offset;
        this.roads.push({
          id: `road-ns-${c}-${r}`,
          name: `Street ${c + 1} N-S`,
          start: [x1, z1],
          end: [x2, z2],
          lanes: 2,
          density: 0.1,
          speedLimit: 50,
          isClosed: false,
          orientation: 'NS'
        });
      }
    }

    // 2. Named AI Department Headquarters & Urban Blocks
    // Landmark 1: Central Innovation Plaza (Center: 0, 0)
    this.buildings.push({
      id: 'bld-park',
      name: 'Central Innovation Plaza & AI Forum',
      signName: 'INNOVATION PLAZA',
      department: 'Multi-Agent Collective Forum',
      zone: 'PARK',
      type: 'PARK_SPACE',
      x: 0,
      z: 0,
      width: 22,
      depth: 22,
      height: 0.5,
      floors: 1,
      roofStyle: 'FLAT',
      facadeColor: '#15803D',
      color: '#15803D',
      roofColor: '#166534',
      accentColor: '#38BDF8',
      residents: 0,
      maxResidents: 0,
      workers: 25,
      maxWorkers: 50,
      powerDemand: 12,
      powerSupplied: true,
      waterDemand: 250,
      waterSupplied: true,
      wasteAccumulated: 2,
      health: 100
    });

    // Landmark 2: Citadel Spire (Master Orchestrator HQ)
    this.buildings.push({
      id: 'bld-citadel',
      name: 'Citadel Spire (Executive Orchestrator)',
      signName: 'CITADEL SPIRE',
      department: 'Executive Master Orchestration',
      zone: 'COMMERCIAL',
      type: 'SKYSCRAPER',
      x: 0,
      z: -28,
      width: 11,
      depth: 11,
      height: 42,
      floors: 14,
      roofStyle: 'ANTENNA',
      facadeColor: '#0F172A',
      color: '#0F172A',
      roofColor: '#1E293B',
      accentColor: '#38BDF8',
      residents: 0,
      maxResidents: 0,
      workers: 240,
      maxWorkers: 350,
      powerDemand: 45,
      powerSupplied: true,
      waterDemand: 420,
      waterSupplied: true,
      wasteAccumulated: 10,
      health: 100
    });

    // Landmark 3: Product Vision Lab (Analyst HQ)
    this.buildings.push({
      id: 'bld-vision-lab',
      name: 'Product Vision Lab (Requirements & PRD)',
      signName: 'VISION LAB',
      department: 'Product Strategy & User Stories',
      zone: 'COMMERCIAL',
      type: 'SKYSCRAPER',
      x: 28,
      z: 0,
      width: 9.5,
      depth: 9.5,
      height: 32,
      floors: 10,
      roofStyle: 'HELIPAD',
      facadeColor: '#581C87',
      color: '#581C87',
      roofColor: '#3B0764',
      accentColor: '#C084FC',
      residents: 0,
      maxResidents: 0,
      workers: 180,
      maxWorkers: 250,
      powerDemand: 30,
      powerSupplied: true,
      waterDemand: 310,
      waterSupplied: true,
      wasteAccumulated: 12,
      health: 100
    });

    // Landmark 4: Software Blueprint Complex (Architect HQ)
    this.buildings.push({
      id: 'bld-blueprint',
      name: 'Blueprint Complex (Software Architecture)',
      signName: 'BLUEPRINT COMPLEX',
      department: 'System Architecture & Schema Design',
      zone: 'COMMERCIAL',
      type: 'SKYSCRAPER',
      x: 28,
      z: -28,
      width: 10,
      depth: 10,
      height: 36,
      floors: 12,
      roofStyle: 'FLAT',
      facadeColor: '#1E3A8A',
      color: '#1E3A8A',
      roofColor: '#172554',
      accentColor: '#60A5FA',
      residents: 0,
      maxResidents: 0,
      workers: 210,
      maxWorkers: 300,
      powerDemand: 38,
      powerSupplied: true,
      waterDemand: 360,
      waterSupplied: true,
      wasteAccumulated: 15,
      health: 100
    });

    // Landmark 5: Fabrication Foundry (Implementation & Coding)
    this.buildings.push({
      id: 'bld-foundry',
      name: 'Fabrication Foundry (Code Synthesis)',
      signName: 'FABRICATION FOUNDRY',
      department: 'Full-Stack Implementation & AST',
      zone: 'INDUSTRIAL',
      type: 'FACTORY',
      x: -28,
      z: 28,
      width: 11,
      depth: 10,
      height: 22,
      floors: 6,
      roofStyle: 'CHIMNEY',
      facadeColor: '#78350F',
      color: '#78350F',
      roofColor: '#451A03',
      accentColor: '#F59E0B',
      residents: 0,
      maxResidents: 0,
      workers: 160,
      maxWorkers: 220,
      powerDemand: 52,
      powerSupplied: true,
      waterDemand: 450,
      waterSupplied: true,
      wasteAccumulated: 18,
      health: 100
    });

    // Landmark 6: Quality Assurance Bastion (Testing & Pytest)
    this.buildings.push({
      id: 'bld-qa-bastion',
      name: 'Quality Assurance Bastion (Testing & CI)',
      signName: 'QA BASTION',
      department: 'Automated Verification & Pytest Suite',
      zone: 'PUBLIC',
      type: 'OFFICE_TOWER',
      x: -28,
      z: -28,
      width: 9.5,
      depth: 9.5,
      height: 28,
      floors: 9,
      roofStyle: 'ANTENNA',
      facadeColor: '#065F46',
      color: '#065F46',
      roofColor: '#064E3B',
      accentColor: '#34D399',
      residents: 0,
      maxResidents: 0,
      workers: 140,
      maxWorkers: 200,
      powerDemand: 32,
      powerSupplied: true,
      waterDemand: 280,
      waterSupplied: true,
      wasteAccumulated: 8,
      health: 100
    });

    // Landmark 7: Diagnostic Core (Debugging & RCA)
    this.buildings.push({
      id: 'bld-diagnostic',
      name: 'Diagnostic Core (Debugging & Troubleshooting)',
      signName: 'DIAGNOSTIC CORE',
      department: 'Traceback Root Cause Analysis & Fixes',
      zone: 'COMMERCIAL',
      type: 'OFFICE_TOWER',
      x: -28,
      z: 0,
      width: 9,
      depth: 9,
      height: 24,
      floors: 8,
      roofStyle: 'FLAT',
      facadeColor: '#831843',
      color: '#831843',
      roofColor: '#500724',
      accentColor: '#F472B6',
      residents: 0,
      maxResidents: 0,
      workers: 110,
      maxWorkers: 160,
      powerDemand: 28,
      powerSupplied: true,
      waterDemand: 220,
      waterSupplied: true,
      wasteAccumulated: 6,
      health: 100
    });

    // Landmark 8: Security Citadel & Vault (Security Sentinel)
    this.buildings.push({
      id: 'bld-security',
      name: 'Security Citadel (Policy & Sandbox Vault)',
      signName: 'SECURITY CITADEL',
      department: 'Security Review, Sandboxing & Secrets',
      zone: 'PUBLIC',
      type: 'OFFICE_TOWER',
      x: 0,
      z: 28,
      width: 10.5,
      depth: 10.5,
      height: 30,
      floors: 10,
      roofStyle: 'HELIPAD',
      facadeColor: '#7F1D1D',
      color: '#7F1D1D',
      roofColor: '#450A0A',
      accentColor: '#EF4444',
      residents: 0,
      maxResidents: 0,
      workers: 130,
      maxWorkers: 190,
      powerDemand: 34,
      powerSupplied: true,
      waterDemand: 290,
      waterSupplied: true,
      wasteAccumulated: 9,
      health: 100
    });

    // Landmark 9: Cloud Release Dock & DevOps Terminal
    this.buildings.push({
      id: 'bld-release-dock',
      name: 'Cloud Release Dock (Deployment & DevOps)',
      signName: 'RELEASE DOCK',
      department: 'Containerization, Deploy & Infrastructure',
      zone: 'INDUSTRIAL',
      type: 'WAREHOUSE',
      x: 28,
      z: 28,
      width: 11,
      depth: 10,
      height: 20,
      floors: 5,
      roofStyle: 'FLAT',
      facadeColor: '#164E63',
      color: '#164E63',
      roofColor: '#083344',
      accentColor: '#22D3EE',
      residents: 0,
      maxResidents: 0,
      workers: 120,
      maxWorkers: 170,
      powerDemand: 40,
      powerSupplied: true,
      waterDemand: 340,
      waterSupplied: true,
      wasteAccumulated: 14,
      health: 100
    });

    // Landmark 10: Civic Mainframe Data Center
    this.buildings.push({
      id: 'bld-datacenter',
      name: 'Civic Mainframe & Server Farm',
      signName: 'DATA CENTER',
      department: 'Persistent SQLite & Vector Store',
      zone: 'PUBLIC',
      type: 'SILO',
      x: -56,
      z: 0,
      width: 12,
      depth: 10,
      height: 18,
      floors: 4,
      roofStyle: 'FLAT',
      facadeColor: '#334155',
      color: '#334155',
      roofColor: '#1E293B',
      accentColor: '#94A3B8',
      residents: 0,
      maxResidents: 0,
      workers: 40,
      maxWorkers: 80,
      powerDemand: 60,
      powerSupplied: true,
      waterDemand: 200,
      waterSupplied: true,
      wasteAccumulated: 5,
      health: 100
    });

    // Add varied residential, commercial, and suburban housing blocks around perimeter
    let bCount = 11;
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const bx = (c + 0.5) * spacing - offset;
        const bz = (r + 0.5) * spacing - offset;

        // Skip coordinates close to landmarks
        const isNearLandmark = this.buildings.some(b => 
          Math.abs(b.x - bx) < 14 && Math.abs(b.z - bz) < 14
        );
        if (isNearLandmark) continue;

        const isSuburban = (r <= 1 && c <= 1);
        const bType: BuildingType = isSuburban ? 'HOUSE' : 'APARTMENT';
        const height = isSuburban ? 4.5 : (10 + (bCount % 8) * 2);

        this.buildings.push({
          id: `bld-block-${bCount}`,
          name: isSuburban ? `Suburban House #${bCount}` : `Metropolitan Complex #${bCount}`,
          zone: isSuburban ? 'RESIDENTIAL' : 'COMMERCIAL',
          type: bType,
          x: bx,
          z: bz,
          width: isSuburban ? 7.5 : 8.5,
          depth: isSuburban ? 7.5 : 8.5,
          height,
          floors: isSuburban ? 2 : Math.floor(height / 3),
          roofStyle: isSuburban ? 'PITCHED' : 'FLAT',
          facadeColor: isSuburban ? '#059669' : '#2563EB',
          color: isSuburban ? '#059669' : '#2563EB',
          roofColor: '#78350F',
          accentColor: '#93C5FD',
          residents: isSuburban ? 8 : 65,
          maxResidents: isSuburban ? 12 : 90,
          workers: isSuburban ? 0 : 50,
          maxWorkers: isSuburban ? 0 : 75,
          powerDemand: 10 + height * 1.5,
          powerSupplied: true,
          waterDemand: 100 + height * 12,
          waterSupplied: true,
          wasteAccumulated: (bCount * 7) % 35,
          health: 100
        });
        bCount++;
      }
    }

    // 3. Populate Vehicles
    for (let v = 0; v < 36; v++) {
      const road = this.roads[v % this.roads.length];
      const isEmergency = v === 0 || v === 1;
      this.vehicles.push({
        id: `veh-${v + 1}`,
        type: isEmergency ? (v === 0 ? 'FIRE_TRUCK' : 'AMBULANCE') : (v % 4 === 0 ? 'BUS' : 'CAR'),
        x: road.start[0],
        z: road.start[1],
        y: 0.35,
        angle: 0,
        speed: isEmergency ? 52 : (v % 4 === 0 ? 30 : 38),
        maxSpeed: isEmergency ? 58 : 45,
        color: isEmergency ? '#EF4444' : (v % 4 === 0 ? '#F59E0B' : '#38BDF8'),
        roadId: road.id,
        progress: (v * 0.16) % 0.95,
        laneOffset: (v % 2 === 0 ? 1.3 : -1.3),
        isEmergency,
        sirenActive: false,
        originName: road.name,
        destinationName: 'Central Innovation Plaza'
      });
    }

    // 4. Populate Sidewalk Pedestrians
    for (let p = 0; p < 40; p++) {
      const road = this.roads[p % this.roads.length];
      const prog = (p * 0.1) % 1.0;
      const side = (p % 2 === 0 ? 2.6 : -2.6);
      this.pedestrians.push({
        id: `ped-${p + 1}`,
        x: road.start[0] + (road.end[0] - road.start[0]) * prog,
        z: road.start[1] + (road.end[1] - road.start[1]) * prog + side,
        targetX: road.end[0],
        targetZ: road.end[1] + side,
        speed: 2.2,
        angle: 0,
        color: '#94A3B8',
        state: 'WALKING'
      });
    }
  }

  // --- Initialize The 8 Autonomous AI Agent Characters ---
  private initAIAgentCharacters(): void {
    this.agentCharacters = [
      {
        id: 'agent-coordinator',
        role: 'COORDINATOR',
        name: 'Alex Vance',
        title: 'Master Orchestrator & Chief Architect',
        department: 'Executive Master Orchestration (Citadel Spire)',
        color: '#38BDF8', // Cyan
        x: 0,
        z: -24,
        targetX: 0,
        targetZ: 0, // Central Plaza
        speed: 3.5,
        angle: 0,
        homeBuildingId: 'bld-citadel',
        currentBuildingId: 'bld-citadel',
        currentTask: 'Overseeing multi-agent synchronization and pipeline throughput',
        assignedTasks: ['Orchestrate factory state machine', 'Resolve dependency deadlocks'],
        status: 'THINKING',
        currentThought: 'All 8 departmental towers operating with optimal pipeline synchronization.',
        thoughtBubble: 'Synthesizing global factory state...',
        speechTimer: 5.0,
        avatarIcon: 'Cpu',
        level: 10,
        skills: ['DAG Scheduling', 'State Machine Routing', 'Resource Balancing'],
        toolsInUse: ['ProcessRunner', 'TaskStateMachine', 'EventDispatcher']
      },
      {
        id: 'agent-analyst',
        role: 'URBAN_PLANNER',
        name: 'Dr. Maya Lin',
        title: 'Product Vision Analyst & Planner',
        department: 'Requirements & Specification Lab (Vision Lab)',
        color: '#C084FC', // Purple
        x: 24,
        z: 0,
        targetX: 0,
        targetZ: 0,
        speed: 3.2,
        angle: Math.PI / 2,
        homeBuildingId: 'bld-vision-lab',
        currentBuildingId: 'bld-vision-lab',
        currentTask: 'Decomposing project objectives into verifiable acceptance criteria',
        assignedTasks: ['Synthesize PRD specifications', 'Define behavioral test invariants'],
        status: 'COLLABORATING',
        currentThought: 'User directives decomposed into modular feature contracts.',
        thoughtBubble: 'Drafting acceptance criteria...',
        speechTimer: 4.5,
        avatarIcon: 'Layers',
        level: 9,
        skills: ['PRD Formulation', 'Contract Verification', 'User Stories'],
        toolsInUse: ['SpecSynthesizer', 'AcceptanceCriteriaGenerator']
      },
      {
        id: 'agent-architect',
        role: 'TRAFFIC',
        name: 'Marcus Vance',
        title: 'Principal Software Architect',
        department: 'System Architecture (Blueprint Complex)',
        color: '#3B82F6', // Royal Blue
        x: 24,
        z: -24,
        targetX: 24,
        targetZ: -24,
        speed: 3.4,
        angle: -Math.PI / 4,
        homeBuildingId: 'bld-blueprint',
        currentBuildingId: 'bld-blueprint',
        currentTask: 'Designing domain interfaces and database schemas',
        assignedTasks: ['Design domain model interfaces', 'Structure modular package layers'],
        status: 'THINKING',
        currentThought: 'Clean architecture interfaces isolated from external boundaries.',
        thoughtBubble: 'Optimizing DB schema index...',
        speechTimer: 6.0,
        avatarIcon: 'Compass',
        level: 10,
        skills: ['Clean Architecture', 'Type Hints', 'Schema Normalization'],
        toolsInUse: ['SchemaArchitect', 'InterfaceContractValidator']
      },
      {
        id: 'agent-engineer',
        role: 'ENERGY',
        name: 'Devon Cross',
        title: 'Senior Implementation Engineer',
        department: 'Source Code Fabrication (Foundry)',
        color: '#F59E0B', // Amber Gold
        x: -24,
        z: 24,
        targetX: -24,
        targetZ: 24,
        speed: 3.6,
        angle: Math.PI * 0.75,
        homeBuildingId: 'bld-foundry',
        currentBuildingId: 'bld-foundry',
        currentTask: 'Synthesizing robust FastAPI route handlers and business logic',
        assignedTasks: ['Implement endpoint controllers', 'Integrate SQLite persistence'],
        status: 'CODING',
        currentThought: 'Generating strongly typed Pydantic payloads with zero silent failures.',
        thoughtBubble: 'Writing AST route handler...',
        speechTimer: 5.5,
        avatarIcon: 'Sliders',
        level: 9,
        skills: ['Python 3.13 / FastAPI', 'TypeScript / React', 'AsyncIO Concurrency'],
        toolsInUse: ['CodeFabricator', 'ASTRefactoringEngine']
      },
      {
        id: 'agent-qa',
        role: 'WATER_WASTE',
        name: 'Elena Rostova',
        title: 'QA Bastion Test Lead',
        department: 'Quality Assurance & Automated Verification (QA Bastion)',
        color: '#10B981', // Emerald
        x: -24,
        z: -24,
        targetX: -24,
        targetZ: -24,
        speed: 3.3,
        angle: -Math.PI * 0.75,
        homeBuildingId: 'bld-qa-bastion',
        currentBuildingId: 'bld-qa-bastion',
        currentTask: 'Executing 20/20 pytest regression suites with edge-case assertion validation',
        assignedTasks: ['Execute pytest suite', 'Validate error boundary edge cases'],
        status: 'TESTING',
        currentThought: '100% test pass rate across unit, integration, and security suites.',
        thoughtBubble: '20/20 pytest assertions PASSED!',
        speechTimer: 6.5,
        avatarIcon: 'ShieldCheck',
        level: 10,
        skills: ['Pytest Test Automation', 'Coverage Profiling', 'Mutation Testing'],
        toolsInUse: ['PytestVerifier', 'CoverageProfiler']
      },
      {
        id: 'agent-diagnostic',
        role: 'ECONOMY',
        name: 'Dr. Aaron Chen',
        title: 'Root Cause & Diagnostic Specialist',
        department: 'Diagnostic Core & Troubleshooting',
        color: '#EC4899', // Pink
        x: -24,
        z: 0,
        targetX: -24,
        targetZ: 0,
        speed: 3.4,
        angle: Math.PI,
        homeBuildingId: 'bld-diagnostic',
        currentBuildingId: 'bld-diagnostic',
        currentTask: 'Performing automated root cause analysis on failed execution traces',
        assignedTasks: ['Isolate exception stack traces', 'Generate precise regression diffs'],
        status: 'THINKING',
        currentThought: 'Zero runtime regressions detected across active sandbox threads.',
        thoughtBubble: 'Traceback logs clean.',
        speechTimer: 4.0,
        avatarIcon: 'Radio',
        level: 9,
        skills: ['Traceback Deconstruction', 'Memory Profiling', 'Heuristic Repair'],
        toolsInUse: ['TracebackAnalyzer', 'AutomatedPatchGenerator']
      },
      {
        id: 'agent-security',
        role: 'PUBLIC_SAFETY',
        name: 'Kaelen Voss',
        title: 'Security Sentinel & Bastion Lead',
        department: 'Security Citadel & Policy Guardrails',
        color: '#EF4444', // Crimson
        x: 0,
        z: 24,
        targetX: 0,
        targetZ: 24,
        speed: 3.5,
        angle: Math.PI / 2,
        homeBuildingId: 'bld-security',
        currentBuildingId: 'bld-security',
        currentTask: 'Enforcing workspace path-jail containment and secret sanitization',
        assignedTasks: ['Audit command whitelist', 'Enforce secret token redaction'],
        status: 'COLLABORATING',
        currentThought: 'Path jail containment active; all execution sandboxed in secure workspace.',
        thoughtBubble: 'Security perimeter: 100% SECURE',
        speechTimer: 7.0,
        avatarIcon: 'Flame',
        level: 10,
        skills: ['Path Traversal Jail', 'Command Whitelisting', 'Secret Redaction'],
        toolsInUse: ['PathJailVerifier', 'SecretRedactionEngine']
      },
      {
        id: 'agent-devops',
        role: 'WELFARE',
        name: 'Sora Takahashi',
        title: 'Cloud Release Dock Chief',
        department: 'Deployment & CI/CD Pipeline (Release Dock)',
        color: '#06B6D4', // Teal
        x: 24,
        z: 24,
        targetX: 24,
        targetZ: 24,
        speed: 3.3,
        angle: Math.PI / 4,
        homeBuildingId: 'bld-release-dock',
        currentBuildingId: 'bld-release-dock',
        currentTask: 'Preparing production Docker assets and GitHub Actions CI pipelines',
        assignedTasks: ['Build Docker container artifacts', 'Validate deployment manifests'],
        status: 'DEPLOYING',
        currentThought: 'Container manifests verified; release artifacts packaged for production.',
        thoughtBubble: 'Docker container ready.',
        speechTimer: 5.0,
        avatarIcon: 'Zap',
        level: 9,
        skills: ['Docker OCI Containers', 'CI/CD Pipelines', 'Cloud Run Deployments'],
        toolsInUse: ['DockerBuilder', 'ArtifactPackager']
      }
    ];
  }

  // --- Authoritative Simulation Tick Loop ---
  public tick(deltaSeconds: number): void {
    if (this.simulationSpeed <= 0) return;
    const effectiveDelta = Math.min(deltaSeconds, 0.1) * this.simulationSpeed;
    this.tickCount++;

    // Advance 24-hour simulation clock
    this.simulationTime = (this.simulationTime + (effectiveDelta * 0.04)) % 24.0;

    // 1. Update Traffic Lights at Intersections
    this.intersections.forEach(inter => {
      inter.timer += effectiveDelta;
      if (inter.timer >= inter.greenDuration) {
        inter.timer = 0;
        inter.signalState = inter.signalState === 'NS_GREEN' ? 'EW_GREEN' : 'NS_GREEN';
      }
    });

    // 2. Move Vehicles along road network
    this.vehicles.forEach(veh => {
      const road = this.roads.find(r => r.id === veh.roadId);
      if (!road) return;

      const step = (veh.speed * 0.035 * effectiveDelta);
      veh.progress = Math.min(1.0, veh.progress + step);

      const sx = road.start[0];
      const sz = road.start[1];
      const ex = road.end[0];
      const ez = road.end[1];
      const dx = ex - sx;
      const dz = ez - sz;
      const roadLength = Math.sqrt(dx * dx + dz * dz) || 1;
      const nx = -dz / roadLength;
      const nz = dx / roadLength;

      veh.x = sx + dx * veh.progress + (nx * veh.laneOffset);
      veh.z = sz + dz * veh.progress + (nz * veh.laneOffset);
      veh.angle = Math.atan2(dz, dx);

      if (veh.progress >= 0.99) {
        veh.progress = 0.01;
        const candidates = this.roads.filter(r => 
          !r.isClosed && r.id !== road.id &&
          ((Math.abs(r.start[0] - ex) < 1.0 && Math.abs(r.start[1] - ez) < 1.0) ||
           (Math.abs(r.end[0] - ex) < 1.0 && Math.abs(r.end[1] - ez) < 1.0))
        );
        if (candidates.length > 0) {
          veh.roadId = candidates[Math.floor(Math.random() * candidates.length)].id;
        } else {
          veh.laneOffset = -veh.laneOffset;
          veh.progress = 0.05;
        }
      }
    });

    // 3. Update AI Agent Characters (Autonomous Movement & Speech)
    this.agentCharacters.forEach(ag => {
      // Countdown speech timer
      if (ag.speechTimer !== undefined) {
        ag.speechTimer -= effectiveDelta;
        if (ag.speechTimer <= 0) {
          // Refresh thought
          ag.thoughtBubble = undefined;
        }
      }

      // Check distance to target destination
      const dx = ag.targetX - ag.x;
      const dz = ag.targetZ - ag.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.8) {
        // Move towards target
        const step = ag.speed * effectiveDelta;
        ag.x += (dx / dist) * step;
        ag.z += (dz / dist) * step;
        ag.angle = Math.atan2(dz, dx);
        if (ag.status !== 'CODING' && ag.status !== 'TESTING') {
          ag.status = 'WALKING';
        }
      } else {
        // Reached destination -> collaborate or work
        if (ag.status === 'WALKING') {
          ag.status = 'THINKING';
        }

        // Randomly pick a new landmark to visit or return home every ~20 seconds
        if (Math.random() < 0.005 && !this.activeUnitedProject) {
          const destinations = [
            { x: 0, z: 0 }, // Central Innovation Plaza
            { x: 0, z: -24 }, // Citadel
            { x: 24, z: 0 }, // Vision Lab
            { x: 24, z: -24 }, // Blueprint
            { x: -24, z: 24 }, // Foundry
            { x: -24, z: -24 }, // QA Bastion
            { x: -24, z: 0 }, // Diagnostic
            { x: 0, z: 24 }, // Security
            { x: 24, z: 24 } // Release Dock
          ];
          const dest = destinations[Math.floor(Math.random() * destinations.length)];
          ag.targetX = dest.x + (Math.random() * 4 - 2);
          ag.targetZ = dest.z + (Math.random() * 4 - 2);
        }
      }

      // Check for proximity collaboration with other agents
      this.agentCharacters.forEach(other => {
        if (other.id !== ag.id) {
          const interDist = Math.sqrt((ag.x - other.x) ** 2 + (ag.z - other.z) ** 2);
          if (interDist < 4.5 && !ag.thoughtBubble && Math.random() < 0.02) {
            ag.speechTimer = 4.0;
            ag.thoughtBubble = `Syncing with ${other.name.split(' ')[0]}...`;
          }
        }
      });
    });

    // 4. Update United Project Progression (Real Collective Intelligence)
    if (this.activeUnitedProject && this.activeUnitedProject.status !== 'COMPLETED') {
      const proj = this.activeUnitedProject;
      proj.progress = Math.min(100, proj.progress + effectiveDelta * 4.0); // ~25 seconds to complete

      if (proj.progress < 25 && proj.status !== 'PLANNING') {
        proj.status = 'PLANNING';
        proj.activeAgentId = 'agent-analyst';
        const analyst = this.agentCharacters.find(a => a.id === 'agent-analyst');
        if (analyst) {
          analyst.targetX = 0; analyst.targetZ = 0; // Head to Plaza
          analyst.thoughtBubble = 'Synthesizing PRD for United Project...';
          analyst.speechTimer = 5.0;
        }
      } else if (proj.progress >= 25 && proj.progress < 50 && proj.status !== 'ARCHITECTING') {
        proj.status = 'ARCHITECTING';
        proj.activeAgentId = 'agent-architect';
        proj.stageLogs.push({
          timestamp: new Date().toLocaleTimeString(),
          agentName: 'Dr. Maya Lin (Analyst)',
          message: 'PRD approved. Passing system contract to Software Architect.',
          step: 'PLANNING'
        });
        const arch = this.agentCharacters.find(a => a.id === 'agent-architect');
        if (arch) {
          arch.targetX = 24; arch.targetZ = -24; // Head to Blueprint Complex
          arch.thoughtBubble = 'Designing modular architecture schema...';
          arch.speechTimer = 5.0;
        }
      } else if (proj.progress >= 50 && proj.progress < 75 && proj.status !== 'IMPLEMENTING') {
        proj.status = 'IMPLEMENTING';
        proj.activeAgentId = 'agent-engineer';
        proj.stageLogs.push({
          timestamp: new Date().toLocaleTimeString(),
          agentName: 'Marcus Vance (Architect)',
          message: 'Architecture blueprint validated. Handing code generation to Foundry.',
          step: 'ARCHITECTING'
        });
        const eng = this.agentCharacters.find(a => a.id === 'agent-engineer');
        if (eng) {
          eng.targetX = -24; eng.targetZ = 24; // Head to Foundry
          eng.thoughtBubble = 'Fabricating source code modules...';
          eng.speechTimer = 5.0;
          eng.status = 'CODING';
        }
      } else if (proj.progress >= 75 && proj.progress < 95 && proj.status !== 'TESTING') {
        proj.status = 'TESTING';
        proj.activeAgentId = 'agent-qa';
        proj.stageLogs.push({
          timestamp: new Date().toLocaleTimeString(),
          agentName: 'Devon Cross (Engineer)',
          message: 'Source code synthesized. Dispatching to QA Bastion for verification.',
          step: 'IMPLEMENTING'
        });
        const qa = this.agentCharacters.find(a => a.id === 'agent-qa');
        if (qa) {
          qa.targetX = -24; qa.targetZ = -24; // Head to QA Bastion
          qa.thoughtBubble = 'Running 20/20 test assertions...';
          qa.speechTimer = 5.0;
          qa.status = 'TESTING';
        }
      } else if (proj.progress >= 100 && proj.status !== 'COMPLETED') {
        proj.status = 'COMPLETED';
        proj.deliverables = [
          'backend/app/controllers/api_service.py',
          'backend/tests/test_api_service.py (20/20 PASSED)',
          'docker-compose.yml & Dockerfile',
          'docs/ARCHITECTURE_SPEC.md'
        ];
        proj.stageLogs.push({
          timestamp: new Date().toLocaleTimeString(),
          agentName: 'Alex Vance (Orchestrator)',
          message: `United Project '${proj.title}' successfully verified and completed!`,
          step: 'COMPLETED'
        });
        // Celebration in plaza
        this.agentCharacters.forEach((ag, idx) => {
          ag.targetX = Math.cos(idx) * 6;
          ag.targetZ = Math.sin(idx) * 6;
          ag.thoughtBubble = 'United Project Complete!';
          ag.speechTimer = 8.0;
        });
      }
    }

    this.recalculateMetrics();
  }

  // --- Assign Direct Task to an Individual Agent ---
  public assignTaskToAgent(agentId: string, taskDescription: string): void {
    const ag = this.agentCharacters.find(a => a.id === agentId);
    if (!ag) return;

    ag.currentTask = taskDescription;
    ag.assignedTasks.unshift(taskDescription);
    ag.thoughtBubble = `Directive received: "${taskDescription.slice(0, 32)}..."`;
    ag.speechTimer = 6.0;

    // Head to their department or target building
    const homeBld = this.buildings.find(b => b.id === ag.homeBuildingId);
    if (homeBld) {
      ag.targetX = homeBld.x;
      ag.targetZ = homeBld.z;
    }
    ag.status = ag.role === 'ENERGY' ? 'CODING' : (ag.role === 'WATER_WASTE' ? 'TESTING' : 'THINKING');
    ag.currentThought = `Executing directive: ${taskDescription}`;
  }

  // --- Deploy City-Wide United Project ---
  public deployUnitedProject(title: string, description: string): UnitedProject {
    const proj: UnitedProject = {
      id: `proj-${Date.now()}`,
      title,
      description,
      status: 'PLANNING',
      progress: 5,
      activeAgentId: 'agent-coordinator',
      startedAt: new Date().toLocaleTimeString(),
      deliverables: [],
      stageLogs: [
        {
          timestamp: new Date().toLocaleTimeString(),
          agentName: 'Alex Vance (Chief Architect)',
          message: `Broadcasted United Project directive: "${title}". All 8 agents mobilized.`,
          step: 'INITIATION'
        }
      ]
    };

    this.activeUnitedProject = proj;

    // Mobilize agents towards Central Innovation Plaza for initial briefing
    this.agentCharacters.forEach((ag, idx) => {
      ag.targetX = Math.cos((idx / 8) * Math.PI * 2) * 5;
      ag.targetZ = Math.sin((idx / 8) * Math.PI * 2) * 5;
      ag.thoughtBubble = 'Rallying at Innovation Plaza...';
      ag.speechTimer = 5.0;
    });

    return proj;
  }

  public recalculateMetrics(): void {
    let totalPop = 0;
    let totalPowerReq = 0;
    let totalWaterReq = 0;
    let occupiedJobs = 0;

    this.buildings.forEach(b => {
      totalPop += b.residents;
      occupiedJobs += b.workers;
      totalPowerReq += b.powerDemand;
      totalWaterReq += b.waterDemand;
    });

    const openRoads = this.roads.filter(r => !r.isClosed);
    const avgDensity = openRoads.reduce((acc, r) => acc + r.density, 0) / (openRoads.length || 1);
    const congestionPct = Math.round(avgDensity * 100);

    this.metrics.population = totalPop;
    this.metrics.trafficCongestion = congestionPct;
    this.metrics.powerDemand = Math.round(totalPowerReq / 8);
    this.metrics.waterDemand = Math.round(totalWaterReq);
    this.metrics.powerGridStatus = this.metrics.powerProduction >= this.metrics.powerDemand 
      ? 100 
      : Math.round((this.metrics.powerProduction / this.metrics.powerDemand) * 100);
    this.metrics.waterGridStatus = this.metrics.waterSupply >= this.metrics.waterDemand 
      ? 100 
      : Math.round((this.metrics.waterSupply / this.metrics.waterDemand) * 100);

    // Citizen Satisfaction
    let sat = 92 - (congestionPct * 0.35);
    if (this.activeUnitedProject?.status === 'COMPLETED') sat = 98;
    this.metrics.citizenSatisfaction = Math.max(15, Math.min(100, Math.round(sat)));
  }

  public loadScenario(scenario: ScenarioType): void {
    this.activeScenario = scenario;
    this.generateCityLayout();
    this.initAIAgentCharacters();
  }
}
