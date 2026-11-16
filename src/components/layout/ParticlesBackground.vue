<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { useTheme } from '../../composables/useTheme';
import type { ThemeRealm } from '../../types/portfolio';

defineProps<{
  locked?: boolean;
}>();

const { realm } = useTheme();

function destroyExistingParticles() {
  if (typeof window !== 'undefined' && Array.isArray(window.pJSDom) && window.pJSDom.length) {
    try {
      window.pJSDom[0]?.pJS?.fn?.vendors?.destroypJS?.();
      window.pJSDom = [];
    } catch {
      window.pJSDom = [];
    }
  }
}

function buildParticlesConfig(activeRealm: ThemeRealm) {
  const isTurquoise = activeRealm === 'core';

  return {
    particles: {
      number: {
        value: isTurquoise ? 72 : 64,
        density: { enable: true, value_area: 850 },
      },
      color: {
        value: isTurquoise ? '#00f5d4' : ['#a855f7', '#c084fc', '#c9a84c'],
      },
      shape: {
        type: isTurquoise ? 'circle' : 'polygon',
        polygon: { nb_sides: 4 },
      },
      opacity: {
        value: isTurquoise ? 0.52 : 0.45,
        random: !isTurquoise,
        anim: {
          enable: !isTurquoise,
          speed: 0.8,
          opacity_min: 0.12,
          sync: false,
        },
      },
      size: {
        value: isTurquoise ? 2.2 : 2.6,
        random: true,
        anim: { enable: false, speed: 20, size_min: 0.1, sync: false },
      },
      line_linked: {
        enable: true,
        distance: isTurquoise ? 150 : 140,
        color: isTurquoise ? '#24c6d1' : '#9724d1',
        opacity: isTurquoise ? 0.38 : 0.22,
        width: 1,
      },
      move: {
        enable: true,
        speed: isTurquoise ? 2.0 : 1.15,
        direction: isTurquoise ? 'none' : 'top',
        random: !isTurquoise,
        straight: false,
        out_mode: 'out',
        bounce: false,
        attract: { enable: false, rotateX: 600, rotateY: 1200 },
      },
    },
    interactivity: {
      detect_on: 'canvas',
      events: {
        // Turquoise ('core'): hover grabs lines, click pushes (adds) new particles
        // Purple ('void' Elden Ring): hover & click repulse particles away
        onhover: {
          enable: true,
          mode: isTurquoise ? 'grab' : 'repulse',
        },
        onclick: {
          enable: true,
          mode: isTurquoise ? 'push' : 'repulse',
        },
        resize: true,
      },
      modes: {
        grab: {
          distance: 185,
          line_linked: { opacity: 0.65 },
        },
        push: {
          particles_nb: 4,
        },
        repulse: {
          distance: 165,
          duration: 0.6,
        },
      },
    },
    retina_detect: true,
  };
}

function initParticles(activeRealm: ThemeRealm) {
  if (typeof window === 'undefined' || typeof window.particlesJS !== 'function') return;
  destroyExistingParticles();
  window.particlesJS('particles-js', buildParticlesConfig(activeRealm));
}

onMounted(() => {
  initParticles(realm.value);
});

watch(realm, (newRealm) => {
  initParticles(newRealm);
});

onUnmounted(() => {
  destroyExistingParticles();
});
</script>

<template>
  <div
    id="fx-layer"
    aria-hidden="true"
    :style="{ pointerEvents: locked ? 'none' : 'auto' }"
  >
    <div id="particles-js"></div>
  </div>
</template>
