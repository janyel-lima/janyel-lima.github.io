<script setup lang="ts">
import { ref } from 'vue';
import {
  Cpu,
  Brain,
  ChevronRight,
  Lightbulb,
  BrainCircuit,
  Speech,
  Rocket,
  Crown,
  Puzzle,
  BrainCog,
  HeartHandshake,
  Users,
} from 'lucide-vue-next';
import { skillLevels, skillIcons } from '../../data/portfolioData';
import { useI18n } from '../../composables/useI18n';
import { useTheme } from '../../composables/useTheme';
import { useSfx } from '../../composables/useSfx';
import SkillChartPanel from './SkillChartPanel.vue';

const { t } = useI18n();
const { isEldenMode } = useTheme();
const sfx = useSfx();

const rankLegendOpen = ref(false);
const hardOpen = ref(false);
const softOpen = ref(false);
const selectedHardSkill = ref<string | null>(null);
const selectedSoftSkill = ref<string | null>(null);

const hardChartHeight = Object.keys(skillLevels.hard).length * 18 + 36;

const lucideSoftMap: Record<string, any> = {
  lightbulb: Lightbulb,
  'brain-circuit': BrainCircuit,
  speech: Speech,
  rocket: Rocket,
  crown: Crown,
  'chess-king': Crown,
  puzzle: Puzzle,
  'brain-cog': BrainCog,
  'heart-handshake': HeartHandshake,
  users: Users,
};

function toggleHardSkillSelection(skillKey: string) {
  sfx.play('toggle');
  selectedHardSkill.value =
    selectedHardSkill.value === skillKey ? null : skillKey;
}

function toggleSoftSkillSelection(skillKey: string) {
  sfx.play('toggle');
  selectedSoftSkill.value =
    selectedSoftSkill.value === skillKey ? null : skillKey;
}
</script>

<template>
  <div>
    <div
      data-interactive
      @mouseenter="sfx.play('hover')"
      class="order-4 bg-black/60 rpg-card p-5 mb-10"
    >
      <!-- HEADER -->
      <div class="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <span
          class="text-[length:var(--text-sm)] uppercase tracking-widest"
          :class="isEldenMode ? 'font-elden text-[#e2c777] font-bold' : 'text-white'"
        >
          {{ t('skills_title') }}
        </span>

        <div v-if="!isEldenMode" class="flex gap-1">
          <div class="w-1 h-2 bg-primary/20"></div>
          <div class="w-1 h-2 bg-primary/40"></div>
          <div class="w-1 h-2 bg-primary animate-pulse"></div>
        </div>
      </div>

      <!-- RANK LEGEND -->
      <div class="mb-4 border-b border-white/10 pb-3">
        <button
          type="button"
          @click="
            rankLegendOpen = !rankLegendOpen;
            sfx.play('toggle');
          "
          class="flex items-center gap-3 text-[length:var(--text-micro)] uppercase tracking-widest text-primary/80 hover:text-primary transition group cursor-pointer"
        >
          <span :class="isEldenMode ? 'font-elden text-[length:var(--text-xs)] text-[#c9a84c]' : ''">
            {{ t('rank_legend') }}
          </span>
          <span
            class="text-[length:var(--text-md)] transition-all duration-300 text-primary/60 group-hover:text-primary"
            :class="
              rankLegendOpen
                ? 'rotate-90 drop-shadow-[0_0_6px_rgba(var(--color-primary-rgb),1)]'
                : ''
            "
          >
            ▶
          </span>
        </button>

        <div
          v-show="rankLegendOpen"
          class="mt-3 space-y-2 text-[length:var(--text-micro)] uppercase tracking-widest animate-fade-in"
        >
          <div class="flex items-center justify-between border-b border-white/5 pb-1">
            <span class="text-primary font-black italic tracking-wider">S</span>
            <span class="text-white/85 tracking-[0.06em]">{{ t('rank_s') }}</span>
          </div>
          <div class="flex items-center justify-between border-b border-white/5 pb-1">
            <span class="text-primary font-black italic tracking-wider">A</span>
            <span class="text-white/80 tracking-[0.06em]">{{ t('rank_a') }}</span>
          </div>
          <div class="flex items-center justify-between border-b border-white/5 pb-1">
            <span class="text-primary/90 font-black italic tracking-wider">B</span>
            <span class="text-white/75 tracking-[0.06em]">{{ t('rank_b') }}</span>
          </div>
          <div class="flex items-center justify-between border-b border-white/5 pb-1">
            <span class="text-primary/80 font-black italic tracking-wider">C</span>
            <span class="text-white/70 tracking-[0.06em]">{{ t('rank_c') }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-primary/70 font-black italic tracking-wider">D</span>
            <span class="text-white/60 tracking-[0.06em]">{{ t('rank_d') }}</span>
          </div>
        </div>
      </div>

      <!-- SKILLS PANELS -->
      <div class="relative space-y-6">
        <!-- HARD SKILLS -->
        <section class="relative">
          <button
            type="button"
            @click="
              hardOpen = !hardOpen;
              sfx.play('toggle');
            "
            class="group relative w-full text-left overflow-hidden cursor-pointer"
          >
            <span
              class="absolute left-0 top-0 h-full w-[3px] bg-primary transition-all duration-300"
              :class="
                hardOpen
                  ? 'opacity-100 shadow-[0_0_12px_rgba(var(--color-primary-rgb),1)]'
                  : 'opacity-30'
              "
            ></span>

            <div class="relative flex items-center gap-3 px-4 py-3 bg-black/50 border border-white/10 hover:border-primary transition min-w-0">
              <Cpu
                class="w-5 h-5 text-primary shrink-0 transition-all duration-300"
                :class="
                  hardOpen
                    ? 'scale-110 drop-shadow-[0_0_8px_rgba(var(--color-primary-rgb),1)]'
                    : 'opacity-70'
                "
              />

              <div class="flex-1 min-w-0">
                <p
                  class="text-[length:var(--text-sm)] uppercase tracking-[0.08em] truncate"
                  :class="[
                    hardOpen ? 'text-primary' : 'text-primary/70',
                    isEldenMode ? 'font-elden text-[#f3efe6]' : '',
                  ]"
                >
                  {{ t('hard_skills') }}
                </p>
              </div>

              <span
                class="text-[length:var(--text-xs)] tracking-widest shrink-0"
                :class="hardOpen ? 'text-primary' : 'text-white/40'"
              >
                [ {{ hardOpen ? 'ON' : 'OFF' }} ]
              </span>

              <ChevronRight
                class="w-4 h-4 text-primary shrink-0 transition-transform duration-300"
                :class="
                  hardOpen
                    ? 'rotate-90 drop-shadow-[0_0_6px_rgba(var(--color-primary-rgb),1)]'
                    : 'opacity-60'
                "
              />
            </div>
          </button>

          <div v-show="hardOpen" class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-fade-in">
            <button
              v-for="(data, skill) in skillLevels.hard"
              :key="skill"
              type="button"
              @click="toggleHardSkillSelection(String(skill))"
              class="relative flex items-center gap-3 px-3 py-2.5 text-left transition cursor-pointer"
              :class="[
                isEldenMode
                  ? 'er-slot'
                  : 'bg-black/35 border border-white/5 hover:border-primary',
                selectedHardSkill === String(skill)
                  ? isEldenMode
                    ? '!border-[#c9a84c] bg-[#b366ff]/20 shadow-[0_0_14px_rgba(201,168,76,0.35)]'
                    : '!border-primary bg-primary/15 shadow-[0_0_12px_rgba(var(--color-primary-rgb),0.3)]'
                  : '',
              ]"
            >
              <span v-if="!isEldenMode" class="absolute inset-x-0 top-0 h-px bg-primary/30"></span>

              <i
                v-if="skillIcons[data.label]?.type === 'devicon'"
                :class="skillIcons[data.label].icon"
                class="text-primary text-[length:var(--text-lg)] shrink-0"
              ></i>

              <div class="flex-1 min-w-0">
                <p
                  class="truncate"
                  :class="
                    isEldenMode
                      ? 'text-[length:var(--text-xs)] font-semibold text-[#f3efe6] tracking-wide'
                      : 'text-[length:var(--text-micro)] uppercase tracking-widest text-white'
                  "
                >
                  {{ t(`skills.${data.label}`) }}
                </p>
              </div>

              <span
                class="font-black"
                :class="
                  isEldenMode
                    ? 'text-[length:var(--text-sm)] font-elden text-[#e2c777] px-1.5 py-0.5 bg-[#1b0b30] border border-[#c9a84c]/40'
                    : 'text-[length:var(--text-xl)] animate-pulse italic text-primary'
                "
              >
                {{ data.level }}
              </span>
            </button>
          </div>
        </section>

        <!-- SOFT SKILLS -->
        <section class="relative">
          <button
            type="button"
            @click="
              softOpen = !softOpen;
              sfx.play('toggle');
            "
            class="group relative w-full text-left overflow-hidden cursor-pointer"
          >
            <span
              class="absolute left-0 top-0 h-full w-[3px] bg-primary transition-all duration-300"
              :class="
                softOpen
                  ? 'opacity-100 shadow-[0_0_12px_rgba(var(--color-primary-rgb),1)]'
                  : 'opacity-30'
              "
            ></span>

            <div class="relative flex items-center gap-3 px-4 py-3 bg-black/50 border border-white/10 hover:border-primary transition min-w-0">
              <Brain
                class="w-5 h-5 text-primary shrink-0 transition-all duration-300"
                :class="
                  softOpen
                    ? 'scale-110 drop-shadow-[0_0_8px_rgba(var(--color-primary-rgb),1)]'
                    : 'opacity-70'
                "
              />

              <div class="flex-1 min-w-0">
                <p
                  class="text-[length:var(--text-sm)] uppercase tracking-[0.08em] truncate"
                  :class="[
                    softOpen ? 'text-primary' : 'text-primary/70',
                    isEldenMode ? 'font-elden text-[#f3efe6]' : '',
                  ]"
                >
                  {{ t('soft_skills') }}
                </p>
              </div>

              <span
                class="text-[length:var(--text-xs)] tracking-widest shrink-0"
                :class="softOpen ? 'text-primary' : 'text-white/40'"
              >
                [ {{ softOpen ? 'ON' : 'OFF' }} ]
              </span>

              <ChevronRight
                class="w-4 h-4 text-primary shrink-0 transition-transform duration-300"
                :class="
                  softOpen
                    ? 'rotate-90 drop-shadow-[0_0_6px_rgba(var(--color-primary-rgb),1)]'
                    : 'opacity-60'
                "
              />
            </div>
          </button>

          <div v-show="softOpen" class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-fade-in">
            <button
              v-for="(data, skill) in skillLevels.soft"
              :key="skill"
              type="button"
              @click="toggleSoftSkillSelection(String(skill))"
              class="relative flex items-center gap-3 px-3 py-2.5 text-left transition cursor-pointer"
              :class="[
                isEldenMode
                  ? 'er-slot'
                  : 'bg-black/35 border border-white/5 hover:border-primary',
                selectedSoftSkill === String(skill)
                  ? isEldenMode
                    ? '!border-[#c9a84c] bg-[#b366ff]/20 shadow-[0_0_14px_rgba(201,168,76,0.35)]'
                    : '!border-primary bg-primary/15 shadow-[0_0_12px_rgba(var(--color-primary-rgb),0.3)]'
                  : '',
              ]"
            >
              <span v-if="!isEldenMode" class="absolute inset-x-0 top-0 h-px bg-primary/30"></span>

              <component
                v-if="skillIcons[data.label]?.type === 'lucide' && lucideSoftMap[skillIcons[data.label].icon]"
                :is="lucideSoftMap[skillIcons[data.label].icon]"
                class="w-5 h-5 text-primary shrink-0 transition-all duration-300"
              />

              <div class="flex-1 min-w-0">
                <p
                  class="truncate"
                  :class="
                    isEldenMode
                      ? 'text-[length:var(--text-xs)] font-semibold text-[#f3efe6] tracking-wide'
                      : 'text-[length:var(--text-micro)] uppercase tracking-widest text-white'
                  "
                >
                  {{ t(`skills.${data.label}`) }}
                </p>
              </div>

              <span
                class="font-black"
                :class="
                  isEldenMode
                    ? 'text-[length:var(--text-sm)] font-elden text-[#e2c777] px-1.5 py-0.5 bg-[#1b0b30] border border-[#c9a84c]/40'
                    : 'text-[length:var(--text-xl)] animate-pulse italic text-primary'
                "
              >
                {{ data.level }}
              </span>
            </button>
          </div>
        </section>
      </div>
    </div>

    <!-- HARD SKILLS CHART PANEL -->
    <div
      v-if="hardOpen"
      data-interactive
      class="order-3 relative flex bg-black/60 mb-10 border-primary border border-white/10 group overflow-hidden animate-fade-in rpg-card"
      style="clip-path: polygon(0 0, 100% 0, 100% 85%, 92% 100%, 0 100%)"
    >
      <div class="w-1 bg-primary shadow-[2px_0_10px_rgba(var(--color-primary-rgb),0.3)]"></div>
      <div class="scan-line"></div>

      <div class="p-4 pr-6 w-full">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-2 h-2 bg-primary rotate-45 shadow-[0_0_8px_var(--color-primary)]"></div>
          <h5 class="text-[length:var(--text-md)] font-black uppercase tracking-[0.1em] text-primary">
            {{ t('hard_title') }}
          </h5>
        </div>

        <SkillChartPanel
          canvas-id="hardSkillsChart"
          category="hard"
          :skills-data="skillLevels.hard"
          :height-px="hardChartHeight"
          :selected-skill-key="selectedHardSkill"
          @select-skill="selectedHardSkill = $event"
        />
      </div>
    </div>

    <!-- SOFT SKILLS CHART PANEL -->
    <div
      v-if="softOpen"
      data-interactive
      class="order-3 relative flex bg-black/60 mb-10 border-primary border border-white/10 group overflow-hidden animate-fade-in rpg-card"
      style="clip-path: polygon(0 0, 100% 0, 100% 85%, 92% 100%, 0 100%)"
    >
      <div class="w-1 bg-primary shadow-[2px_0_10px_rgba(var(--color-primary-rgb),0.3)]"></div>
      <div class="scan-line"></div>

      <div class="p-4 pr-6 w-full">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-2 h-2 bg-primary rotate-45 shadow-[0_0_8px_var(--color-primary)]"></div>
          <h5 class="text-[length:var(--text-md)] font-black uppercase tracking-[0.1em] text-primary">
            {{ t('soft_title') }}
          </h5>
        </div>

        <SkillChartPanel
          canvas-id="softSkillsChart"
          category="soft"
          :skills-data="skillLevels.soft"
          :height-px="255"
          :selected-skill-key="selectedSoftSkill"
          @select-skill="selectedSoftSkill = $event"
        />
      </div>
    </div>
  </div>
</template>
