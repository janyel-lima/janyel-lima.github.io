<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import {
  Search,
  MoonStar,
  Sparkles,
  Languages,
  Volume2,
  VolumeX,
  X,
  FolderGit2,
  Briefcase,
  Cpu,
  GraduationCap,
  UserCheck,
  ArrowUpRight,
} from 'lucide-vue-next';
import { useI18n } from '../../composables/useI18n';
import { useTheme } from '../../composables/useTheme';
import { useSearch } from '../../composables/useSearch';
import { useSfx } from '../../composables/useSfx';
import {
  getRealmIconAsset,
  handleImageError,
  searchPortfolio,
  type PortfolioSearchCategory,
  type PortfolioSearchResult,
} from '../../utils/portfolioLogic';

const { t, lang, toggleLang } = useI18n();
const { realm, isEldenMode, toggleTheme } = useTheme();
const {
  q,
  isOpen,
  activeCategory,
  persist,
  clear,
  openSearch,
  closeSearch,
  toggleSearch,
  navigateToResult,
} = useSearch();
const sfx = useSfx();

const realmIcon = computed(() => getRealmIconAsset(realm.value));

const isCompact = ref(false);
const showThemeHint = ref(false);
const showLangHint = ref(false);
const showMuteHint = ref(false);
const showSearchHint = ref(false);
const searchInputRef = ref<HTMLInputElement | null>(null);
const headerRef = ref<HTMLElement | null>(null);

const categories: Array<{ id: PortfolioSearchCategory; labelKey: string }> = [
  { id: 'all', labelKey: 'search_all_cat' },
  { id: 'projects', labelKey: 'search_cat_projects' },
  { id: 'experience', labelKey: 'search_cat_experience' },
  { id: 'skills', labelKey: 'search_cat_skills' },
  { id: 'education', labelKey: 'search_cat_education' },
  { id: 'profile', labelKey: 'search_cat_profile' },
];

const allMatchingResults = computed(() =>
  searchPortfolio(q.value, lang.value, realm.value)
);

const categoryCounts = computed(() => {
  const counts: Record<PortfolioSearchCategory, number> = {
    all: allMatchingResults.value.length,
    projects: 0,
    experience: 0,
    skills: 0,
    education: 0,
    profile: 0,
  };
  for (const r of allMatchingResults.value) {
    counts[r.category] = (counts[r.category] || 0) + 1;
  }
  return counts;
});

const displayedResults = computed(() => {
  const list =
    activeCategory.value === 'all'
      ? allMatchingResults.value
      : allMatchingResults.value.filter((r) => r.category === activeCategory.value);

  // When query is empty and category is 'all', show a balanced preview across categories
  if (!q.value.trim() && activeCategory.value === 'all') {
    const perCat: Record<string, number> = {};
    return list.filter((item) => {
      perCat[item.category] = (perCat[item.category] || 0) + 1;
      const limit = item.category === 'skills' ? 6 : 4;
      return perCat[item.category] <= limit;
    });
  }
  return list;
});

watch(isOpen, async (open) => {
  if (open) {
    await nextTick();
    searchInputRef.value?.focus();
  }
});

function onScroll() {
  isCompact.value = window.scrollY > 50;
}

function onKeydown(e: KeyboardEvent) {
  const tag = (document.activeElement as HTMLElement)?.tagName;
  if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
    e.preventDefault();
    openSearch();
    sfx.play('toggle');
  } else if (e.key === 'Escape') {
    if (isOpen.value) {
      closeSearch();
      sfx.play('close');
    } else if (q.value.length) {
      clear();
    }
  }
}

function onDocumentClick(e: MouseEvent) {
  if (!isOpen.value) return;
  const target = e.target as Node | null;
  if (headerRef.value && target && !headerRef.value.contains(target)) {
    closeSearch();
  }
}

function handleSearchToggle() {
  toggleSearch();
  sfx.play('toggle');
}

function handleSearchInput() {
  persist();
  sfx.play('search');
}

function handleClearQuery() {
  clear();
  sfx.play('click');
  searchInputRef.value?.focus();
}

function handleSelectResult(result: PortfolioSearchResult) {
  sfx.play('select');
  navigateToResult(result);
  closeSearch();
}

function handleCategoryClick(cat: PortfolioSearchCategory) {
  activeCategory.value = cat;
  sfx.play('click');
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
  document.addEventListener('mousedown', onDocumentClick);
  onScroll();
});

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('keydown', onKeydown);
  document.removeEventListener('mousedown', onDocumentClick);
});
</script>

<template>
  <header
    id="main-header"
    ref="headerRef"
    data-interactive
    class="fixed top-0 left-0 right-0 z-[9999] isolate border-b transition-all duration-300"
    :class="[
      isCompact
        ? 'border-primary/60 backdrop-blur-md bg-black/80 shadow-[0_4px_20px_rgba(0,0,0,0.65)]'
        : 'border-primary/30 bg-black/45 backdrop-blur-sm',
      isEldenMode ? 'border-b-[#c9a84c]/35' : '',
    ]"
  >
    <div
      class="max-w-[1440px] xl:max-w-[1560px] 2xl:max-w-[1680px] mx-auto flex justify-between items-center transition-all duration-300"
      :class="isCompact ? 'px-3 sm:px-6 lg:px-10 h-16' : 'px-4 sm:px-6 lg:px-10 h-20 md:h-24'"
    >
      <!-- LOGO + STATUS -->
      <div class="flex items-center gap-3 md:gap-4 min-w-0">
        <div
          id="header-logo-container"
          class="w-11 h-11 group shrink-0 flex items-center justify-center transition-all duration-300"
          :class="isCompact ? 'md:w-10 md:h-10' : 'md:w-13 md:h-13'"
        >
          <img
            id="header-realm-icon"
            :src="realmIcon.src"
            :alt="realmIcon.alt"
            @error="handleImageError"
            class="core-glow w-full h-full object-contain transition-all duration-500"
          />
        </div>

        <div class="flex flex-col justify-center gap-0.5 min-w-0">
          <div class="flex items-center gap-2.5">
            <h1
              class="text-[length:var(--text-md)] tracking-[0.08em] uppercase font-black truncate"
              :class="isEldenMode ? 'font-elden text-[#f3efe6] text-[length:var(--text-lg)]' : ''"
            >
              {{ t('header_brand_title') }}
            </h1>
          </div>
          <p
            class="hidden sm:block text-[length:var(--text-micro)] tracking-[0.08em] truncate"
            :class="isEldenMode ? 'text-[#d8b4fe]/85' : 'text-primary/60 uppercase'"
          >
            <span>{{ t('status_text') }}</span>
          </p>
        </div>
      </div>

      <!-- ACTIONS: SEARCH BUTTON, MUTE, REALM SHIFT & LANGUAGE -->
      <div class="flex items-center gap-2 md:gap-3">
        <!-- ACTIVE FILTER PILL (WHEN SEARCH PANEL IS CLOSED BUT FILTER IS ACTIVE) -->
        <button
          v-if="q.trim() && !isOpen"
          type="button"
          @click="handleClearQuery"
          class="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-[length:var(--text-micro)] bg-primary/15 border border-primary/40 text-primary hover:bg-primary/25 transition cursor-pointer"
          :title="t('search_clear_filter')"
        >
          <span class="max-w-[120px] truncate">"{{ q }}"</span>
          <X class="w-3 h-3 shrink-0" />
        </button>

        <!-- SEARCH TOGGLE BUTTON -->
        <div
          class="relative"
          @mouseenter="showSearchHint = true"
          @mouseleave="showSearchHint = false"
        >
          <button
            id="search-toggle-btn"
            type="button"
            :aria-label="t('btn_search')"
            :aria-expanded="isOpen"
            @click="handleSearchToggle"
            class="rpg-button px-3 md:px-4 py-1.5 bg-black/60 flex items-center gap-2 text-[length:var(--text-xs)] tracking-[0.08em] font-bold border uppercase cursor-pointer"
            :class="
              isOpen || q.trim()
                ? isEldenMode
                  ? '!border-[#c9a84c] bg-[#b366ff]/20 text-[#f3efe6]'
                  : '!border-primary bg-primary/15 text-primary'
                : ''
            "
          >
            <Search
              class="w-4 h-4 shrink-0"
              :class="isEldenMode ? 'text-[#c9a84c]' : 'text-primary'"
            />
            <span class="hidden sm:inline whitespace-nowrap">
              {{ isOpen ? t('search_close') : t('btn_search') }}
            </span>
            <span
              v-if="q.trim()"
              class="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-black rounded-xs"
              :class="
                isEldenMode
                  ? 'bg-[#c9a84c]/25 text-[#e2c777] border border-[#c9a84c]/40'
                  : 'bg-primary/20 text-primary border border-primary/40'
              "
            >
              {{ allMatchingResults.length }}
            </span>
          </button>

          <div
            v-show="showSearchHint && !isOpen"
            class="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[length:var(--text-micro)] uppercase tracking-widest text-white/90 bg-black/90 px-2 py-0.5 border border-white/10 backdrop-blur pointer-events-none whitespace-nowrap"
          >
            {{ t('btn_search') }} [ / ]
          </div>
        </div>

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
    </div>

    <!-- EXPANDABLE GLOBAL PORTFOLIO SEARCH BAR & RESULTS PANEL -->
    <div
      v-show="isOpen"
      id="global-search-panel"
      class="border-t animate-fade-in backdrop-blur-xl"
      :class="
        isEldenMode
          ? 'border-[#c9a84c]/35 bg-[#0b0516]/95 shadow-[0_16px_40px_rgba(0,0,0,0.85)]'
          : 'border-primary/40 bg-[#00141a]/95 shadow-[0_16px_40px_rgba(0,0,0,0.85)]'
      "
    >
      <div class="max-w-5xl mx-auto px-4 sm:px-6 py-4 space-y-3">
        <!-- SEARCH INPUT BAR -->
        <div class="relative flex items-center gap-2">
          <div class="relative flex-1">
            <div class="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
              <Search
                class="w-4 h-4"
                :class="isEldenMode ? 'text-[#c9a84c]' : 'text-primary'"
              />
            </div>

            <input
              ref="searchInputRef"
              v-model="q"
              type="text"
              :aria-label="t('search_placeholder')"
              :placeholder="t('search_placeholder')"
              class="w-full bg-black/70 border pl-10 pr-20 py-2.5 text-[length:var(--text-sm)] tracking-wide focus:outline-none text-white transition-colors"
              :class="
                isEldenMode
                  ? 'border-[#c9a84c]/40 focus:border-[#b366ff] placeholder:text-[#d8b4fe]/45'
                  : 'border-primary/30 uppercase tracking-widest focus:border-primary placeholder:text-primary/40'
              "
              @input="handleSearchInput"
            />

            <!-- CLEAR BUTTON -->
            <button
              v-show="q.length > 0"
              type="button"
              aria-label="Clear search"
              @click="handleClearQuery"
              class="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[length:var(--text-micro)] uppercase tracking-wider text-white/60 hover:text-primary transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          <button
            type="button"
            @click="closeSearch"
            class="rpg-button px-3.5 py-2.5 text-[length:var(--text-xs)] font-bold uppercase tracking-wider cursor-pointer shrink-0"
          >
            {{ t('search_close') }}
          </button>
        </div>

        <!-- CATEGORY FILTER TABS -->
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-1.5 flex-wrap">
            <button
              v-for="cat in categories"
              :key="cat.id"
              type="button"
              @click="handleCategoryClick(cat.id)"
              class="px-2.5 py-1 text-[length:var(--text-micro)] font-bold uppercase tracking-wider border transition cursor-pointer flex items-center gap-1.5"
              :class="
                activeCategory === cat.id
                  ? isEldenMode
                    ? 'border-[#c9a84c] bg-[#b366ff]/25 text-[#f3efe6] shadow-[0_0_10px_rgba(201,168,76,0.25)]'
                    : 'border-primary bg-primary/20 text-primary shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.25)]'
                  : 'border-white/10 bg-black/40 text-gray-400 hover:border-primary/40 hover:text-white'
              "
            >
              <span>{{ t(cat.labelKey) }}</span>
              <span
                class="px-1 py-0.2 text-[10px] rounded-xs"
                :class="
                  activeCategory === cat.id
                    ? isEldenMode
                      ? 'bg-[#c9a84c]/25 text-[#e2c777]'
                      : 'bg-primary/25 text-primary'
                    : 'bg-white/5 text-gray-400'
                "
              >
                {{ categoryCounts[cat.id] }}
              </span>
            </button>
          </div>

          <span class="text-[length:var(--text-micro)] text-gray-400 hidden md:inline">
            {{ allMatchingResults.length }} {{ t('search_results_count') }}
          </span>
        </div>

        <!-- HINT WHEN EMPTY -->
        <p
          v-if="!q.trim()"
          class="text-[length:var(--text-micro)] text-gray-400 tracking-wider"
        >
          {{ t('search_hint_explore') }}
        </p>

        <!-- RESULTS LIST -->
        <div
          v-if="displayedResults.length > 0"
          class="max-h-[55vh] overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-2 scrollbar-thin-cyber"
        >
          <button
            v-for="item in displayedResults"
            :key="item.id"
            type="button"
            @click="handleSelectResult(item)"
            class="group/res text-left p-2.5 border transition-all duration-200 flex items-start gap-3 cursor-pointer"
            :class="
              isEldenMode
                ? 'er-slot hover:border-[#c9a84c]'
                : 'bg-black/55 border-white/10 hover:border-primary hover:bg-primary/10'
            "
          >
            <!-- CATEGORY ICON -->
            <div
              class="w-8 h-8 shrink-0 flex items-center justify-center border mt-0.5"
              :class="
                isEldenMode
                  ? 'border-[#c9a84c]/40 bg-[#1b0b30] text-[#e2c777]'
                  : 'border-primary/30 bg-primary/10 text-primary'
              "
            >
              <FolderGit2 v-if="item.category === 'projects'" class="w-4 h-4" />
              <Briefcase v-else-if="item.category === 'experience'" class="w-4 h-4" />
              <Cpu v-else-if="item.category === 'skills'" class="w-4 h-4" />
              <GraduationCap v-else-if="item.category === 'education'" class="w-4 h-4" />
              <UserCheck v-else class="w-4 h-4" />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <span
                  class="text-[length:var(--text-sm)] font-bold leading-snug group-hover/res:text-primary transition-colors"
                  :class="isEldenMode ? 'text-[#f3efe6]' : 'text-white'"
                >
                  {{ item.title }}
                </span>
                <span
                  v-if="item.badge"
                  class="shrink-0 px-1.5 py-0.5 text-[length:var(--text-micro)] font-bold uppercase tracking-wider border"
                  :class="
                    isEldenMode
                      ? 'border-[#c9a84c]/40 bg-[#1b0b30] text-[#e2c777]'
                      : 'border-primary/30 bg-primary/10 text-primary'
                  "
                >
                  {{ item.badge }}
                </span>
              </div>
              <p class="text-[length:var(--text-xs)] text-gray-400 leading-snug mt-0.5 line-clamp-1">
                {{ item.subtitle }}
              </p>
            </div>

            <ArrowUpRight
              class="w-4 h-4 shrink-0 opacity-40 group-hover/res:opacity-100 group-hover/res:text-primary transition-all mt-1"
            />
          </button>
        </div>

        <!-- NO RESULTS -->
        <div
          v-else
          class="py-6 text-center border border-white/10 bg-black/40"
        >
          <p class="text-[length:var(--text-sm)] text-gray-300 font-semibold">
            {{ t('search_no_results') }}
          </p>
        </div>
      </div>
    </div>
  </header>
</template>
