import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  Building, 
  RoadSegment, 
  Intersection, 
  Vehicle, 
  Pedestrian,
  Incident, 
  CameraMode, 
  OverlayMode 
} from '../../simulation/types';

interface CitySceneProps {
  buildings: Building[];
  roads: RoadSegment[];
  intersections: Intersection[];
  vehicles: Vehicle[];
  pedestrians?: Pedestrian[];
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
  pedestrians = [],
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

  // Mesh registries for fast updates without recreating scene
  const buildingGroupMap = useRef<Map<string, THREE.Group>>(new Map());
  const vehicleGroupMap = useRef<Map<string, THREE.Group>>(new Map());
  const pedestrianGroupMap = useRef<Map<string, THREE.Group>>(new Map());
  const roadMeshMap = useRef<Map<string, THREE.Mesh>>(new Map());
  const trafficLightLenses = useRef<Map<string, { red: THREE.Mesh; green: THREE.Mesh }>>(new Map());
  const streetLightMaterials = useRef<THREE.MeshBasicMaterial[]>([]);

  // Lighting references
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);

  // Procedural Window Grid Canvas Texture
  const windowTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // Camera orbit state
  const orbitState = useRef({
    angleX: 0.85,
    angleY: 0.55,
    distance: 85,
    target: new THREE.Vector3(0, 0, 0),
    isDragging: false,
    prevX: 0,
    prevY: 0
  });

  // Helper to create illuminated window grid texture
  const createWindowTexture = (): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Dark building surface background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, 128, 128);

    // Glowing window array
    ctx.fillStyle = '#FDE047'; // warm yellow glow
    const rows = 8;
    const cols = 8;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Pseudo-random window occupancy
        if ((r * 3 + c * 7) % 5 !== 0) {
          ctx.fillRect(c * 16 + 3, r * 16 + 3, 10, 10);
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 6);
    return tex;
  };

  // --- Initial Scene Mount ---
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.0055);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1200
    );
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambient = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambient);
    ambientLightRef.current = ambient;

    const hemi = new THREE.HemisphereLight(0x38BDF8, 0x0F172A, 0.4);
    scene.add(hemi);
    hemiLightRef.current = hemi;

    const sun = new THREE.DirectionalLight(0xFFFBEB, 1.3);
    sun.position.set(70, 100, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 300;
    const d = 110;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    scene.add(sun);
    sunLightRef.current = sun;

    // 5. Ground Terrain & Baseplate
    const groundGeo = new THREE.PlaneGeometry(240, 240);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x080C14,
      roughness: 0.85,
      metalness: 0.15
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    // City grid baseline grid helper
    const grid = new THREE.GridHelper(240, 48, 0x1E293B, 0x0F172A);
    grid.position.y = -0.02;
    scene.add(grid);

    // Shared window texture
    const windowTex = createWindowTexture();
    windowTextureRef.current = windowTex;

    // --- 6. Build Roads, Sidewalks, Crosswalks, and Traffic Lights ---
    roads.forEach(r => {
      const dx = r.end[0] - r.start[0];
      const dz = r.end[1] - r.start[1];
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);
      const midX = (r.start[0] + r.end[0]) / 2;
      const midZ = (r.start[1] + r.end[1]) / 2;

      // Road Surface (Dark Asphalt)
      const roadGeo = new THREE.PlaneGeometry(length, 5.0);
      const roadMat = new THREE.MeshStandardMaterial({
        color: 0x161D2B,
        roughness: 0.75,
        metalness: 0.25
      });
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.rotation.z = -angle;
      roadMesh.position.set(midX, 0.02, midZ);
      roadMesh.receiveShadow = true;
      roadMesh.userData = { type: 'ROAD', id: r.id };
      scene.add(roadMesh);
      roadMeshMap.current.set(r.id, roadMesh);

      // Center Dashed White Line
      const centerLineGeo = new THREE.PlaneGeometry(length * 0.95, 0.16);
      const centerLineMat = new THREE.MeshBasicMaterial({ color: 0xF8FAFC });
      const centerLine = new THREE.Mesh(centerLineGeo, centerLineMat);
      centerLine.rotation.x = -Math.PI / 2;
      centerLine.rotation.z = -angle;
      centerLine.position.set(midX, 0.03, midZ);
      scene.add(centerLine);

      // Concrete Sidewalks on both sides
      const sidewalkMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.9
      });
      [-3.0, 3.0].forEach(offsetY => {
        const swGeo = new THREE.BoxGeometry(length, 0.15, 1.2);
        const swMesh = new THREE.Mesh(swGeo, sidewalkMat);
        swMesh.rotation.y = -angle;
        // Calculate offset position
        const nx = -Math.sin(angle) * offsetY;
        const nz = Math.cos(angle) * offsetY;
        swMesh.position.set(midX + nx, 0.08, midZ + nz);
        swMesh.receiveShadow = true;
        scene.add(swMesh);
      });
    });

    // Intersections: Zebra Crosswalks & 3D Traffic Light Gantries
    intersections.forEach(inter => {
      // Intersection junction plate
      const plateGeo = new THREE.PlaneGeometry(5.4, 5.4);
      const plateMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.8 });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.rotation.x = -Math.PI / 2;
      plate.position.set(inter.x, 0.025, inter.z);
      scene.add(plate);

      // Traffic Light Pole
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.5, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(inter.x + 3.2, 2.25, inter.z + 3.2);
      scene.add(pole);

      // Signal Housing Box
      const boxGeo = new THREE.BoxGeometry(0.5, 1.2, 0.4);
      const boxMat = new THREE.MeshStandardMaterial({ color: 0x0F172A });
      const signalBox = new THREE.Mesh(boxGeo, boxMat);
      signalBox.position.set(inter.x + 3.2, 3.8, inter.z + 3.2);
      scene.add(signalBox);

      // Red and Green Light Lenses
      const redLensMat = new THREE.MeshBasicMaterial({ color: 0xEF4444 });
      const greenLensMat = new THREE.MeshBasicMaterial({ color: 0x10B981 });
      const lensGeo = new THREE.SphereGeometry(0.12, 8, 8);

      const redLens = new THREE.Mesh(lensGeo, redLensMat);
      redLens.position.set(inter.x + 3.2, 4.1, inter.z + 3.0);
      scene.add(redLens);

      const greenLens = new THREE.Mesh(lensGeo, greenLensMat);
      greenLens.position.set(inter.x + 3.2, 3.5, inter.z + 3.0);
      scene.add(greenLens);

      trafficLightLenses.current.set(inter.id, { red: redLens, green: greenLens });
    });

    // --- 7. Procedural 3D Architectural Buildings ---
    buildings.forEach(b => {
      const bGroup = new THREE.Group();
      bGroup.position.set(b.x, 0, b.z);
      bGroup.userData = { type: 'BUILDING', id: b.id };

      if (b.type === 'PARK_SPACE') {
        // Lush grass base
        const parkGeo = new THREE.BoxGeometry(b.width, 0.25, b.depth);
        const parkMat = new THREE.MeshStandardMaterial({ color: 0x15803D, roughness: 0.9 });
        const parkPlate = new THREE.Mesh(parkGeo, parkMat);
        parkPlate.position.y = 0.12;
        parkPlate.receiveShadow = true;
        bGroup.add(parkPlate);

        // Reflective Water Pond
        const pondGeo = new THREE.CylinderGeometry(4.5, 4.5, 0.1, 16);
        const pondMat = new THREE.MeshStandardMaterial({
          color: 0x0284C7,
          metalness: 0.85,
          roughness: 0.15
        });
        const pond = new THREE.Mesh(pondGeo, pondMat);
        pond.position.set(0, 0.26, 0);
        bGroup.add(pond);

        // Procedural Trees
        const treeOffsets = [
          [-6, -6], [6, -6], [-6, 6], [6, 6],
          [-7, 0], [7, 0], [0, -7], [0, 7]
        ];
        treeOffsets.forEach(([tx, tz], tIdx) => {
          const trunkGeo = new THREE.CylinderGeometry(0.2, 0.25, 1.8, 6);
          const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.9 });
          const trunk = new THREE.Mesh(trunkGeo, trunkMat);
          trunk.position.set(tx, 0.9, tz);
          trunk.castShadow = true;
          bGroup.add(trunk);

          // Varied foliage shapes
          const foliageGeo = (tIdx % 2 === 0) 
            ? new THREE.ConeGeometry(1.6, 3.0, 7) 
            : new THREE.SphereGeometry(1.4, 7, 7);
          const foliageMat = new THREE.MeshStandardMaterial({ 
            color: (tIdx % 3 === 0) ? 0x16A34A : 0x15803D,
            roughness: 0.8
          });
          const foliage = new THREE.Mesh(foliageGeo, foliageMat);
          foliage.position.set(tx, 2.6, tz);
          foliage.castShadow = true;
          bGroup.add(foliage);
        });

      } else if (b.type === 'SKYSCRAPER') {
        // Multi-tier tiered skyscraper
        const baseH = b.height * 0.55;
        const baseGeo = new THREE.BoxGeometry(b.width, baseH, b.depth);
        const baseMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(b.facadeColor),
          metalness: 0.7,
          roughness: 0.25
        });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.y = baseH / 2;
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        bGroup.add(baseMesh);

        // Upper Tier Setback
        const topH = b.height * 0.45;
        const topW = b.width * 0.75;
        const topD = b.depth * 0.75;
        const topGeo = new THREE.BoxGeometry(topW, topH, topD);
        const topMesh = new THREE.Mesh(topGeo, baseMat);
        topMesh.position.y = baseH + topH / 2;
        topMesh.castShadow = true;
        topMesh.receiveShadow = true;
        bGroup.add(topMesh);

        // Rooftop features
        if (b.roofStyle === 'ANTENNA') {
          const spireGeo = new THREE.CylinderGeometry(0.1, 0.35, 7.0, 6);
          const spireMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.9 });
          const spire = new THREE.Mesh(spireGeo, spireMat);
          spire.position.y = b.height + 3.5;
          bGroup.add(spire);

          // Red aircraft warning beacon
          const beaconGeo = new THREE.SphereGeometry(0.25, 8, 8);
          const beaconMat = new THREE.MeshBasicMaterial({ color: 0xEF4444 });
          const beacon = new THREE.Mesh(beaconGeo, beaconMat);
          beacon.position.y = b.height + 7.1;
          bGroup.add(beacon);
        } else if (b.roofStyle === 'HELIPAD') {
          const padGeo = new THREE.CylinderGeometry(2.4, 2.4, 0.3, 16);
          const padMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.5 });
          const pad = new THREE.Mesh(padGeo, padMat);
          pad.position.y = b.height + 0.15;
          bGroup.add(pad);

          const ringGeo = new THREE.RingGeometry(1.6, 1.8, 16);
          const ringMat = new THREE.MeshBasicMaterial({ color: 0xFDE047, side: THREE.DoubleSide });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = -Math.PI / 2;
          ring.position.y = b.height + 0.32;
          bGroup.add(ring);
        }

      } else if (b.type === 'HOUSE') {
        // Low-rise suburban house with pitched roof
        const bodyGeo = new THREE.BoxGeometry(b.width, b.height, b.depth);
        const bodyMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(b.facadeColor),
          roughness: 0.7
        });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.position.y = b.height / 2;
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        bGroup.add(bodyMesh);

        // Triangular Pitched Roof (Cone / Prism)
        const roofGeo = new THREE.ConeGeometry(b.width * 0.75, 2.2, 4);
        const roofMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(b.roofColor),
          roughness: 0.8
        });
        const roofMesh = new THREE.Mesh(roofGeo, roofMat);
        roofMesh.rotation.y = Math.PI / 4;
        roofMesh.position.y = b.height + 1.1;
        roofMesh.castShadow = true;
        bGroup.add(roofMesh);

        // Chimney
        const chimGeo = new THREE.BoxGeometry(0.6, 1.5, 0.6);
        const chimMat = new THREE.MeshStandardMaterial({ color: 0x78350F });
        const chim = new THREE.Mesh(chimGeo, chimMat);
        chim.position.set(1.5, b.height + 1.6, 0.5);
        bGroup.add(chim);

      } else if (b.type === 'FACTORY' || b.type === 'SILO') {
        if (b.type === 'SILO') {
          // Cylindrical Grain/Chemical Silos
          const siloGeo = new THREE.CylinderGeometry(b.width * 0.45, b.width * 0.45, b.height, 16);
          const siloMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.8, roughness: 0.3 });
          const silo = new THREE.Mesh(siloGeo, siloMat);
          silo.position.y = b.height / 2;
          silo.castShadow = true;
          bGroup.add(silo);

          const capGeo = new THREE.SphereGeometry(b.width * 0.45, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
          const cap = new THREE.Mesh(capGeo, siloMat);
          cap.position.y = b.height;
          bGroup.add(cap);
        } else {
          // Industrial Factory with Smokestacks
          const fGeo = new THREE.BoxGeometry(b.width, b.height, b.depth);
          const fMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(b.facadeColor), roughness: 0.8 });
          const fMesh = new THREE.Mesh(fGeo, fMat);
          fMesh.position.y = b.height / 2;
          fMesh.castShadow = true;
          bGroup.add(fMesh);

          // Smokestacks
          [[-2, -2], [2, -2]].forEach(([sx, sz]) => {
            const stackGeo = new THREE.CylinderGeometry(0.5, 0.7, 5.0, 10);
            const stackMat = new THREE.MeshStandardMaterial({ color: 0x451A03, roughness: 0.9 });
            const stack = new THREE.Mesh(stackGeo, stackMat);
            stack.position.set(sx, b.height + 2.5, sz);
            stack.castShadow = true;
            bGroup.add(stack);
          });
        }

      } else if (b.type === 'HOSPITAL') {
        // Hospital with Red Cross Sign
        const hGeo = new THREE.BoxGeometry(b.width, b.height, b.depth);
        const hMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.3, metalness: 0.2 });
        const hMesh = new THREE.Mesh(hGeo, hMat);
        hMesh.position.y = b.height / 2;
        hMesh.castShadow = true;
        bGroup.add(hMesh);

        // 3D Red Cross on roof facade
        const crossH = new THREE.BoxGeometry(2.4, 0.7, 0.3);
        const crossV = new THREE.BoxGeometry(0.7, 2.4, 0.3);
        const crossMat = new THREE.MeshBasicMaterial({ color: 0xEF4444 });
        const c1 = new THREE.Mesh(crossH, crossMat);
        const c2 = new THREE.Mesh(crossV, crossMat);
        c1.position.set(0, b.height * 0.75, b.depth / 2 + 0.16);
        c2.position.set(0, b.height * 0.75, b.depth / 2 + 0.16);
        bGroup.add(c1);
        bGroup.add(c2);

      } else if (b.underConstruction) {
        // Active Construction Site with Tower Crane & Scaffolding
        const halfH = b.height * 0.45;
        const structGeo = new THREE.BoxGeometry(b.width * 0.9, halfH, b.depth * 0.9);
        const structMat = new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.9 });
        const structMesh = new THREE.Mesh(structGeo, structMat);
        structMesh.position.y = halfH / 2;
        bGroup.add(structMesh);

        // Scaffolding cage
        const scaffoldGeo = new THREE.BoxGeometry(b.width, b.height * 0.8, b.depth);
        const scaffoldWire = new THREE.WireframeGeometry(scaffoldGeo);
        const scaffoldLine = new THREE.LineSegments(scaffoldWire, new THREE.LineBasicMaterial({ color: 0xEAB308 }));
        scaffoldLine.position.y = (b.height * 0.8) / 2;
        bGroup.add(scaffoldLine);

        // Tower Crane (Yellow lattice mast + horizontal jib)
        const craneMastGeo = new THREE.BoxGeometry(0.6, b.height + 7, 0.6);
        const craneMat = new THREE.MeshStandardMaterial({ color: 0xFACC15, metalness: 0.7 });
        const mast = new THREE.Mesh(craneMastGeo, craneMat);
        mast.position.set(b.width / 2 + 1.0, (b.height + 7) / 2, 0);
        bGroup.add(mast);

        const jibGeo = new THREE.BoxGeometry(10, 0.5, 0.5);
        const jib = new THREE.Mesh(jibGeo, craneMat);
        jib.position.set(b.width / 2 + 1.0 + 3.0, b.height + 6.8, 0);
        bGroup.add(jib);

      } else {
        // Standard Modern Office / Apartment Block
        const bGeo = new THREE.BoxGeometry(b.width, b.height, b.depth);
        const bMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(b.facadeColor),
          roughness: 0.35,
          metalness: 0.5
        });
        const mesh = new THREE.Mesh(bGeo, bMat);
        mesh.position.y = b.height / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        bGroup.add(mesh);

        // Crisp architectural edges
        const edgeGeo = new THREE.EdgesGeometry(bGeo);
        const edgeLine = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0x334155 }));
        mesh.add(edgeLine);
      }

      scene.add(bGroup);
      buildingGroupMap.current.set(b.id, bGroup);
    });

    // --- 8. Mouse Orbit, Pan & Raycast Click Listeners ---
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
        orbitState.current.angleY = Math.max(0.08, Math.min(Math.PI / 2 - 0.05, orbitState.current.angleY + dy * 0.005));
      }

      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;
    };

    const onMouseUp = () => {
      orbitState.current.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      orbitState.current.distance = Math.max(14, Math.min(180, orbitState.current.distance + e.deltaY * 0.08));
      e.preventDefault();
    };

    const onClick = () => {
      if (!cameraRef.current) return;
      raycaster.setFromCamera(mouse, cameraRef.current);

      // Check click against vehicles first
      const vMeshes: THREE.Object3D[] = [];
      vehicleGroupMap.current.forEach(vG => {
        vG.traverse(child => { if ((child as THREE.Mesh).isMesh) vMeshes.push(child); });
      });
      const vHits = raycaster.intersectObjects(vMeshes);
      if (vHits.length > 0) {
        let curr: THREE.Object3D | null = vHits[0].object;
        while (curr && !curr.userData?.id) {
          curr = curr.parent;
        }
        if (curr?.userData?.id) {
          onSelectEntity('VEHICLE', curr.userData.id);
          return;
        }
      }

      // Check click against buildings
      const bMeshes: THREE.Object3D[] = [];
      buildingGroupMap.current.forEach(bG => {
        bG.traverse(child => { if ((child as THREE.Mesh).isMesh) bMeshes.push(child); });
      });
      const bHits = raycaster.intersectObjects(bMeshes);
      if (bHits.length > 0) {
        let curr: THREE.Object3D | null = bHits[0].object;
        while (curr && !curr.userData?.id) {
          curr = curr.parent;
        }
        if (curr?.userData?.id) {
          onSelectEntity('BUILDING', curr.userData.id);
        }
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('click', onClick);

    // --- 9. 60 FPS Render Loop ---
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Handle Camera Modes & Following
      const st = orbitState.current;
      if (cameraMode === 'TOP_DOWN') {
        camera.position.set(0, 115, 0.1);
        camera.lookAt(0, 0, 0);
      } else if (cameraMode === 'STREET_LEVEL') {
        camera.position.set(0, 3.0, 24);
        camera.lookAt(0, 3.0, -30);
      } else if (cameraMode === 'FOLLOW_VEHICLE' && selectedEntityId) {
        // Chase Cam behind selected vehicle
        const v = vehicles.find(item => item.id === selectedEntityId);
        if (v) {
          const camBack = 12;
          const camHeight = 6.5;
          const cx = v.x - Math.cos(v.angle) * camBack;
          const cz = v.z - Math.sin(v.angle) * camBack;
          camera.position.lerp(new THREE.Vector3(cx, camHeight, cz), 0.12);
          camera.lookAt(v.x, 1.2, v.z);
        } else {
          // Fallback to orbit if vehicle missing
          camera.position.x = st.target.x + st.distance * Math.sin(st.angleX) * Math.cos(st.angleY);
          camera.position.z = st.target.z + st.distance * Math.cos(st.angleX) * Math.cos(st.angleY);
          camera.position.y = st.target.y + st.distance * Math.sin(st.angleY);
          camera.lookAt(st.target);
        }
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

  // --- Dynamic Lighting & 24h Day/Night Sun Trajectory ---
  useEffect(() => {
    if (!sceneRef.current || !sunLightRef.current || !ambientLightRef.current || !hemiLightRef.current) return;

    const isDay = simulationTime >= 5.5 && simulationTime <= 19.5;
    const dayProgress = (simulationTime - 5.5) / 14.0;
    const sunAngle = dayProgress * Math.PI;

    if (isDay) {
      // Golden to bright day sun
      const sunHeight = Math.sin(sunAngle) * 110;
      const sunX = Math.cos(sunAngle) * 110;
      sunLightRef.current.position.set(sunX, Math.max(12, sunHeight), 50);
      sunLightRef.current.intensity = 1.35 * Math.sin(sunAngle);
      ambientLightRef.current.intensity = 0.45 + 0.3 * Math.sin(sunAngle);
      hemiLightRef.current.intensity = 0.4;
      sceneRef.current.background = new THREE.Color(0x0A1124);
      sceneRef.current.fog = new THREE.FogExp2(0x0A1124, 0.005);
    } else {
      // Midnight Cyber Atmosphere
      sunLightRef.current.intensity = 0.12;
      ambientLightRef.current.intensity = 0.22;
      hemiLightRef.current.intensity = 0.25;
      sceneRef.current.background = new THREE.Color(0x04060B);
      sceneRef.current.fog = new THREE.FogExp2(0x04060B, 0.0065);
    }
  }, [simulationTime]);

  // --- Dynamic Traffic Signal Lighting ---
  useEffect(() => {
    intersections.forEach(inter => {
      const lenses = trafficLightLenses.current.get(inter.id);
      if (lenses) {
        if (inter.signalState === 'NS_GREEN') {
          (lenses.green.material as THREE.MeshBasicMaterial).color.setHex(0x10B981);
          (lenses.red.material as THREE.MeshBasicMaterial).color.setHex(0x334155);
        } else {
          (lenses.green.material as THREE.MeshBasicMaterial).color.setHex(0x334155);
          (lenses.red.material as THREE.MeshBasicMaterial).color.setHex(0xEF4444);
        }
      }
    });
  }, [intersections]);

  // --- Dynamic 3D Vehicles (Sedans, SUVs, Buses, Trucks, Emergency Fire Engines) ---
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    vehicles.forEach(v => {
      let vGroup = vehicleGroupMap.current.get(v.id);
      if (!vGroup) {
        vGroup = new THREE.Group();
        vGroup.userData = { type: 'VEHICLE', id: v.id };

        if (v.type === 'BUS') {
          // Transit Bus (Longer, dual windshield)
          const busGeo = new THREE.BoxGeometry(4.2, 1.4, 1.6);
          const busMat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, roughness: 0.3, metalness: 0.6 });
          const busBody = new THREE.Mesh(busGeo, busMat);
          busBody.position.y = 0.75;
          vGroup.add(busBody);

          // Glass strip
          const glassGeo = new THREE.BoxGeometry(3.9, 0.45, 1.65);
          const glassMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.1 });
          const glass = new THREE.Mesh(glassGeo, glassMat);
          glass.position.y = 0.95;
          vGroup.add(glass);

        } else if (v.type === 'FIRE_TRUCK') {
          // Fire Engine (Red, top ladder, emergency flashers)
          const fireGeo = new THREE.BoxGeometry(3.8, 1.5, 1.55);
          const fireMat = new THREE.MeshStandardMaterial({ color: 0xEF4444, roughness: 0.2, metalness: 0.7 });
          const fireBody = new THREE.Mesh(fireGeo, fireMat);
          fireBody.position.y = 0.8;
          vGroup.add(fireBody);

          // Top rescue ladder
          const ladderGeo = new THREE.BoxGeometry(2.8, 0.18, 0.7);
          const ladderMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.9 });
          const ladder = new THREE.Mesh(ladderGeo, ladderMat);
          ladder.position.set(0, 1.65, 0);
          vGroup.add(ladder);

          // Dual red/blue strobe beacons
          const redB = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.3), new THREE.MeshBasicMaterial({ color: 0xEF4444 }));
          redB.position.set(1.2, 1.65, 0.4);
          vGroup.add(redB);
          const blueB = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.3), new THREE.MeshBasicMaterial({ color: 0x3B82F6 }));
          blueB.position.set(1.2, 1.65, -0.4);
          vGroup.add(blueB);

        } else if (v.type === 'TRUCK') {
          // Delivery Semi / Box Truck
          const cabGeo = new THREE.BoxGeometry(1.4, 1.2, 1.5);
          const cabMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(v.color), roughness: 0.3 });
          const cab = new THREE.Mesh(cabGeo, cabMat);
          cab.position.set(0.9, 0.65, 0);
          vGroup.add(cab);

          const boxGeo = new THREE.BoxGeometry(2.4, 1.5, 1.5);
          const boxMat = new THREE.MeshStandardMaterial({ color: 0xCBD5E1, roughness: 0.6 });
          const box = new THREE.Mesh(boxGeo, boxMat);
          box.position.set(-0.8, 0.85, 0);
          vGroup.add(box);

        } else {
          // Passenger Sedan / SUV
          const carGeo = new THREE.BoxGeometry(2.0, 0.7, 1.1);
          const carMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(v.color),
            roughness: 0.25,
            metalness: 0.75
          });
          const carBody = new THREE.Mesh(carGeo, carMat);
          carBody.position.y = 0.42;
          vGroup.add(carBody);

          // Cabin windshield
          const cabinGeo = new THREE.BoxGeometry(1.0, 0.45, 0.95);
          const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.1 });
          const cabin = new THREE.Mesh(cabinGeo, cabinMat);
          cabin.position.set(-0.1, 0.85, 0);
          vGroup.add(cabin);

          // Headlights
          const hlGeo = new THREE.SphereGeometry(0.08, 6, 6);
          const hlMat = new THREE.MeshBasicMaterial({ color: 0xFEF08A });
          const hlLeft = new THREE.Mesh(hlGeo, hlMat);
          hlLeft.position.set(1.0, 0.4, 0.35);
          const hlRight = new THREE.Mesh(hlGeo, hlMat);
          hlRight.position.set(1.0, 0.4, -0.35);
          vGroup.add(hlLeft);
          vGroup.add(hlRight);
        }

        scene.add(vGroup);
        vehicleGroupMap.current.set(v.id, vGroup);
      }

      // Update position & rotation
      vGroup.position.set(v.x, 0.05, v.z);
      vGroup.rotation.y = -v.angle;
    });
  }, [vehicles]);

  // --- Dynamic Pedestrian Dots/Figures ---
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !pedestrians.length) return;

    pedestrians.forEach(ped => {
      let pGroup = pedestrianGroupMap.current.get(ped.id);
      if (!pGroup) {
        pGroup = new THREE.Group();
        // Stylized pedestrian capsule
        const bodyGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.65, 6);
        const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(ped.color), roughness: 0.5 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.45;
        pGroup.add(body);

        const headGeo = new THREE.SphereGeometry(0.15, 6, 6);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xFDE047 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 0.9;
        pGroup.add(head);

        scene.add(pGroup);
        pedestrianGroupMap.current.set(ped.id, pGroup);
      }

      pGroup.position.set(ped.x, 0.08, ped.z);
    });
  }, [pedestrians]);

  // --- Dynamic Visual Overlays ---
  useEffect(() => {
    // 1. Traffic Congestion Overlay
    roads.forEach(r => {
      const mesh = roadMeshMap.current.get(r.id);
      if (mesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (overlayMode === 'TRAFFIC') {
          if (r.isClosed) mat.color.setHex(0x7F1D1D); // deep red closed
          else if (r.density > 0.5) mat.color.setHex(0xEF4444); // red bottleneck
          else if (r.density > 0.2) mat.color.setHex(0xF59E0B); // amber medium
          else mat.color.setHex(0x10B981); // green free flow
        } else {
          mat.color.setHex(r.isClosed ? 0x450A0A : 0x161D2B);
        }
      }
    });

    // 2. Power / Zoning Overlays on Buildings
    buildings.forEach(b => {
      const group = buildingGroupMap.current.get(b.id);
      if (group) {
        group.traverse(child => {
          if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (overlayMode === 'POWER') {
              mat.color.setHex(b.powerSupplied ? 0x2563EB : 0x1E293B);
            } else if (overlayMode === 'ZONING') {
              if (b.zone === 'COMMERCIAL') mat.color.setHex(0x8B5CF6);
              else if (b.zone === 'RESIDENTIAL') mat.color.setHex(0x10B981);
              else if (b.zone === 'INDUSTRIAL') mat.color.setHex(0xF59E0B);
              else if (b.zone === 'PARK') mat.color.setHex(0x15803D);
              else mat.color.setHex(0x06B6D4);
            } else if (b.onFire) {
              mat.color.setHex(0xDC2626); // active fire alert
            }
          }
        });
      }
    });
  }, [overlayMode, roads, buildings]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
