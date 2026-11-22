<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import * as THREE from 'three';
import { useTheme } from '../../composables/useTheme';
import type { ThemeRealm } from '../../types/portfolio';
import {
  computeCameraParallaxTarget,
  computePulseDisplacement,
  createInteractivePulse,
  dampValue,
  generateConstellationSegments,
  getRealmScenePalette,
  type InteractivePulseState,
  type ParticleNode3D,
} from '../../utils/threeBackgroundLogic';

const props = defineProps<{
  locked?: boolean;
}>();

const { realm } = useTheme();

const containerRef = ref<HTMLDivElement | null>(null);
const activePulseType = ref<string>('none');
const pulseCount = ref<number>(0);
const webglReady = ref<boolean>(false);

// Cleanup & runtime references
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let frameId = 0;
let isSoftwareGl = false;
let isDisposed = false;

// Scene groups for each realm
let coreGroup: THREE.Group | null = null;
let voidGroup: THREE.Group | null = null;

// Core (Turquoise - Armored Core Tactical HUD) objects
let coreNodes: ParticleNode3D[] = [];
let corePointsGeometry: THREE.BufferGeometry | null = null;
let corePointsMaterial: THREE.ShaderMaterial | null = null;
let coreTelemetryLinesGeometry: THREE.BufferGeometry | null = null;
let coreTelemetryLinesMaterial: THREE.LineBasicMaterial | null = null;
let coreRadarGroup: THREE.Group | null = null;
let coreScanLineMesh: THREE.Line | null = null;
let coreCursorReticle: THREE.Group | null = null;

// Void (Purple - Outer Space Cosmos) objects
let voidStars: ParticleNode3D[] = [];
let voidStarsGeometry: THREE.BufferGeometry | null = null;
let voidStarsMaterial: THREE.ShaderMaterial | null = null;
let voidConstellationLines: THREE.LineSegments | null = null;
let voidNebulaGroup: THREE.Group | null = null;

interface MeteorInstance {
  line: THREE.Line;
  headX: number;
  headY: number;
  headZ: number;
  vx: number;
  vy: number;
  vz: number;
  length: number;
  age: number;
  maxAge: number;
  active: boolean;
}
let voidMeteors: MeteorInstance[] = [];
let meteorSpawnTimer = 0;

// Interactive Click Pulses (3D meshes + physics state)
interface VisualPulseInstance {
  state: InteractivePulseState;
  group: THREE.Group;
  outerRing: THREE.LineLoop;
  innerRing: THREE.LineLoop;
  crosshair?: THREE.LineSegments;
}
let activePulses: VisualPulseInstance[] = [];
let nextPulseId = 1;

// Pre-allocated input & math state (Zero GC in render loop)
const pointerNorm = { x: 0, y: 0, active: false };
const pointerWorld = new THREE.Vector3(0, 0, 0);
const raycastVec = new THREE.Vector3();
const raycastDir = new THREE.Vector3();
let currentScrollY = 0;
let lastFrameTime = 0;

// Track disposable resources
const geometriesToDispose: THREE.BufferGeometry[] = [];
const materialsToDispose: THREE.Material[] = [];
const texturesToDispose: THREE.Texture[] = [];

function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return true;
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function trackGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geometriesToDispose.push(geo);
  return geo;
}

function trackMat<T extends THREE.Material>(mat: T): T {
  materialsToDispose.push(mat);
  return mat;
}

function trackTex<T extends THREE.Texture>(tex: T): T {
  texturesToDispose.push(tex);
  return tex;
}

/**
 * Creates a procedural radial nebula CanvasTexture for the Purple ('void') cosmos mode.
 */
function createProceduralNebulaTexture(innerColor: string, midColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 6, 128, 128, 128);
    grad.addColorStop(0, innerColor);
    grad.addColorStop(0.42, midColor);
    grad.addColorStop(1, 'rgba(9, 5, 18, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const texture = trackTex(new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Helper to create a segmented or dashed circle LineLoop in 3D space.
 */
function createCircleLineGeometry(radius: number, segments = 64): THREE.BufferGeometry {
  const pts: number[] = [];
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    pts.push(Math.cos(theta) * radius, Math.sin(theta) * radius, 0);
  }
  const geo = trackGeo(new THREE.BufferGeometry());
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return geo;
}

/**
 * Builds the Turquoise ('core') Armored Core / Cyber Tech Tactical 3D HUD Group.
 */
function buildCoreTacticalRealm(): THREE.Group {
  const group = new THREE.Group();
  const palette = getRealmScenePalette('core');

  // 1. Tactical Topographic Perspective Floor & Ceiling Grids
  const gridVertices: number[] = [];
  const gridSpan = 75;
  const gridStep = 5;
  const floorY = -20;
  const ceilingY = 22;

  for (let x = -gridSpan; x <= gridSpan; x += gridStep) {
    // Floor longitudinal lines
    gridVertices.push(x, floorY, -60, x, floorY, 20);
    // Ceiling subtle longitudinal lines
    if (x % 10 === 0) {
      gridVertices.push(x, ceilingY, -60, x, ceilingY, 10);
    }
  }
  for (let z = -60; z <= 20; z += gridStep) {
    // Floor latitudinal lines
    gridVertices.push(-gridSpan, floorY, z, gridSpan, floorY, z);
  }

  const gridGeo = trackGeo(new THREE.BufferGeometry());
  gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridVertices, 3));
  const gridMat = trackMat(
    new THREE.LineBasicMaterial({
      color: new THREE.Color(palette.secondaryHex),
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const gridSegments = new THREE.LineSegments(gridGeo, gridMat);
  group.add(gridSegments);

  // Horizontal Radar Scanline sweeping across the tactical floor grid
  const scanGeo = trackGeo(new THREE.BufferGeometry());
  scanGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([-gridSpan, floorY + 0.08, 0, gridSpan, floorY + 0.08, 0], 3),
  );
  const scanMat = trackMat(
    new THREE.LineBasicMaterial({
      color: new THREE.Color(palette.primaryHex),
      transparent: true,
      opacity: 0.48,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  coreScanLineMesh = new THREE.Line(scanGeo, scanMat);
  group.add(coreScanLineMesh);

  // 2. Armored Core Central Radar Gyroscope & HUD Telemetry Rings
  coreRadarGroup = new THREE.Group();
  coreRadarGroup.position.set(0, 0, -14);

  const outerRingMat = trackMat(
    new THREE.LineBasicMaterial({
      color: new THREE.Color(palette.primaryHex),
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const outerRing = new THREE.LineLoop(createCircleLineGeometry(22, 72), outerRingMat);
  coreRadarGroup.add(outerRing);

  const midRingMat = trackMat(
    new THREE.LineBasicMaterial({
      color: new THREE.Color(palette.secondaryHex),
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const midRing = new THREE.LineLoop(createCircleLineGeometry(15.5, 48), midRingMat);
  midRing.rotation.x = 0.28;
  coreRadarGroup.add(midRing);

  // Segmented Radar Tick Marks & Corner Brackets
  const ticksVertices: number[] = [];
  const tickCount = 36;
  for (let i = 0; i < tickCount; i++) {
    const angle = (i / tickCount) * Math.PI * 2;
    const innerR = i % 3 === 0 ? 17.5 : 18.2;
    const outerR = 19.0;
    ticksVertices.push(
      Math.cos(angle) * innerR,
      Math.sin(angle) * innerR,
      0,
      Math.cos(angle) * outerR,
      Math.sin(angle) * outerR,
      0,
    );
  }
  // HUD Corner framing brackets
  const bSize = 25;
  const bLen = 4.5;
  const corners = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  for (const [cx, cy] of corners) {
    ticksVertices.push(
      cx * bSize,
      cy * bSize,
      0,
      cx * (bSize - bLen),
      cy * bSize,
      0,
      cx * bSize,
      cy * bSize,
      0,
      cx * bSize,
      cy * (bSize - bLen),
      0,
    );
  }

  const ticksGeo = trackGeo(new THREE.BufferGeometry());
  ticksGeo.setAttribute('position', new THREE.Float32BufferAttribute(ticksVertices, 3));
  const ticksMat = trackMat(
    new THREE.LineBasicMaterial({
      color: new THREE.Color(palette.primaryHex),
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  coreRadarGroup.add(new THREE.LineSegments(ticksGeo, ticksMat));
  group.add(coreRadarGroup);

  // 3. 3D Cursor Target Reticle (follows cursor gently in Turquoise mode)
  coreCursorReticle = new THREE.Group();
  const reticleRing = new THREE.LineLoop(
    createCircleLineGeometry(1.85, 24),
    trackMat(
      new THREE.LineBasicMaterial({
        color: new THREE.Color(palette.primaryHex),
        transparent: true,
        opacity: 0.38,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ),
  );
  const reticleCrossGeo = trackGeo(new THREE.BufferGeometry());
  reticleCrossGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [-2.6, 0, 0, -1.1, 0, 0, 1.1, 0, 0, 2.6, 0, 0, 0, -2.6, 0, 0, -1.1, 0, 0, 1.1, 0, 0, 2.6, 0],
      3,
    ),
  );
  const reticleCross = new THREE.LineSegments(reticleCrossGeo, reticleRing.material);
  coreCursorReticle.add(reticleRing, reticleCross);
  coreCursorReticle.visible = false;
  group.add(coreCursorReticle);

  // 4. Tactical Telemetry Nodes (3D Point Cloud with custom HUD Diamond/Crosshair Shader)
  const count = palette.particleCount;
  coreNodes = [];
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  const colorCandidates = [
    new THREE.Color(palette.primaryHex),
    new THREE.Color(palette.secondaryHex),
    new THREE.Color(palette.highlightHex),
  ];

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 86;
    const y = (Math.random() - 0.5) * 54;
    const z = (Math.random() - 0.5) * 44 - 6;
    const size = 5.5 + Math.random() * 6.5;
    const phase = Math.random() * Math.PI * 2;
    const colorIndex = i % colorCandidates.length;

    coreNodes.push({
      x,
      y,
      z,
      baseX: x,
      baseY: y,
      baseZ: z,
      vx: (Math.random() - 0.5) * 2.2,
      vy: (Math.random() - 0.5) * 1.8,
      vz: (Math.random() - 0.5) * 1.2,
      size,
      phase,
      colorIndex,
    });

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    sizes[i] = size;
    phases[i] = phase;

    const c = colorCandidates[colorIndex];
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  corePointsGeometry = trackGeo(new THREE.BufferGeometry());
  corePointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  corePointsGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  corePointsGeometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  corePointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  corePointsMaterial = trackMat(
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2) },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vPhase;
        uniform float uTime;
        uniform float uPixelRatio;

        void main() {
          vColor = color;
          vPhase = aPhase;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float pulse = 0.88 + 0.24 * sin(uTime * 2.6 + aPhase);
          gl_PointSize = clamp(aSize * pulse * uPixelRatio * (38.0 / max(-mvPosition.z, 8.0)), 3.0, 26.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vPhase;
        uniform float uTime;

        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          // Manhattan distance creates a sharp Armored Core tactical diamond marker
          float diamond = abs(uv.x) + abs(uv.y);
          if (diamond > 0.5) discard;

          // Hollow tactical reticle ring + bright core pip
          float corePip = smoothstep(0.18, 0.04, diamond);
          float outerRim = smoothstep(0.5, 0.38, diamond) * smoothstep(0.24, 0.34, diamond);
          float crossLine = (smoothstep(0.045, 0.01, abs(uv.x)) + smoothstep(0.045, 0.01, abs(uv.y))) * 0.35;

          float alpha = clamp(corePip + outerRim * 0.85 + crossLine, 0.0, 1.0) * 0.78;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );

  const pointsMesh = new THREE.Points(corePointsGeometry, corePointsMaterial);
  group.add(pointsMesh);

  // 5. Dynamic Telemetry Vector Connections (LineSegments updated per frame)
  const maxSegments = 360;
  const linePositions = new Float32Array(maxSegments * 6);
  coreTelemetryLinesGeometry = trackGeo(new THREE.BufferGeometry());
  coreTelemetryLinesGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage),
  );
  coreTelemetryLinesGeometry.setDrawRange(0, 0);

  coreTelemetryLinesMaterial = trackMat(
    new THREE.LineBasicMaterial({
      color: new THREE.Color(palette.secondaryHex),
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );

  const telemetryLines = new THREE.LineSegments(
    coreTelemetryLinesGeometry,
    coreTelemetryLinesMaterial,
  );
  group.add(telemetryLines);

  return group;
}

/**
 * Builds the Purple ('void') Outer Space / Cosmic Starfield, Nebulas, Constellations & Meteors Group.
 */
function buildVoidCosmicRealm(): THREE.Group {
  const group = new THREE.Group();
  const palette = getRealmScenePalette('void');

  // 1. Deep Space Multi-Layer Starfield with Twinkle & Diffraction Spike Shader
  const count = palette.particleCount;
  voidStars = [];
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  const starColors = [
    new THREE.Color('#f3efe6'), // Stellar parchment white
    new THREE.Color('#b366ff'), // Radiant amethyst
    new THREE.Color('#c9a84c'), // Astral Elden gold
    new THREE.Color('#d8b4fe'), // Soft lavender star
    new THREE.Color('#9724d1'), // Deep cosmic violet
  ];

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 125;
    const y = (Math.random() - 0.5) * 85;
    const z = (Math.random() - 0.5) * 75 - 12;
    // First 90 stars are brighter guide stars for constellations
    const isGuideStar = i < 90;
    const size = isGuideStar ? 7.5 + Math.random() * 6.5 : 3.0 + Math.random() * 5.8;
    const phase = Math.random() * Math.PI * 2;
    const colorIndex = isGuideStar ? i % 3 : i % starColors.length;

    voidStars.push({
      x,
      y,
      z,
      baseX: x,
      baseY: y,
      baseZ: z,
      vx: (Math.random() - 0.5) * 0.25,
      vy: 0.12 + Math.random() * 0.25,
      vz: (Math.random() - 0.5) * 0.15,
      size,
      phase,
      colorIndex,
    });

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    sizes[i] = size;
    phases[i] = phase;

    const c = starColors[colorIndex];
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  voidStarsGeometry = trackGeo(new THREE.BufferGeometry());
  voidStarsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  voidStarsGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  voidStarsGeometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  voidStarsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  voidStarsMaterial = trackMat(
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2) },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vTwinkle;
        uniform float uTime;
        uniform float uPixelRatio;

        void main() {
          vColor = color;
          float twinkle = 0.62 + 0.38 * sin(uTime * 1.85 + aPhase * 3.0);
          vTwinkle = twinkle;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = clamp(aSize * (0.8 + 0.3 * twinkle) * uPixelRatio * (42.0 / max(-mvPosition.z, 10.0)), 2.0, 28.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vTwinkle;

        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float dist = length(uv);
          if (dist > 0.5) discard;

          // Glowing star core + 4-point celestial spike
          float core = exp(-dist * 7.5);
          float spikeX = exp(-abs(uv.y) * 26.0) * exp(-abs(uv.x) * 6.0);
          float spikeY = exp(-abs(uv.x) * 26.0) * exp(-abs(uv.y) * 6.0);
          float starGlow = clamp(core + (spikeX + spikeY) * 0.45, 0.0, 1.0);

          gl_FragColor = vec4(vColor, starGlow * vTwinkle * 0.88);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );

  const starsMesh = new THREE.Points(voidStarsGeometry, voidStarsMaterial);
  group.add(starsMesh);

  // 2. Astral Constellations connecting guide stars in 3D space
  const constellationCoords = generateConstellationSegments(positions, 85, 6.0, 15.5, 2);
  const constellationGeo = trackGeo(new THREE.BufferGeometry());
  constellationGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(constellationCoords, 3),
  );
  const constellationMat = trackMat(
    new THREE.LineBasicMaterial({
      color: new THREE.Color('#c9a84c'),
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  voidConstellationLines = new THREE.LineSegments(constellationGeo, constellationMat);
  group.add(voidConstellationLines);

  // 3. Volumetric Nebula Clouds at deep Z planes
  voidNebulaGroup = new THREE.Group();
  const purpleNebulaTex = createProceduralNebulaTexture(
    'rgba(151, 36, 209, 0.24)',
    'rgba(88, 28, 135, 0.10)',
  );
  const goldNebulaTex = createProceduralNebulaTexture(
    'rgba(201, 168, 76, 0.15)',
    'rgba(147, 51, 234, 0.07)',
  );

  const nebulaConfigs = [
    { x: -24, y: 12, z: -28, scale: 52, tex: purpleNebulaTex, rotSpeed: 0.02 },
    { x: 26, y: -10, z: -34, scale: 58, tex: purpleNebulaTex, rotSpeed: -0.015 },
    { x: 4, y: 16, z: -40, scale: 46, tex: goldNebulaTex, rotSpeed: 0.018 },
    { x: -16, y: -18, z: -32, scale: 44, tex: goldNebulaTex, rotSpeed: -0.022 },
  ];

  const planeGeo = trackGeo(new THREE.PlaneGeometry(1, 1));
  for (const cfg of nebulaConfigs) {
    const mat = trackMat(
      new THREE.MeshBasicMaterial({
        map: cfg.tex,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const mesh = new THREE.Mesh(planeGeo, mat);
    mesh.position.set(cfg.x, cfg.y, cfg.z);
    mesh.scale.set(cfg.scale, cfg.scale, 1);
    mesh.userData.rotSpeed = cfg.rotSpeed;
    voidNebulaGroup.add(mesh);
  }
  group.add(voidNebulaGroup);

  // 4. Shooting Stars / Meteors Pool
  voidMeteors = [];
  for (let i = 0; i < 3; i++) {
    const meteorGeo = trackGeo(new THREE.BufferGeometry());
    meteorGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3).setUsage(THREE.DynamicDrawUsage),
    );
    const meteorMat = trackMat(
      new THREE.LineBasicMaterial({
        color: new THREE.Color(i === 0 ? '#f3efe6' : '#c9a84c'),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const line = new THREE.Line(meteorGeo, meteorMat);
    line.visible = false;
    group.add(line);
    voidMeteors.push({
      line,
      headX: 0,
      headY: 0,
      headZ: -10,
      vx: -38,
      vy: -22,
      vz: 0,
      length: 9.5,
      age: 0,
      maxAge: 1.1,
      active: false,
    });
  }

  return group;
}

function spawnMeteor() {
  const inactive = voidMeteors.find((m) => !m.active);
  if (!inactive) return;

  inactive.active = true;
  inactive.age = 0;
  inactive.maxAge = 0.85 + Math.random() * 0.55;
  inactive.headX = (Math.random() - 0.2) * 75;
  inactive.headY = 18 + Math.random() * 22;
  inactive.headZ = -8 - Math.random() * 18;
  const angle = -Math.PI * (0.68 + Math.random() * 0.16);
  const speed = 44 + Math.random() * 18;
  inactive.vx = Math.cos(angle) * speed;
  inactive.vy = Math.sin(angle) * speed;
  inactive.vz = (Math.random() - 0.5) * 6;
  inactive.length = 8 + Math.random() * 5;
  inactive.line.visible = true;
}

/**
 * Spawns a 3D visual & physical pulse at the clicked world coordinate:
 * - Turquoise ('core'): Armored Core Target Lock-On Reticle
 * - Purple ('void'): Cosmic Gravitational Wave Shockwave
 */
function spawnInteractivePulse(worldX: number, worldY: number, worldZ = 0) {
  if (!scene) return;

  const activeRealm = realm.value;
  const state = createInteractivePulse(nextPulseId++, activeRealm, worldX, worldY, worldZ);

  const pulseGroup = new THREE.Group();
  pulseGroup.position.set(worldX, worldY, worldZ);

  const isCore = activeRealm === 'core';
  const primaryColor = new THREE.Color(isCore ? '#00ffff' : '#c9a84c');
  const secondaryColor = new THREE.Color(isCore ? '#24c6d1' : '#b366ff');

  const outerMat = trackMat(
    new THREE.LineBasicMaterial({
      color: primaryColor,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const innerMat = trackMat(
    new THREE.LineBasicMaterial({
      color: secondaryColor,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );

  // Turquoise uses angular octagon/hexagon HUD geometry; Purple uses smooth circular wave rings
  const outerRing = new THREE.LineLoop(
    createCircleLineGeometry(1, isCore ? 8 : 48),
    outerMat,
  );
  const innerRing = new THREE.LineLoop(
    createCircleLineGeometry(0.6, isCore ? 4 : 36),
    innerMat,
  );
  pulseGroup.add(outerRing, innerRing);

  let crosshair: THREE.LineSegments | undefined;
  if (isCore) {
    const crossGeo = trackGeo(new THREE.BufferGeometry());
    crossGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [-1.4, 0, 0, -0.5, 0, 0, 0.5, 0, 0, 1.4, 0, 0, 0, -1.4, 0, 0, -0.5, 0, 0, 0.5, 0, 0, 1.4, 0],
        3,
      ),
    );
    crosshair = new THREE.LineSegments(crossGeo, outerMat);
    pulseGroup.add(crosshair);
  }

  scene.add(pulseGroup);
  activePulses.push({
    state,
    group: pulseGroup,
    outerRing,
    innerRing,
    crosshair,
  });

  // Cap concurrent pulses to keep frame time deterministic
  if (activePulses.length > 5) {
    const oldest = activePulses.shift();
    if (oldest && scene) {
      scene.remove(oldest.group);
    }
  }

  activePulseType.value = state.type;
  pulseCount.value += 1;
}

/**
 * Updates visibility and fog when switching between Turquoise ('core') and Purple ('void') realms.
 */
function applyRealmToScene(activeRealm: ThemeRealm) {
  if (!scene || !coreGroup || !voidGroup) return;
  const palette = getRealmScenePalette(activeRealm);
  scene.fog = new THREE.FogExp2(palette.fogColor, palette.fogDensity);

  // Clear any active click pulses from the previous realm so colors/shapes never bleed across realms
  for (const item of activePulses) {
    scene.remove(item.group);
  }
  activePulses = [];

  coreGroup.visible = activeRealm === 'core';
  voidGroup.visible = activeRealm === 'void';
}

/**
 * Software WebGL frame pacer from the Three.js skill so CPU-rendered headless browsers never stall.
 */
function afterDraw(cb: () => void) {
  if (!renderer || isDisposed) return;
  const gl = renderer.getContext() as WebGL2RenderingContext | WebGLRenderingContext | null;
  if (gl && 'fenceSync' in gl && typeof gl.fenceSync === 'function') {
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (isDisposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 80);
      }
    };
    frameId = window.setTimeout(poll, 5);
  } else {
    frameId = window.setTimeout(cb, 80);
  }
}

function updateCoreRealm(dt: number, elapsed: number) {
  if (!corePointsGeometry || !corePointsMaterial || !coreTelemetryLinesGeometry) return;

  corePointsMaterial.uniforms.uTime.value = elapsed;

  // 1. Animate Radar Gyroscope Rings & Floor Scanline
  if (coreRadarGroup) {
    coreRadarGroup.rotation.z = elapsed * 0.08;
    if (coreRadarGroup.children[1]) {
      coreRadarGroup.children[1].rotation.z = -elapsed * 0.14;
    }
  }
  if (coreScanLineMesh) {
    const scanZ = ((elapsed * 14) % 70) - 55;
    coreScanLineMesh.position.z = scanZ;
  }

  // 2. Smoothly move 3D Cursor Target Reticle
  if (coreCursorReticle) {
    coreCursorReticle.visible = pointerNorm.active;
    coreCursorReticle.position.x = dampValue(
      coreCursorReticle.position.x,
      pointerWorld.x,
      8,
      dt,
    );
    coreCursorReticle.position.y = dampValue(
      coreCursorReticle.position.y,
      pointerWorld.y,
      8,
      dt,
    );
    coreCursorReticle.rotation.z = elapsed * 0.65;
  }

  // 3. Update 3D Telemetry Node Positions & Active Pulse Displacements
  const posAttr = corePointsGeometry.getAttribute('position') as THREE.BufferAttribute;
  const posArray = posAttr.array as Float32Array;
  const count = coreNodes.length;

  for (let i = 0; i < count; i++) {
    const node = coreNodes[i];
    node.baseX += node.vx * dt;
    node.baseY += node.vy * dt;
    node.baseZ += node.vz * dt;

    if (node.baseX > 44) node.baseX = -44;
    else if (node.baseX < -44) node.baseX = 44;
    if (node.baseY > 28) node.baseY = -28;
    else if (node.baseY < -28) node.baseY = 28;
    if (node.baseZ > 16) node.baseZ = -28;
    else if (node.baseZ < -28) node.baseZ = 16;

    let offsetX = 0;
    let offsetY = 0;
    let offsetZ = 0;

    for (let p = 0; p < activePulses.length; p++) {
      const pulse = activePulses[p].state;
      if (pulse.realm === 'core') {
        const disp = computePulseDisplacement(node.baseX, node.baseY, node.baseZ, pulse);
        offsetX += disp.dx;
        offsetY += disp.dy;
        offsetZ += disp.dz;
      }
    }

    node.x = node.baseX + offsetX;
    node.y = node.baseY + offsetY;
    node.z = node.baseZ + offsetZ;

    posArray[i * 3] = node.x;
    posArray[i * 3 + 1] = node.y;
    posArray[i * 3 + 2] = node.z;
  }
  posAttr.needsUpdate = true;

  // 4. Build Dynamic Telemetry Vector Network (Nodes + Cursor Target Lock)
  const linePosAttr = coreTelemetryLinesGeometry.getAttribute('position') as THREE.BufferAttribute;
  const lineArray = linePosAttr.array as Float32Array;
  const maxLineVertices = lineArray.length / 3;
  let vertexCursor = 0;
  const maxDistSq = 13.5 * 13.5;
  const cursorLockDistSq = 16.5 * 16.5;

  for (let i = 0; i < count; i++) {
    if (vertexCursor >= maxLineVertices - 4) break;
    const a = coreNodes[i];

    // Connect node to cursor target reticle if within tactical sensor range
    if (pointerNorm.active) {
      const cdx = a.x - pointerWorld.x;
      const cdy = a.y - pointerWorld.y;
      const cdSq = cdx * cdx + cdy * cdy;
      if (cdSq < cursorLockDistSq) {
        lineArray[vertexCursor * 3] = a.x;
        lineArray[vertexCursor * 3 + 1] = a.y;
        lineArray[vertexCursor * 3 + 2] = a.z;
        vertexCursor++;
        lineArray[vertexCursor * 3] = pointerWorld.x;
        lineArray[vertexCursor * 3 + 1] = pointerWorld.y;
        lineArray[vertexCursor * 3 + 2] = 0;
        vertexCursor++;
      }
    }

    // Connect nearby telemetry nodes
    for (let j = i + 1; j < count; j++) {
      if (vertexCursor >= maxLineVertices - 2) break;
      const b = coreNodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dz = a.z - b.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq < maxDistSq) {
        lineArray[vertexCursor * 3] = a.x;
        lineArray[vertexCursor * 3 + 1] = a.y;
        lineArray[vertexCursor * 3 + 2] = a.z;
        vertexCursor++;
        lineArray[vertexCursor * 3] = b.x;
        lineArray[vertexCursor * 3 + 1] = b.y;
        lineArray[vertexCursor * 3 + 2] = b.z;
        vertexCursor++;
      }
    }
  }

  linePosAttr.needsUpdate = true;
  coreTelemetryLinesGeometry.setDrawRange(0, vertexCursor);
}

function updateVoidRealm(dt: number, elapsed: number) {
  if (!voidStarsGeometry || !voidStarsMaterial) return;

  voidStarsMaterial.uniforms.uTime.value = elapsed;

  // 1. Update Starfield Positions + Gravitational Wave Displacements + Gentle Cursor Repulsion
  const posAttr = voidStarsGeometry.getAttribute('position') as THREE.BufferAttribute;
  const posArray = posAttr.array as Float32Array;
  const count = voidStars.length;

  for (let i = 0; i < count; i++) {
    const star = voidStars[i];

    // Keep guide stars (first 90) anchored near their constellation coordinates with subtle breathing
    if (i < 90) {
      star.baseX += Math.sin(elapsed * 0.4 + star.phase) * 0.004;
      star.baseY += Math.cos(elapsed * 0.4 + star.phase) * 0.004;
    } else {
      star.baseX += star.vx * dt;
      star.baseY += star.vy * dt;
      star.baseZ += star.vz * dt;

      if (star.baseY > 44) star.baseY = -44;
      else if (star.baseY < -44) star.baseY = 44;
      if (star.baseX > 64) star.baseX = -64;
      else if (star.baseX < -64) star.baseX = 64;
    }

    let offsetX = 0;
    let offsetY = 0;
    let offsetZ = 0;

    // Subtle cosmic cursor gravity deflection
    if (pointerNorm.active) {
      const pdx = star.baseX - pointerWorld.x;
      const pdy = star.baseY - pointerWorld.y;
      const pDistSq = pdx * pdx + pdy * pdy;
      if (pDistSq < 110 && pDistSq > 0.001) {
        const pDist = Math.sqrt(pDistSq);
        const factor = (1 - pDist / 10.5) * 1.35;
        offsetX += (pdx / pDist) * factor;
        offsetY += (pdy / pDist) * factor;
      }
    }

    // Active click Gravitational Waves
    for (let p = 0; p < activePulses.length; p++) {
      const pulse = activePulses[p].state;
      if (pulse.realm === 'void') {
        const disp = computePulseDisplacement(star.baseX, star.baseY, star.baseZ, pulse);
        offsetX += disp.dx;
        offsetY += disp.dy;
        offsetZ += disp.dz;
      }
    }

    star.x = star.baseX + offsetX;
    star.y = star.baseY + offsetY;
    star.z = star.baseZ + offsetZ;

    posArray[i * 3] = star.x;
    posArray[i * 3 + 1] = star.y;
    posArray[i * 3 + 2] = star.z;
  }
  posAttr.needsUpdate = true;

  // 2. Rotate Volumetric Nebulas slowly
  if (voidNebulaGroup) {
    for (const child of voidNebulaGroup.children) {
      child.rotation.z += (child.userData.rotSpeed || 0.01) * dt;
    }
  }

  // 3. Spawn & Animate Shooting Stars / Meteors
  meteorSpawnTimer += dt;
  if (meteorSpawnTimer > 3.2) {
    meteorSpawnTimer = 0;
    spawnMeteor();
  }

  for (const meteor of voidMeteors) {
    if (!meteor.active) continue;
    meteor.age += dt;
    if (meteor.age >= meteor.maxAge) {
      meteor.active = false;
      meteor.line.visible = false;
      continue;
    }

    meteor.headX += meteor.vx * dt;
    meteor.headY += meteor.vy * dt;
    meteor.headZ += meteor.vz * dt;

    const speed = Math.sqrt(
      meteor.vx * meteor.vx + meteor.vy * meteor.vy + meteor.vz * meteor.vz,
    ) || 1;
    const tailX = meteor.headX - (meteor.vx / speed) * meteor.length;
    const tailY = meteor.headY - (meteor.vy / speed) * meteor.length;
    const tailZ = meteor.headZ - (meteor.vz / speed) * meteor.length;

    const mPos = meteor.line.geometry.getAttribute('position') as THREE.BufferAttribute;
    mPos.setXYZ(0, meteor.headX, meteor.headY, meteor.headZ);
    mPos.setXYZ(1, tailX, tailY, tailZ);
    mPos.needsUpdate = true;

    const progress = meteor.age / meteor.maxAge;
    const mat = meteor.line.material as THREE.LineBasicMaterial;
    mat.opacity = Math.sin(progress * Math.PI) * 0.78;
  }
}

function updateActivePulses(dt: number) {
  if (!scene || activePulses.length === 0) return;

  for (let i = activePulses.length - 1; i >= 0; i--) {
    const item = activePulses[i];
    item.state.age += dt;
    const progress = item.state.age / item.state.duration;

    if (progress >= 1) {
      scene.remove(item.group);
      activePulses.splice(i, 1);
      continue;
    }

    const fade = (1 - progress) * (1 - progress);

    if (item.state.type === 'tactical-lock') {
      // Armored Core lock-on reticle: outer ring expands while inner diamond locks & rotates
      const outerScale = 1.2 + progress * item.state.maxRadius * 0.65;
      const innerScale = Math.max(1.4, 4.2 - progress * 2.5);
      item.outerRing.scale.set(outerScale, outerScale, 1);
      item.outerRing.rotation.z = progress * Math.PI * 1.2;
      item.innerRing.scale.set(innerScale, innerScale, 1);
      item.innerRing.rotation.z = -progress * Math.PI * 1.8;
      if (item.crosshair) {
        item.crosshair.scale.set(innerScale * 0.9, innerScale * 0.9, 1);
      }
    } else {
      // Cosmic Gravitational Wave: radial ripples expanding into deep space
      const outerScale = 0.8 + progress * item.state.maxRadius;
      const innerScale = 0.4 + Math.pow(progress, 0.75) * item.state.maxRadius * 0.72;
      item.outerRing.scale.set(outerScale, outerScale, 1);
      item.innerRing.scale.set(innerScale, innerScale, 1);
      item.innerRing.rotation.z = progress * 0.8;
    }

    (item.outerRing.material as THREE.LineBasicMaterial).opacity = 0.82 * fade;
    (item.innerRing.material as THREE.LineBasicMaterial).opacity = 0.62 * fade;
  }
}

function tick() {
  if (isDisposed || !renderer || !scene || !camera) return;

  const now = performance.now() * 0.001;
  const dt = Math.min(0.06, Math.max(0.001, now - lastFrameTime));
  lastFrameTime = now;

  const activeRealm = realm.value;
  const palette = getRealmScenePalette(activeRealm);

  // 1. Smooth 3D Camera Parallax from Cursor & Scroll
  const camTarget = computeCameraParallaxTarget(
    pointerNorm.x,
    pointerNorm.y,
    currentScrollY,
    palette,
  );
  camera.position.x = dampValue(camera.position.x, camTarget.x, 4.5, dt);
  camera.position.y = dampValue(camera.position.y, camTarget.y, 4.5, dt);
  camera.position.z = dampValue(camera.position.z, camTarget.z, 3.8, dt);
  camera.rotation.x = dampValue(camera.rotation.x, camTarget.rotX, 4.5, dt);
  camera.rotation.y = dampValue(camera.rotation.y, camTarget.rotY, 4.5, dt);

  // 2. Advance active realm simulation
  if (activeRealm === 'core') {
    updateCoreRealm(dt, now);
  } else {
    updateVoidRealm(dt, now);
  }

  // 3. Advance click pulse effects
  updateActivePulses(dt);

  // 4. Render frame
  renderer.render(scene, camera);

  if (isSoftwareGl) {
    afterDraw(tick);
  } else {
    frameId = window.requestAnimationFrame(tick);
  }
}

/**
 * Projects normalized screen coordinates ([-1, 1]) onto the z = 0 focal plane in 3D world space.
 */
function projectNdcToWorldPlane(ndcX: number, ndcY: number, targetZ = 0, out: THREE.Vector3) {
  if (!camera) {
    out.set(ndcX * 22, ndcY * 14, targetZ);
    return;
  }
  raycastVec.set(ndcX, ndcY, 0.5).unproject(camera);
  raycastDir.copy(raycastVec).sub(camera.position).normalize();
  const distance =
    Math.abs(raycastDir.z) > 0.0001
      ? (targetZ - camera.position.z) / raycastDir.z
      : -camera.position.z;
  out.copy(camera.position).addScaledVector(raycastDir, distance);
}

function handlePointerMove(e: PointerEvent) {
  if (typeof window === 'undefined' || props.locked) return;
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  pointerNorm.x = (e.clientX / w) * 2 - 1;
  pointerNorm.y = -(e.clientY / h) * 2 + 1;
  pointerNorm.active = true;
  projectNdcToWorldPlane(pointerNorm.x, pointerNorm.y, 0, pointerWorld);
}

function handlePointerDown(e: PointerEvent) {
  if (typeof window === 'undefined' || props.locked) return;

  // Avoid firing background pulse when user clicks directly on interactive UI controls
  const target = e.target as HTMLElement | null;
  if (
    target &&
    target.closest(
      'button, a, input, select, textarea, summary, [role="button"], [data-prevent-bg-pulse]',
    )
  ) {
    return;
  }

  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  const ndcX = (e.clientX / w) * 2 - 1;
  const ndcY = -(e.clientY / h) * 2 + 1;
  pointerNorm.x = ndcX;
  pointerNorm.y = ndcY;
  pointerNorm.active = true;

  const clickWorld = new THREE.Vector3();
  projectNdcToWorldPlane(ndcX, ndcY, 0, clickWorld);
  spawnInteractivePulse(clickWorld.x, clickWorld.y, 0);
}

function handleScroll() {
  if (typeof window === 'undefined') return;
  currentScrollY = window.scrollY || 0;
}

function handleResize() {
  if (typeof window === 'undefined' || !renderer || !camera) return;
  const width = window.innerWidth || 1;
  const height = window.innerHeight || 1;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  const pr = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pr);
  if (corePointsMaterial) corePointsMaterial.uniforms.uPixelRatio.value = pr;
  if (voidStarsMaterial) voidStarsMaterial.uniforms.uPixelRatio.value = pr;
}

function initThreeScene() {
  if (typeof window === 'undefined' || !containerRef.value) return;

  isDisposed = false;
  isSoftwareGl = detectSoftwareWebGL();

  const width = window.innerWidth || 1440;
  const height = window.innerHeight || 900;

  scene = new THREE.Scene();
  const initialPalette = getRealmScenePalette(realm.value);
  scene.fog = new THREE.FogExp2(initialPalette.fogColor, initialPalette.fogDensity);

  camera = new THREE.PerspectiveCamera(60, width / height, 0.5, 220);
  camera.position.set(0, 0, initialPalette.cameraBaseZ);

  try {
    renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch {
    webglReady.value = false;
    return;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);

  const domCanvas = renderer.domElement;
  domCanvas.id = 'three-fx-canvas';
  domCanvas.setAttribute('data-testid', 'three-fx-canvas');
  domCanvas.style.width = '100%';
  domCanvas.style.height = '100%';
  domCanvas.style.display = 'block';

  containerRef.value.innerHTML = '';
  containerRef.value.appendChild(domCanvas);

  // Build both 3D realm environments once for zero-latency realm switching
  coreGroup = buildCoreTacticalRealm();
  voidGroup = buildVoidCosmicRealm();
  scene.add(coreGroup);
  scene.add(voidGroup);

  applyRealmToScene(realm.value);

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  webglReady.value = true;
  currentScrollY = window.scrollY || 0;
  lastFrameTime = performance.now() * 0.001;

  tick();
}

function disposeThreeScene() {
  isDisposed = true;
  if (frameId) {
    window.cancelAnimationFrame(frameId);
    window.clearTimeout(frameId);
    frameId = 0;
  }

  for (const geo of geometriesToDispose) {
    geo.dispose();
  }
  geometriesToDispose.length = 0;

  for (const mat of materialsToDispose) {
    mat.dispose();
  }
  materialsToDispose.length = 0;

  for (const tex of texturesToDispose) {
    tex.dispose();
  }
  texturesToDispose.length = 0;

  activePulses = [];

  if (renderer) {
    renderer.dispose();
    renderer = null;
  }
  scene = null;
  camera = null;
  coreGroup = null;
  voidGroup = null;
}

onMounted(() => {
  initThreeScene();
  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  window.addEventListener('pointerdown', handlePointerDown, { passive: true });
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });
});

watch(realm, (newRealm) => {
  applyRealmToScene(newRealm);
});

onUnmounted(() => {
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerdown', handlePointerDown);
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', handleResize);
  disposeThreeScene();
});
</script>

<template>
  <div
    id="fx-layer"
    data-testid="three-fx-layer"
    :data-realm="realm"
    :data-webgl-ready="webglReady ? 'true' : 'false'"
    :data-last-pulse="activePulseType"
    :data-pulse-count="pulseCount"
    aria-hidden="true"
    :style="{ pointerEvents: locked ? 'none' : 'auto' }"
  >
    <div id="particles-js" ref="containerRef" class="w-full h-full"></div>
  </div>
</template>
