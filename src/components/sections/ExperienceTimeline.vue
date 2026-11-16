<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ListCollapse, Layers } from 'lucide-vue-next';
import { devStats, skillIcons } from '../../data/portfolioData';
import { resolveSkill } from '../../utils/portfolioLogic';
import { useI18n } from '../../composables/useI18n';
import { useSfx } from '../../composables/useSfx';
import { useTheme } from '../../composables/useTheme';
import ExpandableTypedText from '../common/ExpandableTypedText.vue';

const { t, lang } = useI18n();
const sfx = useSfx();
const { isEldenMode } = useTheme();

const allOpen = ref(false);
const openCards = reactive<Record<string, boolean>>({});
const openSkills = reactive<Record<string, boolean>>({});

devStats.history.forEach((job) => {
  openCards[job.id] = false;
  openSkills[job.id] = false;
});

function toggleAll() {
  allOpen.value = !allOpen.value;
  sfx.play('timeline');
  devStats.history.forEach((job) => {
    openCards[job.id] = allOpen.value;
  });
}

function toggleCard(id: string) {
  openCards[id] = !openCards[id];
  sfx.play('toggle');
}

function getSkillLabel(key: string): string {
  return resolveSkill(key, lang.value).label;
}
</script>

<template>
  <div>
    <!-- TIMELINE INTRO FRAGMENT -->
    <div
      class="relative flex bg-black/60 border-primary border-white/10 mb-6 group overflow-hidden"
      :class="isEldenMode ? 'rpg-card p-1' : ''"
      :style="isEldenMode ? '' : 'clip-path: polygon(0 0, 100% 0, 100% 85%, 92% 100%, 0 100%)'"
    >
      <div
        v-if="!isEldenMode"
        class="w-1 bg-primary shadow-[2px_0_10px_rgba(var(--color-primary-rgb),0.3)]"
      ></div>
      <div class="scan-line"></div>
      <div class="p-4 pr-6 w-full" :class="isEldenMode ? 'er-guide-block ml-3 my-1' : ''">
        <div class="flex items-center gap-2 mb-3">
          <div
            class="w-2 h-2 rotate-45 shadow-[0_0_8px_var(--color-primary)]"
            :class="isEldenMode ? 'bg-[#c9a84c]' : 'bg-primary'"
          ></div>
          <h5 class="text-[length:var(--text-md)] font-black uppercase tracking-[0.1em] text-primary">
            {{ t('timeline_fragment') }}
          </h5>
        </div>

        <div class="text-[length:var(--text-xs)] text-gray-400 uppercase mb-1 tracking-[0.1em]">
          {{ t('transmission_source') }}
        </div>

        <p class="text-[length:var(--text-base)] tracking-[0.06em] text-gray-200 leading-relaxed group-hover:text-white transition-colors">
          {{ t('timeline_source') }}
        </p>
      </div>

      <div
        v-if="!isEldenMode"
        class="absolute bottom-0 right-0 w-2 h-2 bg-primary/20"
        style="clip-path: polygon(100% 0, 100% 100%, 0 100%)"
      ></div>
    </div>

    <!-- EXPERIENCE TIMELINE -->
    <div id="exp">
      <div class="flex items-center justify-between gap-4 mb-6">
        <h2
          class="text-accent font-bold text-[length:var(--text-md)] uppercase tracking-[0.1em] flex-1"
          :class="isEldenMode ? 'er-section-banner' : ''"
        >
          {{ t('title_exp') }}
        </h2>

        <button
          type="button"
          data-interactive
          @click="toggleAll"
          class="flex items-center gap-2 sm:gap-3 px-3 py-1.5 bg-black/50 border border-white/10 hover:border-primary transition cursor-pointer select-none flex-shrink-0"
        >
          <ListCollapse
            class="w-3.5 h-3.5 text-primary transition-transform duration-300"
            :class="allOpen ? '' : 'rotate-180'"
          />

          <p class="text-[length:var(--text-micro)] uppercase tracking-[0.2em] text-primary/80 hidden sm:block">
            <span>{{ allOpen ? t('collapse_all') : t('expand_all') }}</span>
          </p>

          <span
            class="text-[length:var(--text-micro)] tracking-[0.1em]"
            :class="allOpen ? 'text-primary' : 'text-white/40'"
          >
            [ {{ allOpen ? 'ON' : 'OFF' }} ]
          </span>
        </button>
      </div>

      <div id="experience-timeline" @mouseenter="sfx.play('hover')" class="space-y-0">
        <div
          v-for="(job, index) in devStats.history"
          :key="job.id"
          class="relative flex items-start gap-3 sm:gap-4 pb-10 sm:pb-12 last:pb-0"
        >
          <!-- SINGLE CONTINUOUS TIMELINE AXIS (centered at x = 8px) -->
          <span
            class="absolute left-[7px] w-[2px] pointer-events-none"
            :class="[
              index === 0 ? 'top-[18px]' : 'top-0',
              'bottom-0',
              isEldenMode
                ? 'bg-gradient-to-b from-[#c9a84c]/75 via-[#b366ff]/65 to-[#c9a84c]/75'
                : 'bg-primary shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.45)]',
            ]"
          ></span>

          <!-- NODE + YEAR RAIL -->
          <div
            data-non-interactive
            class="relative z-10 flex items-center gap-2.5 sm:gap-3 pt-2.5 shrink-0"
          >
            <!-- DIAMOND NODE (16x16px, center at x = 8px) -->
            <div
              data-timeline-node
              class="w-4 h-4 bg-main border-2 rotate-45 flex items-center justify-center shrink-0 transition-all duration-300"
              :class="[
                isEldenMode ? 'border-[#c9a84c]' : 'border-primary',
                openCards[job.id]
                  ? 'shadow-[0_0_10px_var(--color-primary)]'
                  : 'shadow-[0_0_18px_var(--color-primary)] scale-110',
              ]"
            >
              <div
                class="w-1.5 h-1.5 animate-pulse"
                :class="isEldenMode ? 'bg-[#c9a84c]' : 'bg-primary'"
              ></div>
            </div>

            <!-- YEAR LABEL -->
            <div
              data-timeline-year
              class="w-10 sm:w-11 text-[length:var(--text-sm)] font-bold tracking-[0.08em] uppercase tabular-nums leading-none select-none"
              :class="isEldenMode ? 'font-elden text-[#e2c777]' : 'text-white'"
            >
              <span>{{ job.period[lang].split(' ')[0] }}</span>
            </div>
          </div>

          <!-- CARD -->
          <div data-interactive class="flex-1 min-w-0">
            <div
              class="rpg-card relative bg-black/65 border-white/5 hover:border-primary transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.15)] overflow-hidden"
            >
              <div class="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent"></div>

              <!-- HEADER -->
              <div
                class="p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-start bg-primary/5 cursor-pointer select-none group/header"
                @click="toggleCard(job.id)"
              >
                <div class="space-y-1 min-w-0 flex-1">
                  <h3 class="font-black text-white uppercase tracking-[0.1em] text-[length:var(--text-md)] leading-tight">
                    {{ job.role[lang] }}
                  </h3>

                  <p class="text-[length:var(--text-micro)] uppercase tracking-[0.1em] text-primary">
                    <span>{{ t('deploy') }}</span>
                    <span class="mx-1 text-primary/40">:</span>
                    <span class="text-white/90 font-semibold">{{ job.company }}</span>
                  </p>
                </div>

                <div class="text-left sm:text-right flex-shrink-0 flex items-start gap-3">
                  <div>
                    <p class="text-[length:var(--text-micro)] uppercase tracking-[0.1em] text-white/50 mb-1">
                      {{ t('period') }}
                    </p>
                    <p class="text-[length:var(--text-sm)] text-white bg-white/5 px-2.5 py-0.5 inline-block border border-primary/20">
                      <span>{{ job.period[lang] }}</span>
                    </p>
                  </div>

                  <div
                    class="flex items-center gap-1.5 mt-0.5 text-[length:var(--text-micro)] tracking-[0.1em] transition-colors duration-200"
                    :class="openCards[job.id] ? 'text-primary' : 'text-white/30'"
                  >
                    <span>[</span>
                    <span
                      class="inline-block transition-transform duration-300 text-primary text-[8px]"
                      :class="openCards[job.id] ? 'rotate-45' : 'rotate-0 text-white/30'"
                    >
                      ◆
                    </span>
                    <span>]</span>
                  </div>
                </div>
              </div>

              <!-- BODY -->
              <div
                v-show="openCards[job.id]"
                class="p-3 sm:p-4 space-y-4 sm:space-y-5 animate-fade-in"
              >
                <div
                  class="text-[length:var(--text-sm)] text-gray-200 leading-relaxed"
                  :class="isEldenMode ? 'er-guide-block' : 'border-l border-primary pl-3'"
                >
                  <ExpandableTypedText
                    :text="job.description[lang]"
                    :truncate-at="180"
                    paragraph-class="mb-2 whitespace-pre-line tracking-[0.06em] transition-all duration-300"
                  />
                </div>

                <!-- SKILLS SUBSYSTEM -->
                <details
                  class="group/details"
                  :open="openSkills[job.id]"
                  @toggle="
                    openSkills[job.id] = ($event.target as HTMLDetailsElement).open;
                    sfx.play('toggle');
                  "
                >
                  <summary class="list-none cursor-pointer select-none">
                    <div class="flex items-center gap-3 px-3 py-2 bg-black/50 border border-white/10 hover:border-primary transition">
                      <Layers class="w-4 h-4 text-primary transition group-open/details:scale-110" />

                      <p class="text-[length:var(--text-micro)] uppercase tracking-[0.22em] text-primary/90 font-semibold">
                        <span>{{ t('skills_used') }}</span>
                      </p>

                      <span
                        class="ml-auto text-[length:var(--text-micro)] tracking-[0.1em]"
                        :class="openSkills[job.id] ? 'text-primary' : 'text-white/40'"
                      >
                        [ {{ openSkills[job.id] ? 'ON' : 'OFF' }} ]
                      </span>
                    </div>
                  </summary>

                  <div class="scrollbar-thin-cyber relative overflow-x-auto py-3">
                    <span class="absolute left-0 right-0 top-0 h-px bg-primary/20"></span>

                    <div class="flex flex-wrap gap-2 sm:gap-2.5 px-1 pt-2">
                      <div
                        v-for="s in job.skills"
                        :key="s.key"
                        class="relative flex items-center gap-2 px-2.5 py-1.5 transition"
                        :class="
                          isEldenMode
                            ? 'er-slot'
                            : 'bg-black/40 border border-white/5 hover:border-primary'
                        "
                      >
                        <span v-if="!isEldenMode" class="absolute inset-x-0 top-0 h-px bg-primary/30"></span>

                        <i
                          v-if="s.type === 'devicon' && skillIcons[s.key]"
                          :class="skillIcons[s.key].icon"
                          class="text-primary text-[length:var(--text-base)] shrink-0"
                        ></i>

                        <p class="text-[length:var(--text-micro)] uppercase tracking-[0.1em] text-white/95 truncate">
                          <span>{{ getSkillLabel(s.key) }}</span>
                        </p>

                        <span
                          class="w-1 h-3.5 bg-primary"
                          :class="isEldenMode ? 'opacity-60' : 'shadow-[0_0_6px_var(--color-primary)] animate-pulse'"
                        ></span>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
