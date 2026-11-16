<script setup lang="ts">
import { ref, computed } from 'vue';
import { ChevronLeft, ChevronRight, Layers, Users } from 'lucide-vue-next';
import type { ProjectItem } from '../../types/portfolio';
import { skillIcons } from '../../data/portfolioData';
import { handleImageError, resolveSkill } from '../../utils/portfolioLogic';
import { useI18n } from '../../composables/useI18n';
import { useSfx } from '../../composables/useSfx';
import { useTheme } from '../../composables/useTheme';
import ExpandableTypedText from '../common/ExpandableTypedText.vue';

const props = defineProps<{
  project: ProjectItem;
}>();

const { t, lang } = useI18n();
const sfx = useSfx();
const { isEldenMode } = useTheme();

const imageIndex = ref(0);
const stackExpanded = ref(false);
const teamExpanded = ref(false);

const images = computed(() => props.project.images ?? []);
const currentImage = computed(() => images.value[imageIndex.value] ?? '');

function nextImage() {
  const total = images.value.length;
  if (!total) return;
  imageIndex.value = (imageIndex.value + 1) % total;
  sfx.play('carousel');
}

function prevImage() {
  const total = images.value.length;
  if (!total) return;
  imageIndex.value = (imageIndex.value - 1 + total) % total;
  sfx.play('carousel');
}

function getSkillLabel(key: string): string {
  return resolveSkill(key, lang.value).label;
}
</script>

<template>
  <div
    data-interactive
    class="rpg-card p-4 md:p-5 group flex flex-col h-full transition-all bg-black/60 border-white/10 mb-5 overflow-hidden"
    @mouseenter="sfx.play('hover')"
  >
    <!-- HEADER -->
    <div class="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
      <span class="text-[length:var(--text-micro)] text-primary/80 uppercase tracking-[0.14em] flex items-center gap-1.5">
        <span v-if="isEldenMode" class="text-[#c9a84c]">◆</span>
        {{ t('project_data') }}
      </span>

      <div class="flex gap-1">
        <div class="w-1 h-2 bg-primary/20"></div>
        <div class="w-1 h-2 bg-primary/40"></div>
        <div class="w-1 h-2 bg-primary animate-pulse"></div>
      </div>
    </div>

    <!-- CAROUSEL / ELDEN RING ITEM FRAME -->
    <div
      class="media-reveal-frame media-reveal-inner relative h-36 md:h-44 bg-gray-950 mb-4 overflow-hidden animated leading-none transition-all duration-500"
      :class="
        isEldenMode
          ? 'border border-[#a855f7]/40 shadow-[inset_0_0_0_1px_rgba(201,168,76,0.22),0_6px_16px_rgba(0,0,0,0.75)]'
          : 'border border-white/5'
      "
    >
      <img
        :src="currentImage"
        :alt="project.title"
        @error="handleImageError"
        class="portfolio-media-img block absolute inset-0 w-full h-full object-cover"
      />

      <!-- PREV -->
      <button
        type="button"
        aria-label="Previous image"
        @click="prevImage"
        class="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 flex items-center justify-center bg-black/65 border border-primary hover:bg-primary/20 transition cursor-pointer"
      >
        <ChevronLeft class="w-4 h-4 text-primary" />
      </button>

      <!-- NEXT -->
      <button
        type="button"
        aria-label="Next image"
        @click="nextImage"
        class="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 flex items-center justify-center bg-black/65 border border-primary hover:bg-primary/20 transition cursor-pointer"
      >
        <ChevronRight class="w-4 h-4 text-primary" />
      </button>

      <!-- COUNTER -->
      <div class="absolute bottom-2.5 left-3 z-20 flex items-end gap-1 bg-black/70 px-2 py-0.5 border border-primary/30">
        <div class="text-[length:var(--text-micro)] tracking-[0.1em] text-primary/90">
          <span>{{ String(imageIndex + 1).padStart(2, '0') }}</span>
          /
          <span>{{ String(images.length || 1).padStart(2, '0') }}</span>
        </div>
      </div>
    </div>

    <!-- TITLE -->
    <div v-if="isEldenMode" class="er-title-plaque mb-2">
      <h4 class="font-bold tracking-[0.1em] text-[length:var(--text-md)] uppercase text-[#f5f0ff] truncate">
        {{ project.title }}
      </h4>
    </div>
    <h4 v-else class="font-bold tracking-[0.1em] text-[length:var(--text-md)] truncate uppercase text-white">
      {{ project.title }}
    </h4>

    <!-- ABOUT -->
    <div class="mt-2" :class="isEldenMode ? 'er-guide-block mb-3' : ''">
      <p class="text-[length:var(--text-micro)] text-primary uppercase mb-2 tracking-[0.12em] font-black">
        <span v-if="!isEldenMode">// </span>
        <span>{{ project.type[lang] }}</span>
      </p>

      <ExpandableTypedText
        :text="project.about[lang]"
        :truncate-at="160"
        paragraph-class="text-[length:var(--text-sm)] text-gray-200 tracking-[0.06em] leading-relaxed transition-all duration-300"
      />
    </div>

    <!-- STACK -->
    <details
      class="group/details mt-2"
      :open="stackExpanded"
      @toggle="
        stackExpanded = ($event.target as HTMLDetailsElement).open;
        sfx.play('toggle');
      "
    >
      <summary class="group relative w-full list-none cursor-pointer text-left overflow-hidden select-none">
        <span
          class="absolute left-0 top-0 h-full w-[3px] bg-primary transition-all duration-300 opacity-30 group-open/details:opacity-100 group-open/details:shadow-[0_0_12px_rgba(var(--color-primary-rgb),1)]"
        ></span>

        <div class="relative flex items-center gap-3 px-4 py-2.5 bg-black/50 border border-white/10 hover:border-primary transition">
          <Layers class="w-4 h-4 text-primary shrink-0 transition-all duration-300 opacity-80 group-open/details:opacity-100" />

          <div class="flex-1 min-w-0">
            <p class="text-[length:var(--text-sm)] uppercase tracking-[0.1em] truncate text-primary/90 font-semibold">
              {{ t('stack_analysis') }}
            </p>
            <p class="text-[length:var(--text-micro)] tracking-[0.1em] text-white/50 truncate">
              {{ t('system_modules') }}
            </p>
          </div>

          <span
            class="text-[length:var(--text-xs)] tracking-[0.1em] shrink-0"
            :class="stackExpanded ? 'text-primary' : 'text-white/40'"
          >
            [ {{ stackExpanded ? 'ON' : 'OFF' }} ]
          </span>

          <ChevronRight
            class="w-4 h-4 text-primary shrink-0 transition-transform duration-300 opacity-60 group-open/details:rotate-90 group-open/details:opacity-100"
          />
        </div>
      </summary>

      <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-fade-in">
        <div
          v-for="(s, i) in project.stack"
          :key="s.key ?? i"
          class="relative flex items-center gap-2.5 px-3 py-2 transition group/stack"
          :class="
            isEldenMode
              ? 'er-slot'
              : 'bg-black/35 border border-white/5 hover:border-primary'
          "
        >
          <span v-if="!isEldenMode" class="absolute inset-x-0 top-0 h-px bg-primary/30"></span>

          <i
            v-if="s.type === 'devicon' && skillIcons[s.key]"
            :class="skillIcons[s.key].icon"
            class="text-primary text-[length:var(--text-lg)] shrink-0"
          ></i>

          <div class="flex-1 min-w-0">
            <p class="text-[length:var(--text-micro)] uppercase tracking-[0.1em] text-white truncate">
              <span>{{ getSkillLabel(s.key) }}</span>
            </p>
          </div>

          <span
            class="w-1 h-4 bg-primary"
            :class="isEldenMode ? 'opacity-60' : 'shadow-[0_0_8px_var(--color-primary)] animate-pulse'"
          ></span>
        </div>
      </div>
    </details>

    <!-- TEAM -->
    <details
      class="mt-auto pt-3 group/details"
      :open="teamExpanded"
      @toggle="
        teamExpanded = ($event.target as HTMLDetailsElement).open;
        sfx.play('toggle');
      "
    >
      <summary class="group relative w-full list-none cursor-pointer text-left overflow-hidden select-none">
        <span
          class="absolute left-0 top-0 h-full w-[3px] bg-primary transition-all duration-300 opacity-30 group-open/details:opacity-100 group-open/details:shadow-[0_0_12px_rgba(var(--color-primary-rgb),1)]"
        ></span>

        <div class="relative flex items-center gap-3 px-4 py-2.5 bg-black/50 border border-white/10 hover:border-primary transition min-w-0">
          <Users class="w-4 h-4 text-primary shrink-0 transition-all duration-300 opacity-80 group-open/details:opacity-100" />

          <div class="flex-1 min-w-0">
            <p class="text-[length:var(--text-sm)] uppercase tracking-[0.1em] truncate text-primary/90 font-semibold">
              {{ t('unit_support') }}
            </p>
            <p class="text-[length:var(--text-micro)] tracking-[0.1em] text-white/50 truncate">
              {{ t('auxiliary_modules') }}
            </p>
          </div>

          <span
            class="text-[length:var(--text-xs)] tracking-[0.1em] shrink-0"
            :class="teamExpanded ? 'text-primary' : 'text-white/40'"
          >
            [ {{ teamExpanded ? 'ON' : 'OFF' }} ]
          </span>

          <ChevronRight
            class="w-4 h-4 text-primary shrink-0 transition-transform duration-300 opacity-60 group-open/details:rotate-90 group-open/details:opacity-100"
          />
        </div>
      </summary>

      <div class="grid grid-cols-1 gap-2.5 py-3 animate-fade-in">
        <div
          v-for="member in project.team"
          :key="member.name"
          class="relative group/member flex items-center gap-3.5 p-2 transition-all duration-300"
          :class="
            isEldenMode
              ? 'er-slot'
              : 'bg-black/20 border border-white/5 hover:bg-primary/10 hover:border-primary'
          "
        >
          <span v-if="!isEldenMode" class="absolute inset-x-0 top-0 h-px bg-primary/30"></span>
          <span v-if="!isEldenMode" class="absolute left-0 top-0 h-full w-[2px] bg-primary opacity-30 group-hover/member:opacity-100 transition-all"></span>

          <div class="media-reveal-inner w-10 h-10 shrink-0 overflow-hidden bg-gray-900 relative border border-primary/30 transition-all duration-500">
            <img
              :src="member.avatar_url"
              :alt="member.name"
              @error="handleImageError"
              class="portfolio-member-img w-full h-full object-cover"
            />
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-[length:var(--text-sm)] font-bold uppercase tracking-[0.08em] text-gray-100 truncate">
              {{ member.name }}
            </p>
            <p class="text-[length:var(--text-micro)] uppercase text-primary/80 tracking-[0.08em] truncate">
              <span v-if="!isEldenMode">// </span>
              <span>{{ member.role[lang] }}</span>
            </p>

            <div class="flex gap-3 mt-1">
              <a
                v-if="member.linkedin"
                :href="member.linkedin"
                target="_blank"
                rel="noopener noreferrer"
                class="text-gray-400 icon-primary transition-colors"
              >
                <i class="devicon-linkedin-plain text-[12px]"></i>
              </a>
              <a
                v-if="member.github"
                :href="member.github"
                target="_blank"
                rel="noopener noreferrer"
                class="text-gray-400 icon-primary transition-colors"
              >
                <i class="devicon-github-original text-[12px]"></i>
              </a>
              <a
                v-if="member.portfolio"
                :href="member.portfolio"
                target="_blank"
                rel="noopener noreferrer"
                class="text-gray-400 icon-primary transition-colors"
              >
                <i class="devicon-chrome-plain text-[12px]"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </details>
  </div>
</template>
