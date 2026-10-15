import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Building2, 
  Send, 
  Terminal, 
  ShieldCheck, 
  Zap, 
  Cpu, 
  Eye, 
  Radio, 
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { Task, Project } from '../types';

interface AgentCity3DProps {
  project: Project | null;
  tasks: Task[];
  isEmergencyStopped: boolean;
}

interface BuildingInfo {
  role: string;
  name: string;
  title: string;
  color: number;
  hexColor: string;
  position: [number, number, number];
  size: [number, number, number];
  description: string;
  currentDirective: string;
}

const DISTRICT_BUILDINGS: BuildingInfo[] = [
  {
    role: 'orchestrator',
    name: 'Citadel Spire',
    title: 'Master Orchestrator',
    color: 0x3B82F6,
    hexColor: '#3B82F6',
    position: [0, 6, 0],
    size: [4, 12, 4],
    description: 'Central Command Spire. Coordinates task DAG scheduling, state transitions, and retry supervision.',
    currentDirective: 'Maintaining project DAG continuity and enforcing verification invariants.'
  },
  {
    role: 'product_analyst',
    name: 'Intelligence Tower',
    title: 'Product Analyst',
    color: 0x8B5CF6,
    hexColor: '#8B5CF6',
    position: [-14, 4.5, -12],
    size: [3.5, 9, 3.5],
    description: 'Requirements synthesis matrix. Extracts PRD, user stories, and acceptance criteria.',
    currentDirective: 'Deconstructing user goals into formal testable criteria.'
  },
  {
    role: 'software_architect',
    name: 'Blueprint Complex',
    title: 'Software Architect',
    color: 0x06B6D4,
    hexColor: '#06B6D4',
    position: [14, 5, -12],
    size: [3.8, 10, 3.8],
    description: 'System modularity center. Designs data schemas, API contracts, and DAG dependencies.',
    currentDirective: 'Validating interface boundaries and task dependency topologies.'
  },
  {
    role: 'implementation_agent',
    name: 'Fabrication Foundry',
    title: 'Implementation Agent',
    color: 0x10B981,
    hexColor: '#10B981',
    position: [-16, 4, 10],
    size: [4.2, 8, 4.2],
    description: 'Kinetic Code Forge. Synthesizes source files and performs bounded refactoring within the sandbox.',
    currentDirective: 'Executing code generation in isolated git workspace.'
  },
  {
    role: 'testing_agent',
    name: 'Quality Bastion',
    title: 'Testing Agent',
    color: 0x22C55E,
    hexColor: '#22C55E',
    position: [16, 4, 10],
    size: [3.6, 8, 3.6],
    description: 'Verification fortress. Generates and executes automated test suites with real observable metrics.',
    currentDirective: 'Supervising test suites and parsing exit codes.'
  },
  {
    role: 'debugging_agent',
    name: 'Diagnostic Lab',
    title: 'Debugging Agent',
    color: 0xF59E0B,
    hexColor: '#F59E0B',
    position: [-8, 3.5, 18],
    size: [3.5, 7, 3.5],
    description: 'Automated repair laboratory. Diagnoses stack traces and applies targeted self-healing patches.',
    currentDirective: 'Standing by to intercept test failures and synthesize patches.'
  },
  {
    role: 'independent_reviewer',
    name: 'Security Citadel',
    title: 'Independent Reviewer',
    color: 0xEF4444,
    hexColor: '#EF4444',
    position: [8, 4.5, 18],
    size: [3.5, 9, 3.5],
    description: 'Security & Quality gatekeeper. Evaluates git diffs, vulnerability risks, and acceptance compliance.',
    currentDirective: 'Auditing commit diffs against security policies.'
  },
  {
    role: 'documentation_agent',
    name: 'Archive Monolith',
    title: 'Documentation Agent',
    color: 0x6366F1,
    hexColor: '#6366F1',
    position: [0, 4, -20],
    size: [3.2, 8, 3.2],
    description: 'Knowledge repository. Maintains architectural records, setup instructions, and release notes.',
    currentDirective: 'Synchronizing project memory and architectural decisions.'
  }
];

export const AgentCity3D: React.FC<AgentCity3DProps> = ({ project, tasks, isEmergencyStopped }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo>(DISTRICT_BUILDINGS[0]);
  const [directiveInput, setDirectiveInput] = useState('');
  const [commsLog, setCommsLog] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: 'CITADEL [Orchestrator]',
      text: 'Chief Architect detected on holographic bridge. All 8 district towers operational and awaiting your directives.',
      time: '08:50:00'
    }
  ]);

  const handleSendDirective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directiveInput.trim()) return;

    const userMsg = directiveInput.trim();
    const now = new Date().toLocaleTimeString();

    setCommsLog((prev) => [
      ...prev,
      { sender: 'YOU [Chief Architect]', text: userMsg, time: now },
      {
        sender: `${selectedBuilding.name.toUpperCase()} [${selectedBuilding.title}]`,
        text: `Directive received and acknowledged: "${userMsg}". Re-aligning district operational parameters to comply with your guidance.`,
        time: new Date().toLocaleTimeString()
      }
    ]);
    setDirectiveInput('');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06080E);
    scene.fog = new THREE.FogExp2(0x06080E, 0.018);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 36, 48);
    camera.lookAt(0, 4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0x1E293B, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x60A5FA, 1.5);
    dirLight.position.set(30, 60, 20);
    scene.add(dirLight);

    const underGlow = new THREE.PointLight(0x3B82F6, 2, 50);
    underGlow.position.set(0, 2, 0);
    scene.add(underGlow);

    // --- Cyber City Ground Grid ---
    const gridHelper = new THREE.GridHelper(100, 50, 0x3B82F6, 0x1E293B);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Ground plane with reflections
    const groundGeo = new THREE.PlaneGeometry(120, 120);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x070A11,
      roughness: 0.8,
      metalness: 0.5
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    scene.add(ground);

    // --- District Skyscraper Towers ---
    const buildingMeshes: { mesh: THREE.Mesh; info: BuildingInfo; ring: THREE.Mesh }[] = [];

    DISTRICT_BUILDINGS.forEach((b) => {
      // Main Skyscraper body
      const geo = new THREE.BoxGeometry(...b.size);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x0E1422,
        roughness: 0.2,
        metalness: 0.8,
        emissive: b.color,
        emissiveIntensity: 0.15
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...b.position);
      mesh.userData = { buildingInfo: b };
      scene.add(mesh);

      // Glowing Neon Edges
      const edges = new THREE.EdgesGeometry(geo);
      const lineMat = new THREE.LineBasicMaterial({ color: b.color, linewidth: 2 });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      mesh.add(wireframe);

      // Rooftop Energy Ring / Hologram
      const ringGeo = new THREE.TorusGeometry(b.size[0] * 0.45, 0.12, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: b.color });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = b.size[1] / 2 + 0.6;
      mesh.add(ring);

      // Light beam from top
      const beamGeo = new THREE.CylinderGeometry(0.08, 0.4, 15, 8);
      const beamMat = new THREE.MeshBasicMaterial({
        color: b.color,
        transparent: true,
        opacity: 0.25
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = b.size[1] / 2 + 7.5;
      mesh.add(beam);

      buildingMeshes.push({ mesh, info: b, ring });
    });

    // --- Background Ambient City Buildings ---
    const bgBoxGeo = new THREE.BoxGeometry(2, 6, 2);
    const bgMat = new THREE.MeshStandardMaterial({
      color: 0x090D16,
      roughness: 0.9,
      metalness: 0.3
    });

    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const dist = 32 + (i % 5) * 4;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const height = 4 + (i % 6) * 3;

      const bgMesh = new THREE.Mesh(new THREE.BoxGeometry(2.5, height, 2.5), bgMat);
      bgMesh.position.set(x, height / 2, z);
      scene.add(bgMesh);
    }

    // --- Airborne Data Drone Particles (Moving along highway) ---
    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 45;
      positions[i * 3 + 1] = 1 + Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 45;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00F0FF,
      size: 0.6,
      transparent: true,
      opacity: 0.8
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // --- Mouse Orbit & Raycasting Interaction ---
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotationAngle = 0;
    let targetCameraY = 36;
    let cameraDistance = 58;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        rotationAngle -= deltaX * 0.005;
        targetCameraY = Math.max(10, Math.min(60, targetCameraY - deltaY * 0.08));
      }

      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      cameraDistance = Math.max(25, Math.min(85, cameraDistance + e.deltaY * 0.04));
      e.preventDefault();
    };

    const onClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(buildingMeshes.map(b => b.mesh));
      if (intersects.length > 0) {
        const hitBuilding = intersects[0].object.userData.buildingInfo as BuildingInfo;
        if (hitBuilding) {
          setSelectedBuilding(hitBuilding);
        }
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('click', onClick);

    // --- Animation Loop ---
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Camera positioning (smooth orbit)
      if (!isDragging) {
        rotationAngle += 0.0012; // gentle auto-spin
      }
      camera.position.x = Math.sin(rotationAngle) * cameraDistance;
      camera.position.z = Math.cos(rotationAngle) * cameraDistance;
      camera.position.y = targetCameraY;
      camera.lookAt(0, 4, 0);

      // Rotate rooftop rings
      buildingMeshes.forEach((b, idx) => {
        b.ring.rotation.z = elapsedTime * (0.8 + idx * 0.1);
      });

      // Animate drone particles
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        let z = posAttr.getY(i);
        z += 0.05;
        if (z > 12) z = 1;
        posAttr.setY(i, z);
      }
      posAttr.needsUpdate = true;

      // Emergency stop alarm pulse
      if (scene.fog) {
        if (isEmergencyStopped) {
          scene.fog.color.setHex(0x280508);
        } else {
          scene.fog.color.setHex(0x06080E);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
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
  }, [isEmergencyStopped]);

  return (
    <div className="relative w-full h-[calc(100vh-65px)] overflow-hidden bg-[#06080E]">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top HUD: City Status & Control Controls */}
      <div className="absolute top-4 left-6 right-6 flex items-center justify-between pointer-events-none">
        <div className="bg-[#0B0F19]/90 backdrop-blur border border-slate-800 px-4 py-2.5 rounded-lg shadow-xl pointer-events-auto flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
              <span>FORGE AGENT METROPOLIS</span>
              <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                OVERSEER COMMAND
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Orbit: Drag mouse &bull; Zoom: Scroll wheel &bull; Select: Click any skyscraper
            </div>
          </div>
        </div>

        <div className="bg-[#0B0F19]/90 backdrop-blur border border-slate-800 px-4 py-2.5 rounded-lg shadow-xl pointer-events-auto text-xs font-mono flex items-center gap-4">
          <div className="text-slate-400">
            Active Project: <span className="text-blue-400 font-bold">{project ? project.name : 'Standby'}</span>
          </div>
          <div className="text-slate-400">
            Agents Deployed: <span className="text-emerald-400 font-bold">8 Operational</span>
          </div>
        </div>
      </div>

      {/* Bottom Panel: Director Direct Communication Console & Agent Focus */}
      <div className="absolute bottom-6 left-6 right-6 grid grid-cols-1 lg:grid-cols-3 gap-6 pointer-events-none">
        {/* Selected Tower Focus Card */}
        <div className="forge-card p-5 bg-[#0C101C]/95 backdrop-blur border border-slate-800 pointer-events-auto shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full shadow" 
                  style={{ backgroundColor: selectedBuilding.hexColor, boxShadow: `0 0 10px ${selectedBuilding.hexColor}` }} 
                />
                <h3 className="text-sm font-bold text-slate-100">{selectedBuilding.name}</h3>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  {selectedBuilding.title}
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
                ONLINE
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {selectedBuilding.description}
            </p>

            <div className="bg-[#06080F] p-3 rounded border border-slate-800/80 text-xs font-mono space-y-1">
              <div className="text-slate-500 uppercase text-[10px]">Active Directive:</div>
              <div className="text-blue-400">{selectedBuilding.currentDirective}</div>
            </div>
          </div>

          <div className="pt-3 text-[11px] font-mono text-slate-500 flex justify-between">
            <span>District Sector: 0x{selectedBuilding.role.slice(0, 4)}</span>
            <span style={{ color: selectedBuilding.hexColor }}>Focus Locked</span>
          </div>
        </div>

        {/* Director Comms Terminal (Talk directly to your agents) */}
        <div className="lg:col-span-2 forge-card p-5 bg-[#0A0D18]/95 backdrop-blur border border-slate-800 pointer-events-auto shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Radio className="text-blue-400 animate-pulse" size={15} />
                <span>DIRECTOR HOLOGRAPHIC COMMS CHANNEL</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Target: <span style={{ color: selectedBuilding.hexColor }} className="font-bold">{selectedBuilding.title}</span>
              </span>
            </div>

            {/* Comms Log */}
            <div className="bg-[#05070D] p-3 rounded border border-slate-800 text-xs font-mono space-y-2 h-28 overflow-y-auto">
              {commsLog.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  <span className="text-slate-500 text-[10px] mr-2">[{log.time}]</span>
                  <span className={log.sender.includes('YOU') ? 'text-violet-400 font-bold' : 'text-blue-400 font-bold'}>
                    {log.sender}:
                  </span>
                  <span className="text-slate-200 ml-1.5">{log.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Directive Input Form */}
          <form onSubmit={handleSendDirective} className="flex items-center gap-2 pt-3">
            <input
              type="text"
              placeholder={`Issue direct guidance to ${selectedBuilding.title}... (e.g. Focus on zero-downtime database migrations)`}
              className="flex-1 bg-[#121726] border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              value={directiveInput}
              onChange={(e) => setDirectiveInput(e.target.value)}
            />
            <button
              type="submit"
              className="glow-btn flex items-center gap-1.5 text-xs py-2 px-4"
            >
              <Send size={13} />
              <span>Broadcast Directive</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
