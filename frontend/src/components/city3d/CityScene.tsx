import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  Building, 
  RoadSegment, 
  Intersection, 
  Vehicle, 
  Incident, 
  CameraMode, 
  OverlayMode 
} from '../../simulation/types';

interface CitySceneProps {
  buildings: Building[];
  roads: RoadSegment[];
  intersections: Intersection[];
  vehicles: Vehicle[];
  incidents: Incident[];
  simulationTime: number; // 0.0 - 24.0
  cameraMode: CameraMode;
  overlayMode: OverlayMode;
  selectedEntityId: string | null;
  onSelectEntity: (type: 'BUILDING' | 'VEHICLE' | 'INCIDENT', id: string) => void;
}

export const CityScene: React.FC<CitySceneProps> = ({
  buildings,
  roads,
  intersections,
  vehicles,
  incidents,
  simulationTime,
  cameraMode,
  overlayMode,
  selectedEntityId,
  onSelectEntity
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Mesh registries for fast updates
  const buildingMeshMap = useRef<Map<string, THREE.Mesh>>(new Map());
  const vehicleMeshMap = useRef<Map<string, THREE.Group>>(new Map());
  const roadMeshMap = useRef<Map<string, THREE.Mesh>>(new Map());
  const lightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientRef = useRef<THREE.AmbientLight | null>(null);

  // Camera state
  const orbitState = useRef({
    angleX: 0.8,
    angleY: 0.6,
    distance: 75,
    target: new THREE.Vector3(0, 0, 0),
    isDragging: false,
    prevX: 0,
    prevY: 0
  });

  // --- Initial Scene Mount ---
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Sun Light & Ambient Light
    const ambient = new THREE.AmbientLight(0xFFFFFF, 0.6);
    scene.add(ambient);
    ambientRef.current = ambient;

    const sun = new THREE.DirectionalLight(0xFFFBEB, 1.4);
    sun.position.set(50, 80, 40);
    sun.castShadow = true;
    scene.add(sun);
    lightRef.current = sun;

    // Ground Plane
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0B0F17,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    // Build Static Road Network Meshes
    roads.forEach(r => {
      const dx = r.end[0] - r.start[0];
      const dz = r.end[1] - r.start[1];
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);

      const roadGeo = new THREE.PlaneGeometry(length, 3.2);
      const roadMat = new THREE.MeshStandardMaterial({
        color: 0x1E2433,
        roughness: 0.8,
        metalness: 0.2
      });
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.rotation.z = -angle;
      roadMesh.position.set(
        (r.start[0] + r.end[0]) / 2,
        0.01,
        (r.start[1] + r.end[1]) / 2
      );
      roadMesh.userData = { type: 'ROAD', id: r.id };
      scene.add(roadMesh);
      roadMeshMap.current.set(r.id, roadMesh);

      // Dashed lane marking
      const lineGeo = new THREE.PlaneGeometry(length, 0.15);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xF8FAFC });
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      lineMesh.rotation.x = -Math.PI / 2;
      lineMesh.rotation.z = -angle;
      lineMesh.position.set(
        (r.start[0] + r.end[0]) / 2,
        0.02,
        (r.start[1] + r.end[1]) / 2
      );
      scene.add(lineMesh);
    });

    // Build Buildings Meshes
    buildings.forEach(b => {
      const geo = new THREE.BoxGeometry(b.width, b.height, b.depth);
      let bColor = new THREE.Color(b.color);

      const mat = new THREE.MeshStandardMaterial({
        color: bColor,
        roughness: 0.3,
        metalness: 0.5
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x, b.height / 2, b.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { type: 'BUILDING', id: b.id };

      // Edges outline
      const edges = new THREE.EdgesGeometry(geo);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x334155 });
      const wire = new THREE.LineSegments(edges, lineMat);
      mesh.add(wire);

      scene.add(mesh);
      buildingMeshMap.current.set(b.id, mesh);
    });

    // Raycaster for click selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        orbitState.current.isDragging = true;
        orbitState.current.prevX = e.clientX;
        orbitState.current.prevY = e.clientY;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (orbitState.current.isDragging) {
        const dx = e.clientX - orbitState.current.prevX;
        const dy = e.clientY - orbitState.current.prevY;
        orbitState.current.prevX = e.clientX;
        orbitState.current.prevY = e.clientY;

        orbitState.current.angleX -= dx * 0.005;
        orbitState.current.angleY = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, orbitState.current.angleY + dy * 0.005));
      }

      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;
    };

    const onMouseUp = () => {
      orbitState.current.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      orbitState.current.distance = Math.max(15, Math.min(130, orbitState.current.distance + e.deltaY * 0.06));
      e.preventDefault();
    };

    const onClick = () => {
      if (!cameraRef.current) return;
      raycaster.setFromCamera(mouse, cameraRef.current);
      const meshes = Array.from(buildingMeshMap.current.values());
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData?.id) {
          onSelectEntity('BUILDING', hit.userData.id);
        }
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('click', onClick);

    // --- Render Loop ---
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Camera positioning based on mode
      const st = orbitState.current;
      if (cameraMode === 'TOP_DOWN') {
        camera.position.set(0, 95, 0.1);
        camera.lookAt(0, 0, 0);
      } else if (cameraMode === 'STREET_LEVEL') {
        camera.position.set(0, 2.5, 20);
        camera.lookAt(0, 2.5, -30);
      } else {
        // Orbit mode
        camera.position.x = st.target.x + st.distance * Math.sin(st.angleX) * Math.cos(st.angleY);
        camera.position.z = st.target.z + st.distance * Math.cos(st.angleX) * Math.cos(st.angleY);
        camera.position.y = st.target.y + st.distance * Math.sin(st.angleY);
        camera.lookAt(st.target);
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      cameraRef.current.aspect = container.clientWidth / container.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // --- Dynamic Lighting & Day/Night Cycle ---
  useEffect(() => {
    if (!sceneRef.current || !lightRef.current || !ambientRef.current) return;

    // Day/Night Sun elevation calculation (0 = midnight, 12 = noon)
    const isDay = simulationTime >= 6.0 && simulationTime <= 19.0;
    const sunAngle = ((simulationTime - 6.0) / 13.0) * Math.PI;

    if (isDay) {
      // Daytime sun
      const sunHeight = Math.sin(sunAngle) * 90;
      const sunX = Math.cos(sunAngle) * 90;
      lightRef.current.position.set(sunX, Math.max(10, sunHeight), 40);
      lightRef.current.intensity = 1.4 * Math.sin(sunAngle);
      ambientRef.current.intensity = 0.5 + 0.3 * Math.sin(sunAngle);
      sceneRef.current.background = new THREE.Color(0x0E1424);
    } else {
      // Nighttime cyber sky
      lightRef.current.intensity = 0.15;
      ambientRef.current.intensity = 0.25;
      sceneRef.current.background = new THREE.Color(0x05070D);
    }
  }, [simulationTime]);

  // --- Dynamic Vehicle Mesh Updates ---
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    vehicles.forEach(v => {
      let vGroup = vehicleMeshMap.current.get(v.id);
      if (!vGroup) {
        vGroup = new THREE.Group();
        
        // Vehicle Body
        const bodyGeo = new THREE.BoxGeometry(1.6, 0.7, 0.85);
        const bodyMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(v.color),
          roughness: 0.2,
          metalness: 0.8
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.4;
        vGroup.add(body);

        // Emergency flashing beacon
        if (v.isEmergency) {
          const beaconGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.2, 8);
          const beaconMat = new THREE.MeshBasicMaterial({ color: 0xEF4444 });
          const beacon = new THREE.Mesh(beaconGeo, beaconMat);
          beacon.position.y = 0.85;
          vGroup.add(beacon);
        }

        scene.add(vGroup);
        vehicleMeshMap.current.set(v.id, vGroup);
      }

      // Update position & heading angle
      vGroup.position.set(v.x, 0.05, v.z);
      vGroup.rotation.y = -v.angle;
    });
  }, [vehicles]);

  // --- Dynamic Visual Overlays ---
  useEffect(() => {
    // 1. Traffic Overlay: Tint road colors based on congestion density
    roads.forEach(r => {
      const mesh = roadMeshMap.current.get(r.id);
      if (mesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (overlayMode === 'TRAFFIC') {
          if (r.density > 0.5) mat.color.setHex(0xEF4444); // red bottleneck
          else if (r.density > 0.2) mat.color.setHex(0xF59E0B); // amber medium
          else mat.color.setHex(0x10B981); // green free flow
        } else {
          mat.color.setHex(0x1E2433);
        }
      }
    });

    // 2. Power Overlay: Tint buildings based on power grid status
    buildings.forEach(b => {
      const mesh = buildingMeshMap.current.get(b.id);
      if (mesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (overlayMode === 'POWER') {
          mat.color.setHex(b.powerSupplied ? 0x3B82F6 : 0x1E293B);
        } else if (overlayMode === 'ZONING') {
          if (b.zone === 'COMMERCIAL') mat.color.setHex(0x8B5CF6);
          else if (b.zone === 'RESIDENTIAL') mat.color.setHex(0x10B981);
          else if (b.zone === 'INDUSTRIAL') mat.color.setHex(0xF59E0B);
          else if (b.zone === 'PARK') mat.color.setHex(0x15803D);
          else mat.color.setHex(0x06B6D4);
        } else if (b.onFire) {
          mat.color.setHex(0xDC2626); // flashing red on fire
        } else {
          mat.color.set(b.color);
        }
      }
    });
  }, [overlayMode, roads, buildings]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
