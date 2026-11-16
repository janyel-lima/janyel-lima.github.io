<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Search, MoonStar, Sparkles, Languages, Volume2, VolumeX } from 'lucide-vue-next';
import { useI18n } from '../../composables/useI18n';
import { useTheme } from '../../composables/useTheme';
import { useSearch } from '../../composables/useSearch';
import { useSfx } from '../../composables/useSfx';
import { getRealmIconAsset, handleImageError } from '../../utils/portfolioLogic';

const { t, toggleLang } = useI18n();
const { realm, isEldenMode, toggleTheme } = useTheme();
const { q, persist, clear } = useSearch();
const sfx = useSfx();

const realmIcon = computed(() => getRealmIconAsset(realm.value));

const isCompact = ref(false);
const showThemeHint = ref(false);
const showLangHint = ref(false);
const showMuteHint = ref(false);
const searchInputRef = ref<HTMLInputElement | null>(null);

function onScroll() {
  isCompact.value = window.scrollY > 50;
}

function onKeydown(e: KeyboardEvent) {
  const tag = (document.activeElement as HTMLElement)?.tagName;
  if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
    e.preventDefault();
    searchInputRef.value?.focus();
  } else if (e.key === 'Escape' && q.value.length) {
    clear();
  }
}

function handleSearchInput() {
  persist();
  sfx.play('search');
}

function handleThemeClick() {
  toggleTheme();
  sfx.play('theme');
}

function handleLangClick() {
  toggleLang();
  sfx.play('lang');
}

function handleMuteClick() {
  sfx.toggleMute();
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('keydown', onKeydown);
  onScroll();
});

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <header
    id="main-header"
    data-interactive
    class="fixed top-0 left-0 right-0 z-[9999] isolate flex justify-between items-center border-b transition-all duration-300"
    :class="[
      isCompact
        ? 'p-2 md:p-3 h-16 border-primary/60 backdrop-blur-md bg-black/75 shadow-[0_4px_20px_rgba(0,0,0,0.65)]'
        : 'p-4 md:p-6 h-24 md:h-28 border-primary/30 bg-black/35 backdrop-blur-sm',
      isEldenMode ? 'border-b-[#c9a84c]/35' : '',
    ]"
  >
    <!-- LOGO + STATUS -->
    <div class="flex items-center gap-3 md:gap-4">
      <div
        id="header-logo-container"
        class="w-12 h-12 group shrink-0 flex items-center justify-center transition-all duration-300"
        :class="isCompact ? 'md:w-10 md:h-10' : 'md:w-14 md:h-14'"
      >
        <img
          id="header-realm-icon"
          :src="realmIcon.src"
          :alt="realmIcon.alt"
          @error="handleImageError"
          class="core-glow w-full h-full object-contain transition-all duration-500"
        />
      </div>

      <div class="hidden sm:flex flex-col justify-center gap-0.5">
        <div class="flex items-center gap-2.5">
          <h1
            class="text-[length:var(--text-md)] tracking-[0.08em] uppercase font-black"
            :class="isEldenMode ? 'font-elden text-[#f3efe6] text-[length:var(--text-lg)]' : ''"
          >
            {{ t('header_brand_title') }}
          </h1>
        </div>
        <p
          class="text-[length:var(--text-micro)] tracking-[0.08em]"
          :class="isEldenMode ? 'text-[#d8b4fe]/85' : 'text-primary/60 uppercase'"
        >
          <span>{{ t('status_text') }}</span>
        </p>
      </div>
    </div>

    <!-- SEARCH BAR -->
    <div class="flex-1 max-w-xs mx-3 md:mx-6 relative group">
      <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search class="w-3.5 h-3.5 text-primary/60" />
      </div>

      <input
        ref="searchInputRef"
        v-model="q"
        type="text"
        :aria-label="t('search_placeholder')"
        :placeholder="t('search_placeholder')"
        class="w-full bg-black/50 border px-9 py-2 text-[length:var(--text-xs)] tracking-wider focus:outline-none text-white transition-colors"
        :class="
          isEldenMode
            ? 'border-[#c9a84c]/30 focus:border-[#b366ff] placeholder:text-[#d8b4fe]/45'
            : 'border-white/10 uppercase tracking-widest focus:border-primary/50'
        "
        @input="handleSearchInput"
      />

      <!-- CLEAR BUTTON -->
      <button
        v-show="q.length > 0"
        type="button"
        aria-label="Clear search"
        @click="clear()"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-[length:var(--text-micro)] uppercase tracking-widest text-white/40 hover:text-primary transition cursor-pointer"
      >
        ✕
      </button>
    </div>

    <!-- ACTIONS: MUTE, REALM SHIFT & LANGUAGE -->
    <div class="flex items-center gap-2 md:gap-3">
      <!-- MUTE / AUDIO TOGGLE -->
      <div
        class="relative"
        @mouseenter="showMuteHint = true"
        @mouseleave="showMuteHint = false"
      >
        <button
          type="button"
          :aria-label="sfx.muted.value ? t('btn_mute_off') : t('btn_mute_on')"
          :aria-pressed="sfx.muted.value"
          @click="handleMuteClick"
          class="rpg-button px-2.5 md:px-3.5 py-1.5 bg-black/60 flex items-center gap-1.5 text-[length:var(--text-xs)] tracking-[0.08em] font-bold border cursor-pointer"
          :class="sfx.muted.value ? 'opacity-60 border-red-400/40' : ''"
        >
          <VolumeX v-if="sfx.muted.value" class="w-4 h-4 text-red-400" />
          <Volume2 v-else class="w-4 h-4 text-primary" />
          <span class="hidden xl:inline whitespace-nowrap">
            {{ sfx.muted.value ? t('btn_mute_off') : t('btn_mute_on') }}
          </span>
        </button>

        <div
          v-show="showMuteHint"
          class="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[length:var(--text-micro)] uppercase tracking-widest text-white/90 bg-black/90 px-2 py-0.5 border border-white/10 backdrop-blur pointer-events-none whitespace-nowrap"
        >
          {{ sfx.muted.value ? t('btn_mute_off') : t('btn_mute_on') }}
        </div>
      </div>

      <!-- REALM SHIFT -->
      <div
        class="relative"
        @mousedown="showThemeHint = true"
        @mouseup="showThemeHint = false"
        @mouseleave="showThemeHint = false"
        @touchstart.passive="showThemeHint = true"
        @touchend.passive="showThemeHint = false"
      >
        <button
          type="button"
          :aria-label="t('btn_theme')"
          @click="handleThemeClick"
          class="rpg-button px-3 md:px-4 py-1.5 bg-black/60 flex items-center gap-2 text-[length:var(--text-xs)] tracking-[0.08em] font-bold border uppercase cursor-pointer"
        >
          <Sparkles v-if="isEldenMode" class="w-4 h-4 text-[#c9a84c]" />
          <MoonStar v-else class="w-4 h-4 text-primary" />
          <span class="hidden md:inline whitespace-nowrap">{{ t('btn_theme') }}</span>
        </button>

        <div
          v-show="showThemeHint"
          class="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[length:var(--text-micro)] uppercase tracking-widest text-white/90 bg-black/90 px-2 py-0.5 border border-white/10 backdrop-blur pointer-events-none whitespace-nowrap"
        >
          {{ t('btn_theme') }}
        </div>
      </div>

      <!-- LANGUAGE -->
      <div
        class="relative"
        @mousedown="showLangHint = true"
        @mouseup="showLangHint = false"
        @mouseleave="showLangHint = false"
        @touchstart.passive="showLangHint = true"
        @touchend.passive="showLangHint = false"
      >
        <button
          type="button"
          :aria-label="t('language')"
          @click="handleLangClick"
          class="rpg-button px-3 py-1.5 bg-black/60 flex items-center gap-2 border border-accent/40 cursor-pointer"
        >
          <Languages class="w-4 h-4 text-accent" />
          <span class="hidden md:inline text-[length:var(--text-xs)] font-bold tracking-widest uppercase whitespace-nowrap">
            {{ t('language') }}
          </span>
        </button>

        <div
          v-show="showLangHint"
          class="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[length:var(--text-micro)] uppercase tracking-widest text-white/90 bg-black/90 px-2 py-0.5 border border-white/10 backdrop-blur pointer-events-none whitespace-nowrap"
        >
          {{ t('language') }}
        </div>
      </div>
    </div>
  </header>
</template>
