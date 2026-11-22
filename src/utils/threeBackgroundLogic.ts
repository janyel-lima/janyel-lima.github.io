import type { ThemeRealm } from '../types/portfolio';

export interface RealmScenePalette {
  realm: ThemeRealm;
  fogColor: string;
  fogDensity: number;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  highlightHex: string;
  particleCount: number;
  telemetryMaxDistance: number;
  cameraBaseZ: number;
  parallaxAmplitudeX: number;
  parallaxAmplitudeY: number;
  scrollParallaxFactor: number;
}

export interface CameraParallaxTarget {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
}

export interface InteractivePulseState {
  id: number;
  realm: ThemeRealm;
  type: 'tactical-lock' | 'gravity-wave';
  worldX: number;
  worldY: number;
  worldZ: number;
  age: number;
  duration: number;
  maxRadius: number;
}

export interface ParticleNode3D {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  phase: number;
  colorIndex: number;
}

/**
 * Returns the deterministic 3D scene palette and spatial parameters for each realm.
 * - 'core' (Turquoise): Armored Core / Cyber Tech Tactical 3D HUD
 * - 'void' (Purple): Outer Space / Cosmic Starfield, Nebulas, Constellations & Meteors
 */
export function getRealmScenePalette(realm: ThemeRealm): RealmScenePalette {
  if (realm === 'core') {
    return {
      realm: 'core',
      fogColor: '#00171f',
      fogDensity: 0.011,
      primaryHex: '#00ffff',
      secondaryHex: '#24c6d1',
      accentHex: '#0a9ea3',
      highlightHex: '#72efdd',
      particleCount: 150,
      telemetryMaxDistance: 13.5,
      cameraBaseZ: 42,
      parallaxAmplitudeX: 5.5,
      parallaxAmplitudeY: 3.8,
      scrollParallaxFactor: 0.012,
    };
  }

  return {
    realm: 'void',
    fogColor: '#07030f',
    fogDensity: 0.0085,
    primaryHex: '#b366ff',
    secondaryHex: '#9724d1',
    accentHex: '#c9a84c',
    highlightHex: '#f3efe6',
    particleCount: 950,
    telemetryMaxDistance: 15.0,
    cameraBaseZ: 46,
    parallaxAmplitudeX: 6.8,
    parallaxAmplitudeY: 4.5,
    scrollParallaxFactor: 0.015,
  };
}

/**
 * Computes the target 3D camera position and subtle tilt angles from normalized
 * pointer coordinates ([-1, 1]) and vertical page scroll (scrollY in pixels).
 */
export function computeCameraParallaxTarget(
  normPointerX: number,
  normPointerY: number,
  scrollY: number,
  palette: RealmScenePalette,
): CameraParallaxTarget {
  const clampedX = Math.max(-1, Math.min(1, normPointerX));
  const clampedY = Math.max(-1, Math.min(1, normPointerY));
  const safeScroll = Math.max(0, scrollY);

  const scrollOffsetY = -safeScroll * palette.scrollParallaxFactor;
  const scrollDepthZ =
    palette.realm === 'core'
      ? Math.sin(safeScroll * 0.0015) * 2.4
      : Math.cos(safeScroll * 0.0012) * 3.0;

  const x = clampedX * palette.parallaxAmplitudeX;
  const y = clampedY * palette.parallaxAmplitudeY + scrollOffsetY * 0.45;
  const z = palette.cameraBaseZ + scrollDepthZ;

  const rotX = clampedY * 0.065;
  const rotY = -clampedX * 0.085;

  return { x, y, z, rotX, rotY };
}

/**
 * Frame-rate independent exponential damping helper.
 */
export function dampValue(current: number, target: number, lambda: number, dt: number): number {
  if (dt <= 0) return current;
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/**
 * Creates a new interactive click pulse in 3D space:
 * - 'tactical-lock' for Turquoise ('core') Armored Core HUD mode
 * - 'gravity-wave' for Purple ('void') Outer Space mode
 */
export function createInteractivePulse(
  id: number,
  realm: ThemeRealm,
  worldX: number,
  worldY: number,
  worldZ = 0,
): InteractivePulseState {
  if (realm === 'core') {
    return {
      id,
      realm: 'core',
      type: 'tactical-lock',
      worldX,
      worldY,
      worldZ,
      age: 0,
      duration: 1.45,
      maxRadius: 14.5,
    };
  }

  return {
    id,
    realm: 'void',
    type: 'gravity-wave',
    worldX,
    worldY,
    worldZ,
    age: 0,
    duration: 1.85,
    maxRadius: 19.0,
  };
}

/**
 * Calculates the displacement vector (dx, dy, dz) applied to a 3D particle by an active click pulse.
 * - In 'core' (tactical-lock): pulls nearby telemetry nodes slightly toward the lock perimeter ring.
 * - In 'void' (gravity-wave): creates an outward radial gravitational ripple wave that decays smoothly.
 */
export function computePulseDisplacement(
  px: number,
  py: number,
  pz: number,
  pulse: InteractivePulseState,
): { dx: number; dy: number; dz: number; intensity: number } {
  const progress = Math.max(0, Math.min(1, pulse.age / pulse.duration));
  if (progress >= 1) {
    return { dx: 0, dy: 0, dz: 0, intensity: 0 };
  }

  const rx = px - pulse.worldX;
  const ry = py - pulse.worldY;
  const rz = (pz - pulse.worldZ) * 0.5;
  const dist = Math.sqrt(rx * rx + ry * ry + rz * rz) || 0.0001;

  if (dist > pulse.maxRadius * 1.35) {
    return { dx: 0, dy: 0, dz: 0, intensity: 0 };
  }

  const envelope = Math.sin(progress * Math.PI) * (1 - progress * 0.45);
  const nx = rx / dist;
  const ny = ry / dist;
  const nz = rz / dist;

  if (pulse.type === 'tactical-lock') {
    // Snap/align nodes toward the tactical scan ring radius
    const targetRing = pulse.maxRadius * (0.35 + 0.55 * progress);
    const ringDelta = targetRing - dist;
    const falloff = Math.max(0, 1 - dist / (pulse.maxRadius * 1.15));
    const strength = ringDelta * 0.28 * falloff * envelope;
    return {
      dx: nx * strength,
      dy: ny * strength,
      dz: nz * strength * 0.4,
      intensity: falloff * envelope,
    };
  }

  // Gravity wave: radial wavefront ripple pushing stars outward with harmonic rebound
  const waveRadius = progress * pulse.maxRadius;
  const distFromWave = Math.abs(dist - waveRadius);
  const waveBand = Math.max(0, 1 - distFromWave / 5.5);
  const radialFalloff = Math.max(0, 1 - dist / (pulse.maxRadius * 1.25));
  const force = (2.8 * waveBand + 1.1 * radialFalloff) * envelope;

  return {
    dx: nx * force,
    dy: ny * force,
    dz: nz * force * 0.65,
    intensity: Math.max(waveBand, radialFalloff * 0.6) * envelope,
  };
}

/**
 * Generates deterministic constellation segments connecting star clusters in 3D space
 * for the Purple ('void') cosmic realm.
 */
export function generateConstellationSegments(
  starCoords: Float32Array,
  maxStarsToScan = 90,
  minDistance = 4.5,
  maxDistance = 13.5,
  maxConnectionsPerStar = 2,
): Float32Array {
  const totalStars = Math.min(Math.floor(starCoords.length / 3), maxStarsToScan);
  const segments: number[] = [];
  const connectionCounts = new Uint8Array(totalStars);

  for (let i = 0; i < totalStars; i++) {
    if (connectionCounts[i] >= maxConnectionsPerStar) continue;
    const ax = starCoords[i * 3];
    const ay = starCoords[i * 3 + 1];
    const az = starCoords[i * 3 + 2];

    for (let j = i + 1; j < totalStars; j++) {
      if (connectionCounts[i] >= maxConnectionsPerStar) break;
      if (connectionCounts[j] >= maxConnectionsPerStar) continue;

      const bx = starCoords[j * 3];
      const by = starCoords[j * 3 + 1];
      const bz = starCoords[j * 3 + 2];

      const dx = ax - bx;
      const dy = ay - by;
      const dz = az - bz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist >= minDistance && dist <= maxDistance) {
        segments.push(ax, ay, az, bx, by, bz);
        connectionCounts[i]++;
        connectionCounts[j]++;
      }
    }
  }

  return new Float32Array(segments);
}
