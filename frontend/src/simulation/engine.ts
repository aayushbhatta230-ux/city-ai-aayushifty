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
  VehicleType,
  RoofStyle
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

  public simulationTime: number = 8.5; // 0.0 - 24.0 (Hour of day)
  public simulationSpeed: number = 1.0; // 0 = paused, 1 = normal, 2 = fast, 5 = ultra
  public tickCount: number = 0;
  public activeScenario: ScenarioType = 'BALANCED_METROPOLIS';

  constructor() {
    this.metrics = this.createDefaultMetrics();
    this.generateCityLayout();
  }

  private createDefaultMetrics(): CityMetrics {
    return {
      population: 2450,
      employmentRate: 94.8,
      avgCommuteTime: 16.2,
      trafficCongestion: 14.0,
      powerProduction: 280.0,
      powerDemand: 210.0,
      powerGridStatus: 100.0,
      waterSupply: 3400.0,
      waterDemand: 2650.0,
      waterGridStatus: 100.0,
      treasury: 620000,
      incomeRate: 480,
      expenseRate: 260,
      citizenSatisfaction: 89.0,
      activeIncidentsCount: 0,
      carbonIndex: 24.0
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

    // --- 1. Generate 6x6 Connected Road Network ---
    const gridSize = 5; // 6 avenues x 6 streets (5 blocks across)
    const spacing = 26; // Distance between avenues in meters
    const offset = (gridSize * spacing) / 2;

    // Intersections with traffic lights
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
          timer: ((r * 1.7) + (c * 2.3)) % 7.5
        });
      }
    }

    // East-West Avenues
    for (let r = 0; r <= gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const x1 = c * spacing - offset;
        const z1 = r * spacing - offset;
        const x2 = (c + 1) * spacing - offset;
        const z2 = r * spacing - offset;
        this.roads.push({
          id: `road-ew-${r}-${c}`,
          name: `Avenue ${r + 1} E-W (Sec ${c + 1})`,
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

    // North-South Streets
    for (let c = 0; c <= gridSize; c++) {
      for (let r = 0; r < gridSize; r++) {
        const x1 = c * spacing - offset;
        const z1 = r * spacing - offset;
        const x2 = c * spacing - offset;
        const z2 = (r + 1) * spacing - offset;
        this.roads.push({
          id: `road-ns-${c}-${r}`,
          name: `Street ${c + 1} N-S (Sec ${r + 1})`,
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

    // --- 2. Procedural City Blocks & Architectural Neighborhoods ---
    let bId = 1;
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const blockCenterX = (c + 0.5) * spacing - offset;
        const blockCenterZ = (r + 0.5) * spacing - offset;

        // Determine District Zone
        let zone: ZoneType = 'RESIDENTIAL';
        if (c >= 2 && c <= 3 && r >= 2 && r <= 3) {
          zone = (c === 2 && r === 2) ? 'PARK' : 'COMMERCIAL'; // Central Park + Downtown
        } else if (c >= 3 && r >= 1 && r <= 3) {
          zone = 'COMMERCIAL'; // Financial District
        } else if (c <= 1 && r >= 3) {
          zone = 'INDUSTRIAL'; // Industrial Port & Logistics
        } else if (c === 1 && r === 2) {
          zone = 'PUBLIC'; // Civic Center (Hospital, Fire Station, School)
        } else if (r <= 1 && c <= 1) {
          zone = 'RESIDENTIAL'; // Suburban residential
        } else {
          zone = 'RESIDENTIAL'; // Urban apartments
        }

        // Special Block 1: Central Park
        if (zone === 'PARK') {
          this.buildings.push({
            id: `bld-park`,
            name: 'Central Eco-Plaza & Botanical Park',
            zone: 'PARK',
            type: 'PARK_SPACE',
            x: blockCenterX,
            z: blockCenterZ,
            width: 20,
            depth: 20,
            height: 0.4,
            floors: 1,
            roofStyle: 'FLAT',
            facadeColor: '#15803D',
            color: '#15803D',
            roofColor: '#166534',
            accentColor: '#38BDF8',
            residents: 0,
            maxResidents: 0,
            workers: 12,
            maxWorkers: 20,
            powerDemand: 8,
            powerSupplied: true,
            waterDemand: 220,
            waterSupplied: true,
            wasteAccumulated: 4,
            health: 100
          });
          continue;
        }

        // Subdivide each block into 4 distinct building plots with setbacks
        const subPlots = [
          { dx: -6.5, dz: -6.5, plotIdx: 0 },
          { dx: 6.5, dz: -6.5, plotIdx: 1 },
          { dx: -6.5, dz: 6.5, plotIdx: 2 },
          { dx: 6.5, dz: 6.5, plotIdx: 3 }
        ];

        subPlots.forEach(({ dx, dz, plotIdx }) => {
          const bx = blockCenterX + dx;
          const bz = blockCenterZ + dz;
          let bType: BuildingType = 'APARTMENT';
          let height = 12;
          let width = 8.5;
          let depth = 8.5;
          let floors = 4;
          let roofStyle: RoofStyle = 'FLAT';
          let facadeColor = '#3B82F6';
          let roofColor = '#1E293B';
          let accentColor = '#60A5FA';
          let residents = 60;
          let workers = 0;
          let underConstruction = false;
          let constructionProgress = 100;

          if (zone === 'COMMERCIAL') {
            // Downtown Skyscraper or Office Tower
            if (plotIdx === 0 || plotIdx === 3) {
              bType = 'SKYSCRAPER';
              height = 24 + ((bId * 7) % 20); // 24m - 44m high
              floors = Math.floor(height / 3.2);
              roofStyle = (bId % 2 === 0) ? 'HELIPAD' : 'ANTENNA';
              facadeColor = (bId % 3 === 0) ? '#1E3A8A' : '#0F172A';
              accentColor = '#38BDF8';
              residents = 0;
              workers = 180 + (bId % 80);
            } else {
              bType = 'OFFICE_TOWER';
              height = 16 + (bId % 10);
              floors = Math.floor(height / 3.2);
              roofStyle = 'FLAT';
              facadeColor = '#334155';
              accentColor = '#A855F7';
              residents = 0;
              workers = 120;
            }
          } else if (zone === 'INDUSTRIAL') {
            if (plotIdx === 0) {
              bType = 'FACTORY';
              height = 8.5;
              width = 10;
              depth = 8;
              floors = 2;
              roofStyle = 'CHIMNEY';
              facadeColor = '#78350F';
              roofColor = '#451A03';
              accentColor = '#F59E0B';
              workers = 90;
            } else if (plotIdx === 1) {
              bType = 'SILO';
              height = 11;
              width = 6.5;
              depth = 6.5;
              floors = 1;
              roofStyle = 'FLAT';
              facadeColor = '#94A3B8';
              accentColor = '#CBD5E1';
              workers = 25;
            } else {
              bType = 'WAREHOUSE';
              height = 6.5;
              width = 9.5;
              depth = 8.5;
              floors = 2;
              roofStyle = 'FLAT';
              facadeColor = '#475569';
              accentColor = '#E2E8F0';
              workers = 65;
            }
            residents = 0;
          } else if (zone === 'PUBLIC') {
            // Civic District
            if (plotIdx === 0) {
              bType = 'HOSPITAL';
              height = 11;
              floors = 4;
              roofStyle = 'HELIPAD';
              facadeColor = '#F8FAFC';
              accentColor = '#EF4444'; // Red Cross
              workers = 140;
            } else if (plotIdx === 1) {
              bType = 'FIRE_STATION';
              height = 7;
              floors = 2;
              roofStyle = 'ANTENNA';
              facadeColor = '#B91C1C';
              accentColor = '#FEE2E2';
              workers = 45;
            } else if (plotIdx === 2) {
              bType = 'SCHOOL';
              height = 6.5;
              floors = 2;
              roofStyle = 'PITCHED';
              facadeColor = '#0284C7';
              accentColor = '#BAE6FD';
              workers = 50;
            } else {
              bType = 'POWER_PLANT';
              height = 12;
              floors = 3;
              roofStyle = 'CHIMNEY';
              facadeColor = '#D97706';
              accentColor = '#FEF3C7';
              workers = 35;
            }
            residents = 0;
          } else {
            // Residential
            if (r <= 1 && c <= 1) {
              // Suburban single family house
              bType = 'HOUSE';
              height = 4.2;
              width = 6.8;
              depth = 6.8;
              floors = 2;
              roofStyle = 'PITCHED';
              facadeColor = (bId % 2 === 0) ? '#D97706' : '#059669';
              roofColor = '#991B1B';
              accentColor = '#FEF3C7';
              residents = 8;
              workers = 0;
            } else {
              // Urban apartments
              bType = 'APARTMENT';
              height = 10 + (bId % 8);
              floors = Math.floor(height / 3.0);
              roofStyle = 'FLAT';
              facadeColor = '#2563EB';
              accentColor = '#93C5FD';
              residents = 75;
              workers = 0;

              // Designate one plot as active construction site
              if (r === 1 && c === 4 && plotIdx === 0) {
                underConstruction = true;
                constructionProgress = 35;
                roofStyle = 'SCAFFOLDING';
                facadeColor = '#EAB308';
                accentColor = '#FACC15';
              }
            }
          }

          this.buildings.push({
            id: `bld-${bId}`,
            name: `${zone.charAt(0) + zone.slice(1).toLowerCase()} ${bType.replace('_', ' ')} #${bId}`,
            zone,
            type: bType,
            x: bx,
            z: bz,
            width,
            depth,
            height,
            floors,
            roofStyle,
            facadeColor,
            color: facadeColor,
            roofColor,
            accentColor,
            residents,
            maxResidents: Math.round(residents * 1.4),
            workers,
            maxWorkers: Math.round(workers * 1.4),
            powerDemand: 10 + height * 2.5,
            powerSupplied: true,
            waterDemand: 80 + residents * 15 + workers * 8,
            waterSupplied: true,
            wasteAccumulated: (bId * 9) % 45,
            underConstruction,
            constructionProgress,
            health: 100
          });
          bId++;
        });
      }
    }

    // --- 3. Populate 48 Distinct Vehicles with Lane Following ---
    const vehicleTypes: { type: VehicleType; color: string; count: number }[] = [
      { type: 'CAR', color: '#38BDF8', count: 18 },
      { type: 'SUV', color: '#10B981', count: 10 },
      { type: 'BUS', color: '#F59E0B', count: 6 },
      { type: 'TRUCK', color: '#94A3B8', count: 8 },
      { type: 'FIRE_TRUCK', color: '#EF4444', count: 2 },
      { type: 'AMBULANCE', color: '#FFFFFF', count: 2 },
      { type: 'POLICE', color: '#1E293B', count: 2 }
    ];

    let vIdx = 1;
    vehicleTypes.forEach(group => {
      for (let i = 0; i < group.count; i++) {
        const road = this.roads[vIdx % this.roads.length];
        const isEmergency = group.type === 'FIRE_TRUCK' || group.type === 'AMBULANCE' || group.type === 'POLICE';
        const forwardDirection = (vIdx % 2 === 0);

        this.vehicles.push({
          id: `veh-${vIdx}`,
          type: group.type,
          x: road.start[0],
          z: road.start[1],
          y: 0.35,
          angle: 0,
          speed: isEmergency ? 52 : (group.type === 'BUS' ? 28 : (group.type === 'TRUCK' ? 32 : 40)),
          maxSpeed: isEmergency ? 58 : 45,
          color: group.color,
          roadId: road.id,
          progress: (i * 0.18 + (vIdx * 0.07)) % 0.95,
          laneOffset: forwardDirection ? 1.3 : -1.3,
          isEmergency,
          sirenActive: false,
          originName: forwardDirection ? road.name : 'Civic Terminal',
          destinationName: 'Central District Plaza',
          isWaitingAtSignal: false
        });
        vIdx++;
      }
    });

    // --- 4. Populate Pedestrians on Sidewalks ---
    const pedColors = ['#F43F5E', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#E2E8F0'];
    for (let p = 0; p < 50; p++) {
      const road = this.roads[p % this.roads.length];
      const side = (p % 2 === 0 ? 2.4 : -2.4);
      const prog = (p * 0.08) % 1.0;
      const px = road.start[0] + (road.end[0] - road.start[0]) * prog + (road.orientation === 'EW' ? 0 : side);
      const pz = road.start[1] + (road.end[1] - road.start[1]) * prog + (road.orientation === 'EW' ? side : 0);

      this.pedestrians.push({
        id: `ped-${p + 1}`,
        x: px,
        z: pz,
        targetX: px + (Math.random() * 4 - 2),
        targetZ: pz + (Math.random() * 4 - 2),
        speed: 2.2 + (p % 3) * 0.4,
        angle: 0,
        color: pedColors[p % pedColors.length],
        state: 'WALKING'
      });
    }

    // --- 5. Populate Citizens with schedules ---
    const resBuildings = this.buildings.filter(b => b.zone === 'RESIDENTIAL');
    const workBuildings = this.buildings.filter(b => b.zone === 'COMMERCIAL' || b.zone === 'INDUSTRIAL');

    for (let c = 0; c < 120; c++) {
      const home = resBuildings[c % resBuildings.length];
      const work = workBuildings[c % workBuildings.length];
      this.citizens.push({
        id: `cit-${c + 1}`,
        name: `Citizen #${c + 1}`,
        age: 21 + (c % 52),
        homeBuildingId: home ? home.id : 'bld-1',
        workBuildingId: work ? work.id : 'bld-2',
        state: 'AT_HOME',
        satisfaction: 86 + (c % 14),
        income: 4200 + (c % 30) * 120
      });
    }

    this.recalculateMetrics();
  }

  // --- Authoritative Simulation Tick Loop ---
  public tick(deltaSeconds: number): void {
    if (this.simulationSpeed <= 0) return;
    const effectiveDelta = Math.min(deltaSeconds, 0.1) * this.simulationSpeed;
    this.tickCount++;

    // Advance 24-hour simulation clock (smooth rate)
    this.simulationTime = (this.simulationTime + (effectiveDelta * 0.04)) % 24.0;

    // 1. Update Traffic Lights at Intersections
    this.intersections.forEach(inter => {
      inter.timer += effectiveDelta;
      if (inter.timer >= inter.greenDuration) {
        inter.timer = 0;
        inter.signalState = inter.signalState === 'NS_GREEN' ? 'EW_GREEN' : 'NS_GREEN';
      }
    });

    // 2. Authoritative Vehicle Movement with Signals, Lane Following, and Queuing
    const roadVehicleTally: { [roadId: string]: number } = {};

    this.vehicles.forEach(veh => {
      const road = this.roads.find(r => r.id === veh.roadId);
      if (!road) return;

      roadVehicleTally[road.id] = (roadVehicleTally[road.id] || 0) + 1;

      // Find intersection at the end of this road
      const endIntersection = this.intersections.find(inter => 
        Math.abs(inter.x - road.end[0]) < 1.0 && Math.abs(inter.z - road.end[1]) < 1.0
      );

      // Check if vehicle must stop for Red Signal at intersection
      let shouldStopAtSignal = false;
      if (endIntersection && veh.progress > 0.82 && veh.progress < 0.96 && !veh.isEmergency) {
        if (road.orientation === 'EW' && endIntersection.signalState === 'NS_GREEN') {
          shouldStopAtSignal = true; // EW light is RED
        } else if (road.orientation === 'NS' && endIntersection.signalState === 'EW_GREEN') {
          shouldStopAtSignal = true; // NS light is RED
        }
      }
      veh.isWaitingAtSignal = shouldStopAtSignal;

      // Calculate speed based on road conditions
      let effectiveSpeed = veh.speed;
      if (road.isClosed) {
        effectiveSpeed = 4.0; // crawl off closed road
      } else if (shouldStopAtSignal) {
        effectiveSpeed = 0.0; // stopped at red light
      } else {
        const congestionSlowdown = Math.max(0.2, 1.0 - (road.density * 0.85));
        effectiveSpeed = veh.speed * congestionSlowdown;
      }

      // Step progress along road vector
      const step = (effectiveSpeed * 0.035 * effectiveDelta);
      veh.progress = Math.min(1.0, veh.progress + step);

      // Compute 3D world position with lateral lane offset
      const sx = road.start[0];
      const sz = road.start[1];
      const ex = road.end[0];
      const ez = road.end[1];
      const dx = ex - sx;
      const dz = ez - sz;
      const roadLength = Math.sqrt(dx * dx + dz * dz) || 1;
      const nx = -dz / roadLength; // perpendicular normal
      const nz = dx / roadLength;

      veh.x = sx + dx * veh.progress + (nx * veh.laneOffset);
      veh.z = sz + dz * veh.progress + (nz * veh.laneOffset);
      veh.angle = Math.atan2(dz, dx);

      // Reached intersection / end of road -> transition to connecting road
      if (veh.progress >= 0.99) {
        veh.progress = 0.01;
        // Search open connecting roads at this intersection
        const candidates = this.roads.filter(r => 
          !r.isClosed &&
          r.id !== road.id &&
          ((Math.abs(r.start[0] - ex) < 1.0 && Math.abs(r.start[1] - ez) < 1.0) ||
           (Math.abs(r.end[0] - ex) < 1.0 && Math.abs(r.end[1] - ez) < 1.0))
        );

        if (candidates.length > 0) {
          const nextRoad = candidates[Math.floor(Math.random() * candidates.length)];
          veh.roadId = nextRoad.id;
          // Set origin/destination info
          veh.destinationName = nextRoad.name;
        } else {
          // Dead end or closed detour: flip lane and head back
          veh.laneOffset = -veh.laneOffset;
          veh.progress = 0.05;
        }
      }
    });

    // 3. Recalculate Road Congestion Densities
    this.roads.forEach(r => {
      const count = roadVehicleTally[r.id] || 0;
      r.density = r.isClosed ? 1.0 : Math.min(1.0, count / 5.0);
    });

    // 4. Move Pedestrians along sidewalks
    this.pedestrians.forEach(ped => {
      const pdx = ped.targetX - ped.x;
      const pdz = ped.targetZ - ped.z;
      const dist = Math.sqrt(pdx * pdx + pdz * pdz);

      if (dist < 0.5) {
        // Pick new sidewalk destination
        ped.targetX = ped.x + (Math.random() * 8 - 4);
        ped.targetZ = ped.z + (Math.random() * 8 - 4);
      } else {
        const moveDist = ped.speed * effectiveDelta;
        ped.x += (pdx / dist) * moveDist;
        ped.z += (pdz / dist) * moveDist;
        ped.angle = Math.atan2(pdz, pdx);
      }
    });

    // 5. Update Citizen Routines according to 24h clock
    const isMorningRush = this.simulationTime >= 7.0 && this.simulationTime <= 9.5;
    const isWorkHours = this.simulationTime > 9.5 && this.simulationTime < 17.0;
    const isEveningRush = this.simulationTime >= 17.0 && this.simulationTime <= 19.5;

    this.citizens.forEach(c => {
      if (isMorningRush) c.state = 'COMMUTING_WORK';
      else if (isWorkHours) c.state = 'AT_WORK';
      else if (isEveningRush) c.state = 'COMMUTING_HOME';
      else c.state = 'AT_HOME';
    });

    // 6. Update Construction Sites & Utilities
    this.buildings.forEach(b => {
      if (b.underConstruction) {
        b.constructionProgress = Math.min(100, (b.constructionProgress || 0) + effectiveDelta * 3.5);
        if (b.constructionProgress >= 100) {
          b.underConstruction = false;
          b.roofStyle = 'FLAT';
          b.residents = Math.round(b.maxResidents * 0.9);
        }
      }
      b.wasteAccumulated = Math.min(100, b.wasteAccumulated + effectiveDelta * 0.04);
    });

    // 7. Update Incidents (countdown / emergency vehicle containment)
    this.incidents.forEach(inc => {
      if (inc.status === 'RESPONDING') {
        inc.timeRemaining = Math.max(0, inc.timeRemaining - effectiveDelta);
        if (inc.timeRemaining <= 0) {
          inc.status = 'RESOLVED';
          if (inc.buildingId) {
            const b = this.buildings.find(item => item.id === inc.buildingId);
            if (b) b.onFire = false;
          }
          // Turn off emergency vehicle sirens
          if (inc.dispatchedVehicleId) {
            const v = this.vehicles.find(item => item.id === inc.dispatchedVehicleId);
            if (v) v.sirenActive = false;
          }
        }
      }
    });

    this.recalculateMetrics();
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

    const totalRoads = this.roads.length || 1;
    const openRoads = this.roads.filter(r => !r.isClosed);
    const avgDensity = openRoads.reduce((acc, r) => acc + r.density, 0) / (openRoads.length || 1);
    const congestionPct = Math.round(avgDensity * 100);

    const activeIncidents = this.incidents.filter(i => i.status !== 'RESOLVED');

    this.metrics.population = totalPop;
    this.metrics.trafficCongestion = congestionPct;
    this.metrics.powerDemand = Math.round(totalPowerReq / 8);
    this.metrics.waterDemand = Math.round(totalWaterReq);
    this.metrics.activeIncidentsCount = activeIncidents.length;
    this.metrics.powerGridStatus = this.metrics.powerProduction >= this.metrics.powerDemand 
      ? 100 
      : Math.round((this.metrics.powerProduction / this.metrics.powerDemand) * 100);
    this.metrics.waterGridStatus = this.metrics.waterSupply >= this.metrics.waterDemand 
      ? 100 
      : Math.round((this.metrics.waterSupply / this.metrics.waterDemand) * 100);

    // Dynamic Treasury accumulation
    this.metrics.treasury += Math.round((this.metrics.incomeRate - this.metrics.expenseRate) * 0.02);

    // Dynamic Citizen Satisfaction
    let sat = 92 - (congestionPct * 0.35) - (activeIncidents.length * 9);
    if (this.metrics.powerGridStatus < 100) sat -= (100 - this.metrics.powerGridStatus) * 0.6;
    if (this.metrics.waterGridStatus < 100) sat -= (100 - this.metrics.waterGridStatus) * 0.5;
    this.metrics.citizenSatisfaction = Math.max(15, Math.min(100, Math.round(sat)));
  }

  // --- Real Interactive Interventions ---
  public toggleRoadClosure(roadId: string): boolean {
    const road = this.roads.find(r => r.id === roadId);
    if (road) {
      road.isClosed = !road.isClosed;
      this.recalculateMetrics();
      return road.isClosed;
    }
    return false;
  }

  public triggerEmergencyDispatch(incidentId: string): void {
    const inc = this.incidents.find(i => i.id === incidentId);
    if (!inc) return;

    inc.status = 'RESPONDING';
    const emergencyVeh = this.vehicles.find(v => v.isEmergency && !v.sirenActive);
    if (emergencyVeh) {
      emergencyVeh.sirenActive = true;
      emergencyVeh.targetIncidentId = inc.id;
      emergencyVeh.speed = 58;
      inc.dispatchedVehicleId = emergencyVeh.id;
    }
  }

  // --- Scenarios Ingestion ---
  public loadScenario(scenario: ScenarioType): void {
    this.activeScenario = scenario;
    this.generateCityLayout();

    if (scenario === 'RUSH_HOUR_GRIDLOCK') {
      this.simulationTime = 8.1;
      // Close a central avenue to cause real bottleneck rerouting
      if (this.roads[2]) this.roads[2].isClosed = true;
      if (this.roads[3]) this.roads[3].isClosed = true;

      // Spawn extra commuter vehicles
      for (let i = 0; i < 24; i++) {
        const road = this.roads[i % this.roads.length];
        this.vehicles.push({
          id: `veh-rush-${i}`,
          type: 'CAR',
          x: road.start[0],
          z: road.start[1],
          y: 0.35,
          angle: 0,
          speed: 26,
          maxSpeed: 42,
          color: '#E2E8F0',
          roadId: road.id,
          progress: Math.random() * 0.9,
          laneOffset: (i % 2 === 0 ? 1.3 : -1.3),
          isEmergency: false,
          sirenActive: false,
          originName: 'Suburban Commuter Zone',
          destinationName: 'Downtown Financial Center'
        });
      }
    } else if (scenario === 'POWER_GRID_FAILURE') {
      this.metrics.powerProduction = 60.0; // severe shortage
      this.buildings.slice(12, 28).forEach(b => { b.powerSupplied = false; });
    } else if (scenario === 'INDUSTRIAL_FIRE_EMERGENCY') {
      const factory = this.buildings.find(b => b.zone === 'INDUSTRIAL' && b.type === 'FACTORY');
      if (factory) {
        factory.onFire = true;
        this.incidents.push({
          id: `inc-fire-1`,
          type: 'FIRE',
          title: '3-Alarm Chemical Fire in Industrial Port',
          buildingId: factory.id,
          x: factory.x,
          z: factory.z,
          severity: 'CRITICAL',
          status: 'ACTIVE',
          timeRemaining: 28.0
        });
      }
    } else if (scenario === 'TECH_BOOM_EXPANSION') {
      this.metrics.treasury += 350000;
      const b = this.buildings.find(item => item.type === 'HOUSE');
      if (b) {
        b.underConstruction = true;
        b.constructionProgress = 15;
        b.type = 'APARTMENT';
        b.roofStyle = 'SCAFFOLDING';
      }
    }

    this.recalculateMetrics();
  }
}
