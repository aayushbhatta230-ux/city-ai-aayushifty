import { 
  Building, 
  RoadSegment, 
  Intersection, 
  Vehicle, 
  Citizen, 
  Incident, 
  CityMetrics, 
  ScenarioType, 
  ZoneType, 
  BuildingType,
  VehicleType
} from './types';

export class CitySimulationEngine {
  public buildings: Building[] = [];
  public roads: RoadSegment[] = [];
  public intersections: Intersection[] = [];
  public vehicles: Vehicle[] = [];
  public citizens: Citizen[] = [];
  public incidents: Incident[] = [];
  public metrics: CityMetrics;

  public simulationTime: number = 8.0; // 0.0 - 24.0 (Hour of day)
  public simulationSpeed: number = 1.0; // 0 = paused, 1 = normal, 2 = fast, 5 = ultra
  public tickCount: number = 0;
  public activeScenario: ScenarioType = 'BALANCED_METROPOLIS';

  constructor() {
    this.metrics = this.createDefaultMetrics();
    this.generateCityLayout();
  }

  private createDefaultMetrics(): CityMetrics {
    return {
      population: 1250,
      employmentRate: 94.2,
      avgCommuteTime: 18.5,
      trafficCongestion: 12.0,
      powerProduction: 180.0,
      powerDemand: 135.0,
      powerGridStatus: 100.0,
      waterSupply: 2200.0,
      waterDemand: 1750.0,
      waterGridStatus: 100.0,
      treasury: 485000,
      incomeRate: 320,
      expenseRate: 180,
      citizenSatisfaction: 88.0,
      activeIncidentsCount: 0,
      carbonIndex: 28.0
    };
  }

  public generateCityLayout(): void {
    this.buildings = [];
    this.roads = [];
    this.intersections = [];
    this.vehicles = [];
    this.citizens = [];
    this.incidents = [];

    // 1. Generate Road Grid (5 East-West Avenues x 5 North-South Streets)
    const gridSize = 4;
    const spacing = 18; // distance between roads
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
          greenDuration: 8.0,
          timer: (r * 1.5 + c * 2.0) % 8.0
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
          name: `Avenue ${r + 1} East-West`,
          start: [x1, z1],
          end: [x2, z2],
          lanes: 2,
          density: 0.1,
          speedLimit: 50,
          isClosed: false
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
          name: `Street ${c + 1} North-South`,
          start: [x1, z1],
          end: [x2, z2],
          lanes: 2,
          density: 0.1,
          speedLimit: 50,
          isClosed: false
        });
      }
    }

    // 2. Generate Buildings inside city blocks
    let bId = 1;
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const blockCenterX = (c + 0.5) * spacing - offset;
        const blockCenterZ = (r + 0.5) * spacing - offset;

        // Determine District Zone
        let zone: ZoneType = 'RESIDENTIAL';
        if (c >= 2 && r >= 2) zone = 'COMMERCIAL';
        else if (c === 0 && r >= 2) zone = 'INDUSTRIAL';
        else if (c === 2 && r === 1) zone = 'PARK';
        else if (c === 1 && r === 1) zone = 'PUBLIC';

        if (zone === 'PARK') {
          // Central Green Park
          this.buildings.push({
            id: `bld-park`,
            name: 'Civic Central Park',
            zone: 'PARK',
            type: 'PARK_SPACE',
            x: blockCenterX,
            z: blockCenterZ,
            width: 14,
            depth: 14,
            height: 0.3,
            color: '#15803D',
            residents: 0,
            maxResidents: 0,
            workers: 5,
            maxWorkers: 10,
            powerDemand: 5,
            powerSupplied: true,
            waterDemand: 100,
            waterSupplied: true,
            wasteAccumulated: 0,
            health: 100
          });
          continue;
        }

        // Subdivide block into 4 quadrants
        const subOffsets = [
          [-4, -4], [4, -4],
          [-4, 4], [4, 4]
        ];

        subOffsets.forEach(([dx, dz], sIdx) => {
          const bx = blockCenterX + dx;
          const bz = blockCenterZ + dz;
          let bType: BuildingType = 'APARTMENT';
          let height = 6;
          let color = '#3B82F6';
          let residents = 40;
          let workers = 0;

          if (zone === 'COMMERCIAL') {
            bType = sIdx % 2 === 0 ? 'OFFICE_TOWER' : 'MALL';
            height = 12 + (bId % 5) * 3;
            color = '#8B5CF6';
            residents = 0;
            workers = 80;
          } else if (zone === 'INDUSTRIAL') {
            bType = sIdx % 2 === 0 ? 'FACTORY' : 'WAREHOUSE';
            height = 5 + (bId % 3) * 2;
            color = '#F59E0B';
            residents = 0;
            workers = 60;
          } else if (zone === 'PUBLIC') {
            if (sIdx === 0) { bType = 'HOSPITAL'; color = '#EF4444'; height = 8; }
            else if (sIdx === 1) { bType = 'SCHOOL'; color = '#06B6D4'; height = 6; }
            else if (sIdx === 2) { bType = 'FIRE_STATION'; color = '#DC2626'; height = 5; }
            else { bType = 'POWER_PLANT'; color = '#EAB308'; height = 9; }
            residents = 0;
            workers = 40;
          } else {
            // Residential
            bType = sIdx % 2 === 0 ? 'APARTMENT' : 'HOUSE';
            height = bType === 'HOUSE' ? 3.5 : 8 + (bId % 4) * 2;
            color = bType === 'HOUSE' ? '#10B981' : '#3B82F6';
            residents = bType === 'HOUSE' ? 8 : 45;
            workers = 0;
          }

          this.buildings.push({
            id: `bld-${bId}`,
            name: `${zone} Block #${bId}`,
            zone,
            type: bType,
            x: bx,
            z: bz,
            width: 5.5,
            depth: 5.5,
            height,
            color,
            residents,
            maxResidents: residents * 1.5,
            workers,
            maxWorkers: workers * 1.5,
            powerDemand: 10 + height * 2,
            powerSupplied: true,
            waterDemand: 100 + residents * 10,
            waterSupplied: true,
            wasteAccumulated: (bId * 7) % 40,
            health: 100
          });
          bId++;
        });
      }
    }

    // 3. Populate Vehicles moving along road network
    const vehicleColors = ['#E2E8F0', '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
    for (let v = 0; v < 36; v++) {
      const road = this.roads[v % this.roads.length];
      const isEmergency = v === 0 || v === 1; // Fire truck & Ambulance
      this.vehicles.push({
        id: `veh-${v + 1}`,
        type: isEmergency ? (v === 0 ? 'FIRE_TRUCK' : 'AMBULANCE') : 'CAR',
        x: road.start[0],
        z: road.start[1],
        angle: 0,
        speed: isEmergency ? 45 : 30 + (v % 15),
        maxSpeed: isEmergency ? 55 : 40,
        color: isEmergency ? '#EF4444' : vehicleColors[v % vehicleColors.length],
        roadId: road.id,
        progress: (v * 0.15) % 1.0,
        isEmergency,
        originName: 'Civic Center',
        destinationName: 'Commercial Plaza'
      });
    }

    // 4. Populate Citizens with schedules
    const resBuildings = this.buildings.filter(b => b.zone === 'RESIDENTIAL');
    const workBuildings = this.buildings.filter(b => b.zone === 'COMMERCIAL' || b.zone === 'INDUSTRIAL');

    for (let c = 0; c < 80; c++) {
      const home = resBuildings[c % resBuildings.length];
      const work = workBuildings[c % workBuildings.length];
      this.citizens.push({
        id: `cit-${c + 1}`,
        name: `Citizen #${c + 1}`,
        age: 22 + (c % 50),
        homeBuildingId: home ? home.id : 'bld-1',
        workBuildingId: work ? work.id : 'bld-2',
        state: 'AT_HOME',
        satisfaction: 85 + (c % 15),
        income: 3800 + (c % 25) * 150
      });
    }

    this.recalculateMetrics();
  }

  // --- Step Simulation Loop ---
  public tick(deltaSeconds: number): void {
    if (this.simulationSpeed <= 0) return;
    const effectiveDelta = deltaSeconds * this.simulationSpeed;
    this.tickCount++;

    // Advance 24-hour city clock
    this.simulationTime = (this.simulationTime + (effectiveDelta * 0.05)) % 24.0;

    // 1. Update Traffic Lights at Intersections
    this.intersections.forEach(inter => {
      inter.timer += effectiveDelta;
      if (inter.timer >= inter.greenDuration) {
        inter.timer = 0;
        inter.signalState = inter.signalState === 'NS_GREEN' ? 'EW_GREEN' : 'NS_GREEN';
      }
    });

    // 2. Move Vehicles along roads & handle lane following
    const roadTrafficCounts: { [roadId: string]: number } = {};

    this.vehicles.forEach(veh => {
      const currentRoad = this.roads.find(r => r.id === veh.roadId);
      if (!currentRoad) return;

      roadTrafficCounts[currentRoad.id] = (roadTrafficCounts[currentRoad.id] || 0) + 1;

      // Adjust speed for congestion
      const speedFactor = currentRoad.isClosed ? 0.0 : Math.max(0.15, 1.0 - currentRoad.density);
      const step = (veh.speed * speedFactor * 0.04 * effectiveDelta);
      veh.progress += step;

      // Interpolate position along road vector
      const sx = currentRoad.start[0];
      const sz = currentRoad.start[1];
      const ex = currentRoad.end[0];
      const ez = currentRoad.end[1];

      veh.x = sx + (ex - sx) * veh.progress;
      veh.z = sz + (ez - sz) * veh.progress;
      veh.angle = Math.atan2(ez - sz, ex - sx);

      // Reached intersection / end of road -> transition to connecting road
      if (veh.progress >= 1.0) {
        veh.progress = 0;
        // Pick connecting road
        const nextCandidates = this.roads.filter(r => 
          (Math.abs(r.start[0] - ex) < 0.5 && Math.abs(r.start[1] - ez) < 0.5) ||
          (Math.abs(r.end[0] - ex) < 0.5 && Math.abs(r.end[1] - ez) < 0.5)
        );
        if (nextCandidates.length > 0) {
          const nextRoad = nextCandidates[Math.floor(Math.random() * nextCandidates.length)];
          veh.roadId = nextRoad.id;
        }
      }
    });

    // 3. Recalculate Road Densities
    this.roads.forEach(r => {
      const count = roadTrafficCounts[r.id] || 0;
      r.density = Math.min(1.0, count / 4.0); // 4+ cars on 18m road = high density
    });

    // 4. Update Citizen Routines
    const isMorningRush = this.simulationTime >= 7.0 && this.simulationTime <= 9.5;
    const isWorkHours = this.simulationTime > 9.5 && this.simulationTime < 17.0;
    const isEveningRush = this.simulationTime >= 17.0 && this.simulationTime <= 19.5;

    this.citizens.forEach(c => {
      if (isMorningRush) c.state = 'COMMUTING_WORK';
      else if (isWorkHours) c.state = 'AT_WORK';
      else if (isEveningRush) c.state = 'COMMUTING_HOME';
      else c.state = 'AT_HOME';
    });

    // 5. Update Building Utilities & Waste
    this.buildings.forEach(b => {
      if (b.underConstruction) {
        b.constructionProgress = Math.min(100, (b.constructionProgress || 0) + effectiveDelta * 4);
        if (b.constructionProgress >= 100) {
          b.underConstruction = false;
        }
      }
      b.wasteAccumulated = Math.min(100, b.wasteAccumulated + effectiveDelta * 0.05);
    });

    // 6. Update Incidents (countdown / emergency vehicle arrival)
    this.incidents.forEach(inc => {
      if (inc.status === 'RESPONDING') {
        inc.timeRemaining = Math.max(0, inc.timeRemaining - effectiveDelta);
        if (inc.timeRemaining <= 0) {
          inc.status = 'RESOLVED';
          if (inc.buildingId) {
            const targetB = this.buildings.find(b => b.id === inc.buildingId);
            if (targetB) targetB.onFire = false;
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

    // Total traffic congestion
    const totalRoads = this.roads.length || 1;
    const avgDensity = this.roads.reduce((acc, r) => acc + r.density, 0) / totalRoads;
    const congestionPct = Math.round(avgDensity * 100);

    const activeIncidents = this.incidents.filter(i => i.status !== 'RESOLVED');

    this.metrics.population = totalPop;
    this.metrics.trafficCongestion = congestionPct;
    this.metrics.powerDemand = Math.round(totalPowerReq / 10);
    this.metrics.waterDemand = Math.round(totalWaterReq);
    this.metrics.activeIncidentsCount = activeIncidents.length;
    this.metrics.powerGridStatus = this.metrics.powerProduction >= this.metrics.powerDemand ? 100 : Math.round((this.metrics.powerProduction / this.metrics.powerDemand) * 100);
    this.metrics.waterGridStatus = this.metrics.waterSupply >= this.metrics.waterDemand ? 100 : Math.round((this.metrics.waterSupply / this.metrics.waterDemand) * 100);

    // Dynamic Treasury accumulation
    this.metrics.treasury += Math.round((this.metrics.incomeRate - this.metrics.expenseRate) * 0.02);

    // Citizen Satisfaction calculation
    let sat = 90 - (congestionPct * 0.3) - (activeIncidents.length * 8);
    if (this.metrics.powerGridStatus < 100) sat -= (100 - this.metrics.powerGridStatus) * 0.5;
    if (this.metrics.waterGridStatus < 100) sat -= (100 - this.metrics.waterGridStatus) * 0.5;
    this.metrics.citizenSatisfaction = Math.max(20, Math.min(100, Math.round(sat)));
  }

  // --- Scenarios Ingestion ---
  public loadScenario(scenario: ScenarioType): void {
    this.activeScenario = scenario;
    this.generateCityLayout();

    if (scenario === 'RUSH_HOUR_GRIDLOCK') {
      this.simulationTime = 8.2; // morning rush hour
      // Inject extra vehicles and close 1 artery
      for (let i = 0; i < 20; i++) {
        const road = this.roads[i % this.roads.length];
        this.vehicles.push({
          id: `veh-rush-${i}`,
          type: 'CAR',
          x: road.start[0],
          z: road.start[1],
          angle: 0,
          speed: 25,
          maxSpeed: 40,
          color: '#E2E8F0',
          roadId: road.id,
          progress: Math.random(),
          isEmergency: false,
          originName: 'Residential Suburbs',
          destinationName: 'Downtown Financial Center'
        });
      }
      if (this.roads[0]) this.roads[0].isClosed = true;
    } else if (scenario === 'POWER_GRID_FAILURE') {
      this.metrics.powerProduction = 40.0; // severe shortage
      this.buildings.slice(10, 22).forEach(b => { b.powerSupplied = false; });
    } else if (scenario === 'INDUSTRIAL_FIRE_EMERGENCY') {
      const factory = this.buildings.find(b => b.zone === 'INDUSTRIAL');
      if (factory) {
        factory.onFire = true;
        this.incidents.push({
          id: `inc-fire-1`,
          type: 'FIRE',
          title: '3-Alarm Chemical Fire in Industrial District',
          buildingId: factory.id,
          x: factory.x,
          z: factory.z,
          severity: 'CRITICAL',
          status: 'ACTIVE',
          timeRemaining: 25.0
        });
      }
    } else if (scenario === 'TECH_BOOM_EXPANSION') {
      this.metrics.treasury += 250000;
      // Propose new construction
      const openBuilding = this.buildings[this.buildings.length - 1];
      if (openBuilding) {
        openBuilding.underConstruction = true;
        openBuilding.constructionProgress = 10;
      }
    }
    this.recalculateMetrics();
  }
}
