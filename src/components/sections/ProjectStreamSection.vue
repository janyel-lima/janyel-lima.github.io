<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { myData } from '../../data/portfolioData';
import { filterProjects, getVisibleStreamWindow } from '../../utils/portfolioLogic';
import { useI18n } from '../../composables/useI18n';
import { useSearch } from '../../composables/useSearch';
import { useSfx } from '../../composables/useSfx';
import { useTheme } from '../../composables/useTheme';
import ProjectCard from './ProjectCard.vue';

const { t, lang } = useI18n();
const { q } = useSearch();
const sfx = useSfx();
const { isEldenMode } = useTheme();

const cursor = ref(0);
const windowSize = 2;

const filteredProjects = computed(() => {
  const matches = filterProjects(myData.projects, q.value, lang.value);
  return matches.length > 0 ? matches : myData.projects;
});

const visibleProjects = computed(() =>
  getVisibleStreamWindow(filteredProjects.value, cursor.value, windowSize)
);

function nextSector() {
  const total = filteredProjects.value.length;
  if (!total) return;
  cursor.value = (cursor.value + 1) % total;
  sfx.play('nav');
}

function prevSector() {
  const total = filteredProjects.value.length;
  if (!total) return;
  cursor.value = (cursor.value - 1 + total) % total;
  sfx.play('nav');
}

function onSearchNavigate(e: Event) {
  const custom = e as CustomEvent;
  const action = custom.detail?.action;
  if (action?.type === 'project') {
    const idx = filteredProjects.value.findIndex((p) => p.title === action.key);
    if (idx >= 0) {
      cursor.value = idx;
    } else if (typeof action.index === 'number') {
      cursor.value = action.index;
    }
  }
}

onMounted(() => {
  window.addEventListener('portfolio-search-navigate', onSearchNavigate);
});

onUnmounted(() => {
  window.removeEventListener('portfolio-search-navigate', onSearchNavigate);
});
</script>

<template>
  <div id="projects">
    <!-- ABOUT SECTION -->
    <h2
      class="text-accent font-bold text-[length:var(--text-md)] mb-6 uppercase tracking-[0.1em]"
      :class="isEldenMode ? 'er-section-banner' : ''"
    >
      {{ t('title_about') }}
    </h2>

    <div
      class="relative flex bg-black/60 border-white/10 mb-8 group overflow-hidden"
      :class="isEldenMode ? 'rpg-card p-1' : ''"
      :style="isEldenMode ? '' : 'clip-path: polygon(0 0, 100% 0, 100% 85%, 92% 100%, 0 100%)'"
    >
      <div class="scan-line"></div>
      <div
        v-if="!isEldenMode"
        class="w-1 bg-primary shadow-[2px_0_10px_rgba(var(--color-primary-rgb),0.3)]"
      ></div>

      <div class="p-4 pr-6 w-full" :class="isEldenMode ? 'er-guide-block ml-3 my-1' : ''">
        <div class="flex items-center gap-2 mb-3">
          <div
            class="w-2 h-2 rotate-45 shadow-[0_0_8px_var(--color-primary)]"
            :class="isEldenMode ? 'bg-[#c9a84c]' : 'bg-primary'"
          ></div>
          <h5 class="text-[length:var(--text-md)] font-black uppercase tracking-[0.1em] text-primary">
            {{ t('data_about') }}
          </h5>
        </div>

        <div class="text-[length:var(--text-xs)] text-gray-400 uppercase mb-1.5 tracking-[0.1em]">
          {{ t('transmission_source') }}
        </div>

        <p
          class="text-[length:var(--text-base)] tracking-[0.06em] text-gray-200 leading-relaxed group-hover:text-white transition-colors"
        >
          {{ t('about_me_text') }}
        </p>
      </div>

      <div
        v-if="!isEldenMode"
        class="absolute bottom-0 right-0 w-2 h-2 bg-primary/20"
        style="clip-path: polygon(100% 0, 100% 100%, 0 100%)"
      ></div>
    </div>

    <!-- PROJECTS STREAM SECTION -->
    <h2
      class="text-accent font-bold text-[length:var(--text-md)] mb-6 uppercase tracking-[0.1em]"
      :class="isEldenMode ? 'er-section-banner' : ''"
    >
      {{ t('title_projects') }}
    </h2>

    <div class="flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-center mb-6 text-[length:var(--text-md)] text-primary/70 tracking-[0.1em]">
      <button
        type="button"
        data-interactive
        @click="prevSector"
        class="rpg-button-left bg-black/60 w-full sm:w-auto py-3 px-4 sm:py-3.5 sm:px-5 flex items-center justify-center sm:justify-start gap-2 cursor-pointer"
      >
        <span class="whitespace-nowrap">{{ t('prev_sector') }}</span>
      </button>

      <span
        class="order-first sm:order-none text-[length:var(--text-micro)] sm:text-[length:var(--text-sm)] text-primary"
        :class="isEldenMode ? 'font-semibold tracking-[0.18em] text-[#e2d4f0]' : 'animate-pulse'"
      >
        {{ t('stream_active') }}
      </span>

      <button
        type="button"
        data-interactive
        @click="nextSector"
        class="rpg-button-right bg-black/60 w-full sm:w-auto py-3 px-4 sm:py-3.5 sm:px-5 flex items-center justify-center sm:justify-end gap-2 cursor-pointer"
      >
        <span class="whitespace-nowrap">{{ t('next_sector') }}</span>
      </button>
    </div>

    <div id="portfolio-grid" class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
      <ProjectCard
        v-for="(p, idx) in visibleProjects"
        :key="`${p.title}-${cursor}-${idx}`"
        :project="p"
      />
    </div>
  </div>
</template>
