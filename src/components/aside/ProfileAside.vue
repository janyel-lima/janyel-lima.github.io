<script setup lang="ts">
import { ref, computed } from 'vue';
import { FileText, Download, ShieldCheck, Eye } from 'lucide-vue-next';
import { devStats } from '../../data/portfolioData';
import { calculateLevel, getResumeAsset, handleImageError } from '../../utils/portfolioLogic';
import { useI18n } from '../../composables/useI18n';
import { useTheme } from '../../composables/useTheme';
import { useSfx } from '../../composables/useSfx';
import SecretFragmentPanel from './SecretFragmentPanel.vue';
import SkillsSubsystem from './SkillsSubsystem.vue';
import TetrisChallengeCard from './TetrisChallengeCard.vue';
import CertViewerModal from '../modals/CertViewerModal.vue';

defineProps<{
  unlocked: boolean;
  showFragment: boolean;
}>();

const emit = defineEmits<{
  (e: 'start-decrypt'): void;
  (e: 'close-fragment'): void;
}>();

const { t, lang } = useI18n();
const { isEldenMode } = useTheme();
const sfx = useSfx();

const previewingResume = ref(false);

const level = computed(() => calculateLevel(devStats.startedCareer));
const resumeAsset = computed(() => getResumeAsset(lang.value));

const tierLabel = computed(() => {
  const map: Record<string, Record<string, string>> = {
    'pt-br': { Junior: 'Júnior', Pleno: 'Pleno', Senior: 'Sênior' },
    'en': { Junior: 'Junior', Pleno: 'Mid-Level', Senior: 'Senior' },
  };
  return map[lang.value]?.[level.value.label] ?? level.value.label;
});

function openResumePreview() {
  sfx.play('cert');
  previewingResume.value = true;
}

function closeResumePreview() {
  sfx.play('close');
  previewingResume.value = false;
}
</script>

<template>
  <aside class="lg:col-span-4 order-1 lg:order-1 space-y-6">
    <div :class="isEldenMode ? 'er-section-banner' : 'mb-6'">
      <h2
        class="font-bold uppercase tracking-[0.1em]"
        :class="isEldenMode ? 'font-elden text-[#e2c777] text-lg' : 'text-accent'"
      >
        {{ t('title_profile') }}
      </h2>
    </div>

    <!-- DEV PROFILE CARD -->
    <div
      data-interactive
      class="rpg-card bg-black/60 p-0 overflow-hidden order-1"
      @mouseenter="sfx.play('hover')"
    >
      <!-- ELDEN RING / TRADITIONAL RECRUITER "CHARACTER STATUS" LAYOUT -->
      <div v-if="isEldenMode" class="p-5 space-y-5">
        <div class="flex justify-between items-center border-b border-[#c9a84c]/25 pb-2.5">
          <div class="flex items-center gap-2">
            <ShieldCheck class="w-4 h-4 text-[#c9a84c]" />
            <span class="font-elden text-xs tracking-[0.12em] text-[#e2c777] uppercase">
              {{ t('dev_data') }}
            </span>
          </div>
          <span class="text-xs text-[#d8b4fe]/80 font-semibold">
            {{ tierLabel }} · {{ level.years }} {{ t('unit_years') }}
          </span>
        </div>

        <!-- ORNATE CHARACTER BASE PORTRAIT FRAME -->
        <div class="relative p-1.5 bg-[#0c0617] border border-[#c9a84c]/40 shadow-[inset_0_0_25px_rgba(0,0,0,0.9)]">
          <div class="aspect-square overflow-hidden relative border border-[#b366ff]/30">
            <img
              src="/img/me.png"
              @error="handleImageError"
              id="photo"
              alt="Janyel B. Lima"
              class="block w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
          <!-- Elden Ring "Select Character Base" Title Plaque -->
          <div class="er-title-plaque mt-2">
            <span class="text-xs uppercase tracking-[0.18em] text-[#c9a84c] block">
              {{ devStats.specialization[lang] }}
            </span>
            <h2 class="text-xl font-bold tracking-[0.12em] text-[#f3efe6] uppercase mt-0.5">
              {{ devStats.name }}
            </h2>
          </div>
        </div>

        <!-- ELDEN RING "CHARACTER STATUS" TABULAR ATTRIBUTE ROWS -->
        <div class="er-guide-block space-y-1 pt-1">
          <div class="text-xs font-elden uppercase tracking-[0.14em] text-[#c9a84c] mb-2">
            {{ lang === 'pt-br' ? 'Atributos Profissionais' : 'Professional Attributes' }}
          </div>

          <div class="er-stat-row">
            <span class="text-sm text-[#f3efe6]/75">{{ t('label_role') }}</span>
            <span class="text-sm font-bold text-[#e2c777] text-right">
              {{ devStats.specialization[lang] }}
            </span>
          </div>

          <div class="er-stat-row">
            <span class="text-sm text-[#f3efe6]/75">{{ t('label_seniority') }}</span>
            <span class="text-sm font-bold text-[#f3efe6] text-right">{{ tierLabel }}</span>
          </div>

          <div class="er-stat-row">
            <span class="text-sm text-[#f3efe6]/75">{{ t('label_exp') }}</span>
            <span class="text-sm font-bold text-[#d8b4fe] text-right">
              {{ level.years }} {{ t('unit_years') }}
            </span>
          </div>

          <div class="er-stat-row">
            <span class="text-sm text-[#f3efe6]/75">
              {{ lang === 'pt-br' ? 'Formação Acadêmica' : 'Education' }}
            </span>
            <span class="text-sm font-semibold text-[#f3efe6] text-right">
              {{ lang === 'pt-br' ? 'Análise e Desenv. de Sistemas' : 'Systems Analysis & Dev.' }}
            </span>
          </div>

          <div class="er-stat-row">
            <span class="text-sm text-[#f3efe6]/75">
              {{ lang === 'pt-br' ? 'Idiomas' : 'Languages' }}
            </span>
            <span class="text-sm font-semibold text-[#f3efe6] text-right">
              {{ lang === 'pt-br' ? 'Português · Inglês Avançado' : 'Portuguese · Advanced English' }}
            </span>
          </div>

          <div class="er-stat-row border-b-0">
            <span class="text-sm text-[#f3efe6]/75">{{ t('label_avail') }}</span>
            <span class="text-sm font-bold text-emerald-300 text-right">
              {{ t('status_avail') }}
            </span>
          </div>
        </div>

        <!-- RESUME DOWNLOAD CTA (LANGUAGE-AWARE) -->
        <div class="pt-2 flex gap-2">
          <a
            :href="resumeAsset.url"
            :download="resumeAsset.filename"
            @click="sfx.play('download')"
            class="rpg-button flex-1 py-3.5 px-4 flex items-center justify-between group/cv cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <FileText class="w-5 h-5 text-[#c9a84c] shrink-0" />
              <div class="flex flex-col">
                <span class="text-sm tracking-[0.08em] font-bold uppercase text-[#f3efe6]">
                  {{ t('btn_cv') }}
                </span>
                <span class="text-xs text-[#d8b4fe]/75">
                  {{ t('cv_version') }} ({{ resumeAsset.badge }})
                </span>
              </div>
            </div>
            <Download class="w-4 h-4 text-[#c9a84c]" />
          </a>

          <button
            type="button"
            :aria-label="lang === 'pt-br' ? 'Visualizar Currículo' : 'Preview Resume'"
            @click="openResumePreview"
            class="rpg-button px-3.5 py-3.5 flex items-center justify-center text-[#c9a84c] hover:text-[#f3efe6] cursor-pointer"
          >
            <Eye class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- TURQUOISE ('core') MODERN TECH HUD LAYOUT -->
      <div v-else class="p-5 space-y-6">
        <div class="space-y-4">
          <div class="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
            <span class="text-[length:var(--text-micro)] tracking-[0.1em] text-primary/60 uppercase">
              {{ t('dev_data') }}
            </span>
            <div class="flex gap-1">
              <div class="w-1 h-2 bg-primary/20"></div>
              <div class="w-1 h-2 bg-primary/40"></div>
              <div class="w-1 h-2 bg-primary animate-pulse"></div>
            </div>
          </div>

          <div class="relative group">
            <span class="text-[length:var(--text-micro)] tracking-[0.1em] text-gray-400 uppercase block mb-1">
              {{ t('bio_scan') }}
            </span>
            <div class="animated w-full aspect-square bg-gray-900 overflow-hidden relative border border-white/5">
              <img
                src="/img/me.png"
                @error="handleImageError"
                id="photo"
                alt="Janyel B. Lima"
                class="block w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
              />
              <div class="absolute inset-0 pointer-events-none opacity-20 z-10"></div>
            </div>
          </div>

          <div class="border-l-2 pl-3 border-primary">
            <span class="text-[length:var(--text-xs)] text-gray-400 uppercase block">
              {{ t('label_id') }}
            </span>
            <h2 class="text-xl font-black tracking-[0.1em] uppercase italic text-white">
              <span>{{ devStats.name }}</span>
            </h2>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 bg-white/5 p-3 border border-white/5">
          <div>
            <span class="text-[length:var(--text-sm)] text-gray-400 uppercase block mb-1">
              {{ t('label_role') }}
            </span>
            <p class="text-[length:var(--text-md)] text-accent uppercase tracking-widest truncate font-bold">
              {{ devStats.specialization[lang] }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
            <div>
              <span class="text-[length:var(--text-sm)] text-gray-400 uppercase block mb-1">
                {{ t('label_seniority') }}
              </span>
              <div class="text-[length:var(--text-md)] text-white uppercase tracking-widest truncate">
                {{ tierLabel }}
              </div>
            </div>
            <div class="flex flex-col justify-end">
              <span class="text-[length:var(--text-sm)] text-gray-400 uppercase block mb-1">
                {{ t('label_exp') }}
              </span>

              <div class="flex justify-between text-[length:var(--text-md)] mb-1">
                <span class="text-primary">{{ level.years }}</span>
                <span class="text-gray-400">{{ t('unit_years') }}</span>
              </div>
              <div class="h-1 bg-black/60 border border-white/5 p-[0.5px] w-full">
                <div
                  class="h-full bg-primary shadow-[0_0_8px_var(--color-primary)] transition-all duration-1000"
                  :style="{ width: `${level.percent}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex justify-between items-center border-b border-white/5 pb-2">
            <span class="text-[length:var(--text-xs)] tracking-[0.05em] text-gray-400 uppercase">
              {{ t('label_avail') }}
            </span>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]"></span>
              <p class="text-[length:var(--text-xs)] tracking-[0.05em] text-accent uppercase font-bold">
                {{ t('status_avail') }}
              </p>
            </div>
          </div>

          <div class="pt-2 flex gap-2">
            <a
              :href="resumeAsset.url"
              :download="resumeAsset.filename"
              @click="sfx.play('download')"
              class="rpg-button flex-1 py-4 px-4 flex items-center justify-between group/cv border-accent/30 hover:border-accent bg-accent/5"
            >
              <div class="flex items-center gap-3.5">
                <div class="relative">
                  <FileText class="w-5 h-5 text-accent shrink-0 transition-transform group-hover/cv:-translate-y-1" />
                </div>
                <div class="flex flex-col">
                  <span class="text-[length:var(--text-md)] tracking-[0.1em] font-black uppercase text-white">
                    {{ t('btn_cv') }}
                  </span>
                  <span class="text-[length:var(--text-micro)] text-accent/80 uppercase">
                    {{ t('cv_version') }} · {{ resumeAsset.badge }}
                  </span>
                </div>
              </div>
              <Download class="w-4 h-4 text-accent animate-bounce" />
            </a>

            <button
              type="button"
              :aria-label="lang === 'pt-br' ? 'Visualizar Currículo' : 'Preview Resume'"
              @click="openResumePreview"
              class="rpg-button px-3.5 py-4 flex items-center justify-center border-accent/30 hover:border-accent bg-accent/5 text-accent hover:text-primary cursor-pointer"
            >
              <Eye class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- RESUME PREVIEW MODAL -->
    <CertViewerModal
      v-if="previewingResume"
      :file="resumeAsset.url"
      doc-type="resume"
      :display-name="resumeAsset.filename"
      :download-name="resumeAsset.filename"
      @close="closeResumePreview"
    />

    <!-- SECRET FRAGMENT & SOCIALS -->
    <SecretFragmentPanel
      :unlocked="unlocked"
      :show-fragment="showFragment"
      @start-decrypt="emit('start-decrypt')"
      @close-fragment="emit('close-fragment')"
    />

    <!-- SKILLS SUBSYSTEM & CHARTS -->
    <SkillsSubsystem />

    <!-- TETRIS CHALLENGE -->
    <TetrisChallengeCard />
  </aside>
</template>
