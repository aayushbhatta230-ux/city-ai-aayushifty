import pytest
from app.simulation.city_engine import CitySimulation, IncidentModel

def test_city_initialization():
    city = CitySimulation()
    assert len(city.buildings) > 0
    assert len(city.roads) > 0
    assert city.power_production_mw >= 180.0
    assert city.treasury_usd > 0

def test_traffic_agent_closed_loop_reduction():
    city = CitySimulation()
    # Inject heavy congestion
    for r in city.roads.values():
        r.density = 0.85

    initial_congestion = city.calculate_traffic_congestion()
    assert initial_congestion > 70.0

    # Traffic Agent intervenes
    outcome = city.intervene_traffic_timing(extension_sec=12.0)
    final_congestion = city.calculate_traffic_congestion()

    assert final_congestion < initial_congestion
    assert outcome["reduction"] > 0
    assert final_congestion < 45.0

def test_energy_supply_and_demand():
    city = CitySimulation()
    demand = city.calculate_power_demand()
    assert demand > 0
    assert city.power_production_mw >= demand

def test_emergency_dispatch_lifecycle():
    city = CitySimulation()
    # Spawn fire incident
    incident_id = "inc-test-fire"
    target_building = "bld-res-1"
    city.buildings[target_building].on_fire = True
    city.incidents[incident_id] = IncidentModel(
        id=incident_id,
        incident_type="FIRE",
        building_id=target_building,
        status="ACTIVE",
        time_remaining_sec=3.0
    )

    # Public Safety agent dispatches emergency truck
    dispatched = city.dispatch_emergency_response(incident_id)
    assert dispatched is True
    assert city.incidents[incident_id].status == "RESPONDING"

    # Step simulation until resolved
    city.tick_simulation(delta_sec=4.0)
    assert city.incidents[incident_id].status == "RESOLVED"
    assert city.buildings[target_building].on_fire is False

def test_construction_lifecycle():
    city = CitySimulation()
    bld_id = "bld-res-2"
    city.buildings[bld_id].under_construction = True
    city.buildings[bld_id].construction_progress = 10.0

    # Advance ticks
    city.tick_simulation(delta_sec=10.0)
    assert city.buildings[bld_id].construction_progress > 50.0

    city.tick_simulation(delta_sec=15.0)
    assert city.buildings[bld_id].construction_progress == 100.0
    assert city.buildings[bld_id].under_construction is False
