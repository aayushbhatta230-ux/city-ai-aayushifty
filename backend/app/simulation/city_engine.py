"""FORGE AI City Simulation Engine (Authoritative Backend Model & Validation)."""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class BuildingModel(BaseModel):
    id: str
    name: str
    zone: str
    residents: int = 0
    workers: int = 0
    power_demand_kw: float = 10.0
    water_demand_lph: float = 100.0
    power_supplied: bool = True
    water_supplied: bool = True
    waste_accumulated: float = 0.0
    under_construction: bool = False
    construction_progress: float = 0.0
    on_fire: bool = False

class RoadModel(BaseModel):
    id: str
    name: str
    lanes: int = 2
    density: float = 0.0  # 0.0 to 1.0
    speed_limit: int = 50
    is_closed: bool = false if False else False

class IncidentModel(BaseModel):
    id: str
    incident_type: str
    building_id: Optional[str] = None
    severity: str = "MEDIUM"
    status: str = "ACTIVE"
    time_remaining_sec: float = 30.0

class CitySimulation:
    """Authoritative Python simulation model matching the 3D frontend city state."""

    def __init__(self):
        self.buildings: Dict[str, BuildingModel] = {}
        self.roads: Dict[str, RoadModel] = {}
        self.incidents: Dict[str, IncidentModel] = {}
        self.power_production_mw: float = 180.0
        self.water_supply_kl: float = 2200.0
        self.treasury_usd: float = 485000.0
        self._init_default_city()

    def _init_default_city(self):
        # Sample residential and commercial buildings
        for i in range(1, 10):
            self.buildings[f"bld-res-{i}"] = BuildingModel(
                id=f"bld-res-{i}",
                name=f"Residential Block #{i}",
                zone="RESIDENTIAL",
                residents=45,
                power_demand_kw=15.0,
                water_demand_lph=250.0
            )
        for i in range(1, 6):
            self.buildings[f"bld-com-{i}"] = BuildingModel(
                id=f"bld-com-{i}",
                name=f"Commercial Tower #{i}",
                zone="COMMERCIAL",
                workers=80,
                power_demand_kw=35.0,
                water_demand_lph=400.0
            )
        for i in range(1, 8):
            self.roads[f"road-{i}"] = RoadModel(id=f"road-{i}", name=f"Avenue {i}")

    def calculate_traffic_congestion(self) -> float:
        """Returns average road congestion percentage (0-100%)."""
        if not self.roads:
            return 0.0
        return sum(r.density for r in self.roads.values()) / len(self.roads) * 100.0

    def calculate_power_demand(self) -> float:
        """Returns total power demand in MW."""
        return sum(b.power_demand_kw for b in self.buildings.values()) / 10.0

    def calculate_water_demand(self) -> float:
        """Returns total water demand in kL."""
        return sum(b.water_demand_lph for b in self.buildings.values())

    def tick_simulation(self, delta_sec: float = 1.0):
        # Update construction
        for b in self.buildings.values():
            if b.under_construction:
                b.construction_progress = min(100.0, b.construction_progress + delta_sec * 5.0)
                if b.construction_progress >= 100.0:
                    b.under_construction = False

        # Update incidents
        for inc in self.incidents.values():
            if inc.status == "RESPONDING":
                inc.time_remaining_sec = max(0.0, inc.time_remaining_sec - delta_sec)
                if inc.time_remaining_sec <= 0:
                    inc.status = "RESOLVED"
                    if inc.building_id and inc.building_id in self.buildings:
                        self.buildings[inc.building_id].on_fire = False

    def intervene_traffic_timing(self, extension_sec: float = 12.0) -> Dict[str, Any]:
        """Traffic Agent intervention: optimizes congestion."""
        before = self.calculate_traffic_congestion()
        for r in self.roads.values():
            r.density = max(0.05, r.density * 0.45)
            r.is_closed = False
        after = self.calculate_traffic_congestion()
        return {"before_congestion": before, "after_congestion": after, "reduction": before - after}

    def dispatch_emergency_response(self, incident_id: str) -> bool:
        """Public Safety Agent intervention."""
        if incident_id in self.incidents:
            self.incidents[incident_id].status = "RESPONDING"
            return True
        return False
