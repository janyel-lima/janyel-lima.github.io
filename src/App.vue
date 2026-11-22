<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useTheme } from './composables/useTheme';
import { useSfx } from './composables/useSfx';
import ParticlesBackground from './components/layout/ParticlesBackground.vue';
import AppHeader from './components/layout/AppHeader.vue';
import AppFooter from './components/layout/AppFooter.vue';
import ProfileAside from './components/aside/ProfileAside.vue';
import ProjectStreamSection from './components/sections/ProjectStreamSection.vue';
import ExperienceTimeline from './components/sections/ExperienceTimeline.vue';
import EducationArchive from './components/sections/EducationArchive.vue';
import DecryptOverlay from './components/modals/DecryptOverlay.vue';

const { initTheme } = useTheme();
const sfx = useSfx();

const locked = ref(false);
const decrypting = ref(false);
const progress = ref(0);
const showFragment = ref(false);
const unlocked = ref(false);
let rafId: number | null = null;

function startDecrypt() {
  if (unlocked.value) {
    showFragment.value = true;
    sfx.play('select');
    return;
  }

  const DECRYPT_DURATION = 1800;
  locked.value = true;
  decrypting.value = true;
  progress.value = 0;

  sfx.play('decrypt');

  if (rafId) cancelAnimationFrame(rafId);
  const startTime = performance.now();

  const tick = (now: number) => {
    const elapsed = now - startTime;
    progress.value = Math.min((elapsed / DECRYPT_DURATION) * 100, 100);

    if (elapsed < DECRYPT_DURATION) {
      rafId = requestAnimationFrame(tick);
      return;
    }

    progress.value = 100;
    locked.value = false;
    decrypting.value = false;
    unlocked.value = true;
    showFragment.value = true;
    localStorage.setItem('fragment-unlocked', '1');
    sfx.play('unlock');
  };

  rafId = requestAnimationFrame(tick);
}

function closeFragment() {
  showFragment.value = false;
  sfx.play('close');
}

function onSearchNavigate(e: Event) {
  const custom = e as CustomEvent;
  const action = custom.detail?.action;
  if (action?.type === 'contact') {
    unlocked.value = true;
    showFragment.value = true;
    localStorage.setItem('fragment-unlocked', '1');
  }
}

onMounted(() => {
  initTheme();
  unlocked.value = localStorage.getItem('fragment-unlocked') === '1';
  window.addEventListener('portfolio-search-navigate', onSearchNavigate);
});

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId);
  window.removeEventListener('portfolio-search-navigate', onSearchNavigate);
});
</script>

<template>
  <!-- FX LAYER — Particles.js Background -->
  <ParticlesBackground :locked="locked" />

  <!-- APP SHELL -->
  <div id="app" class="relative z-10">
    <div id="top" aria-hidden="true"></div>

    <!-- HEADER -->
    <AppHeader />

    <!-- MAIN -->
    <main class="max-w-[1440px] xl:max-w-[1560px] 2xl:max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-24 md:pt-28 pb-8 relative z-10">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-10">
        <!-- Sidebar / Profile -->
        <ProfileAside
          :unlocked="unlocked"
          :show-fragment="showFragment"
          @start-decrypt="startDecrypt"
          @close-fragment="closeFragment"
        />

        <!-- Content Sections -->
        <section class="lg:col-span-8 order-2 lg:order-2 space-y-10 lg:space-y-12">
          <ProjectStreamSection />
          <ExperienceTimeline />
          <EducationArchive />
        </section>
      </div>
    </main>

    <!-- FOOTER -->
    <AppFooter />

    <!-- DECRYPT OVERLAY -->
    <DecryptOverlay :locked="locked" :progress="progress" />
  </div>
</template>
