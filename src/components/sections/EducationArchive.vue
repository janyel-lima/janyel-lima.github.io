<script setup lang="ts">
import { ref, reactive } from 'vue';
import {
  GraduationCap,
  Landmark,
  Library,
  Languages,
  ChevronDown,
  BookOpenCheck,
  TrendingUp,
  Braces,
  BarChart2,
  Workflow,
  MessageCircle,
  Globe,
  BookOpen,
  ShieldCheck,
  Clock,
  FileBadge,
  ExternalLink,
} from 'lucide-vue-next';
import { educationLogs } from '../../data/portfolioData';
import { useI18n } from '../../composables/useI18n';
import { useSfx } from '../../composables/useSfx';
import { useTheme } from '../../composables/useTheme';
import CertViewerModal from '../modals/CertViewerModal.vue';

const { t } = useI18n();
const sfx = useSfx();
const { isEldenMode } = useTheme();

const secOpen = reactive<Record<string, boolean>>({
  higher: false,
  courses: false,
  languages: false,
});

const itemOpen = reactive<Record<string, boolean>>({});
const activeCertFile = ref<string | null>(null);

Object.values(educationLogs)
  .flat()
  .forEach((item) => {
    itemOpen[item.title_key] = false;
  });

const iconMap: Record<string, any> = {
  'graduation-cap': GraduationCap,
  'book-open-check': BookOpenCheck,
  'trending-up': TrendingUp,
  braces: Braces,
  'bar-chart-2': BarChart2,
  workflow: Workflow,
  'message-circle': MessageCircle,
  globe: Globe,
  languages: Languages,
  'book-open': BookOpen,
};

function toggleSection(section: string) {
  secOpen[section] = !secOpen[section];
  sfx.play('toggle');
}

function toggleItem(key: string) {
  itemOpen[key] = !itemOpen[key];
  sfx.play('toggle');
}

function openCert(file: string) {
  sfx.play('cert');
  activeCertFile.value = file;
}

function closeCert() {
  sfx.play('close');
  activeCertFile.value = null;
}

function getSectionTitleKey(section: string): string {
  if (section === 'higher') return 'higher_education';
  if (section === 'languages') return 'edu_languages';
  return 'courses';
}
</script>

<template>
  <div>
    <!-- ACADEMIC INTRO FRAGMENT -->
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
            {{ t('academic_fragment') }}
          </h5>
        </div>

        <div class="text-[length:var(--text-xs)] text-gray-400 uppercase mb-1 tracking-[0.1em]">
          {{ t('transmission_source') }}
        </div>

        <p class="text-[length:var(--text-base)] tracking-[0.06em] text-gray-200 leading-relaxed group-hover:text-white transition-colors">
          {{ t('academic_source') }}
        </p>
      </div>

      <div
        v-if="!isEldenMode"
        class="absolute bottom-0 right-0 w-2 h-2 bg-primary/20"
        style="clip-path: polygon(100% 0, 100% 100%, 0 100%)"
      ></div>
    </div>

    <!-- ARCHIVE NODE -->
    <div class="edu-node relative mb-10" data-interactive>
      <div
        class="rpg-card relative bg-black/70"
        :style="isEldenMode ? '' : 'clip-path: polygon(0 0, 100% 0, 100% 96%, 92% 100%, 0 100%)'"
      >
        <!-- HEADER -->
        <div class="relative flex items-center justify-between px-5 py-3.5 border-b border-white/20 bg-gradient-to-r from-primary/10 via-transparent to-transparent">
          <div class="flex items-center gap-3">
            <div
              class="relative flex items-center justify-center w-9 h-9 bg-primary/10 shadow-[0_0_14px_rgba(var(--color-primary-rgb),0.30)]"
              :class="isEldenMode ? 'er-slot' : ''"
              :style="isEldenMode ? '' : 'clip-path: polygon(20% 0, 80% 0, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0 80%, 0 20%)'"
            >
              <GraduationCap class="w-5 h-5 text-primary" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <div
                  class="w-1.5 h-1.5 rotate-45 shadow-[0_0_6px_var(--color-primary)]"
                  :class="isEldenMode ? 'bg-[#c9a84c]' : 'bg-primary'"
                ></div>
                <span class="text-[length:var(--text-base)] font-black uppercase tracking-[0.12em] text-primary">
                  {{ t('edu_archive_title') }}
                </span>
              </div>
              <span class="text-[length:var(--text-xs)] text-primary/60 uppercase tracking-[0.18em]">
                {{ t('edu_knowledge_loaded') }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="hidden sm:flex flex-col items-end gap-0.5">
              <span class="text-[length:var(--text-xs)] text-primary/55 uppercase tracking-[0.1em]">
                {{ t('edu_node_id') }}
              </span>
              <span class="text-[length:var(--text-sm)] text-primary/80 font-black tracking-[0.1em]">
                {{ t('edu_node_code') }}
              </span>
            </div>
          </div>
        </div>

        <!-- BODY -->
        <div class="relative p-5 space-y-4">
          <div
            v-for="(items, section) in educationLogs"
            :key="section"
            class="relative"
          >
            <!-- SECTION HEADER -->
            <div
              class="relative flex items-center gap-3 mb-0 cursor-pointer select-none group/sec px-1 py-2 rounded-sm transition-colors duration-200"
              @click="toggleSection(section)"
            >
              <div
                class="flex-shrink-0 w-9 h-9 flex items-center justify-center transition-all duration-300"
                :class="[
                  isEldenMode ? 'er-slot' : '',
                  secOpen[section]
                    ? 'bg-primary/15 shadow-[0_0_12px_rgba(var(--color-primary-rgb),0.25)]'
                    : 'bg-primary/10',
                ]"
                :style="isEldenMode ? '' : 'clip-path: polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%, 0 10%)'"
              >
                <Landmark v-if="section === 'higher'" class="w-5 h-5 text-primary" />
                <Library v-else-if="section === 'courses'" class="w-5 h-5 text-primary" />
                <Languages v-else class="w-5 h-5 text-primary" />
              </div>

              <span
                class="text-[length:var(--text-md)] font-black uppercase tracking-[0.18em] transition-colors duration-200"
                :class="secOpen[section] ? 'text-primary' : 'text-primary/60'"
              >
                {{ t(getSectionTitleKey(section)) }}
              </span>

              <div
                class="flex items-center justify-center h-5 px-2 transition-all duration-200"
                :class="
                  secOpen[section]
                    ? 'bg-primary/15 shadow-[0_0_6px_rgba(var(--color-primary-rgb),0.2)]'
                    : 'bg-primary/5'
                "
              >
                <span
                  class="text-[10px] font-black tracking-[0.1em]"
                  :class="secOpen[section] ? 'text-primary' : 'text-primary/50'"
                >
                  {{ items.length }}
                </span>
              </div>

              <div class="flex-1 relative h-px overflow-hidden">
                <div
                  class="absolute inset-0 transition-opacity duration-300"
                  :class="
                    secOpen[section]
                      ? 'bg-gradient-to-r from-primary/35 to-transparent opacity-100'
                      : 'bg-gradient-to-r from-primary/10 to-transparent opacity-60'
                  "
                ></div>
              </div>

              <div
                class="flex-shrink-0 transition-all duration-300"
                :class="
                  secOpen[section]
                    ? 'bg-primary/15 shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.2)]'
                    : 'bg-primary/5'
                "
                style="width: 1.75rem; height: 1.75rem"
              >
                <div class="edu-chev w-full h-full" :class="secOpen[section] ? 'is-open' : ''">
                  <ChevronDown
                    class="w-3.5 h-3.5 transition-colors duration-200"
                    :class="secOpen[section] ? 'text-primary' : 'text-primary/40'"
                  />
                </div>
              </div>
            </div>

            <!-- SECTION BODY -->
            <div
              class="edu-sec-body overflow-hidden"
              :style="secOpen[section] ? 'max-height:2400px; opacity:1' : 'max-height:0; opacity:0'"
            >
              <div class="space-y-2.5 pl-1 pt-3">
                <div
                  v-for="item in items"
                  :key="item.title_key"
                  class="edu-item relative border transition-all duration-300"
                  :class="[
                    isEldenMode ? 'er-slot' : 'bg-black/30',
                    itemOpen[item.title_key]
                      ? 'border-primary bg-black/50 shadow-[inset_0_0_20px_rgba(var(--color-primary-rgb),0.04)]'
                      : 'border-primary/15',
                  ]"
                  :style="isEldenMode ? '' : 'clip-path: polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)'"
                >
                  <div
                    class="absolute left-0 top-0 w-[2px] bg-primary shadow-[0_0_8px_var(--color-primary)] pointer-events-none transition-all duration-500"
                    :style="itemOpen[item.title_key] ? 'height:100%' : 'height:0'"
                  ></div>

                  <!-- ITEM HEADER ROW -->
                  <div
                    class="relative flex items-center gap-4 px-4 py-3.5 cursor-pointer select-none"
                    @click="toggleItem(item.title_key)"
                  >
                    <div
                      class="flex-shrink-0 flex items-center justify-center w-10 h-10 transition-all duration-300"
                      :class="[
                        isEldenMode ? 'er-slot' : '',
                        itemOpen[item.title_key]
                          ? 'bg-primary/15 shadow-[0_0_14px_rgba(var(--color-primary-rgb),0.3)]'
                          : 'bg-primary/10',
                      ]"
                      :style="isEldenMode ? '' : 'clip-path: polygon(15% 0, 85% 0, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0 85%, 0 15%)'"
                    >
                      <component
                        :is="iconMap[item.icon] || BookOpen"
                        class="w-4 h-4 transition-colors duration-300"
                        :class="itemOpen[item.title_key] ? 'text-primary' : 'text-primary/65'"
                      />
                    </div>

                    <div class="flex-1 min-w-0 flex flex-col gap-1">
                      <div
                        class="text-[length:var(--text-md)] font-black uppercase tracking-[0.1em] leading-tight flex items-center gap-2 transition-colors duration-200"
                        :class="itemOpen[item.title_key] ? 'text-white' : 'text-primary/85'"
                      >
                        <span v-if="item.flag" class="leading-none">{{ item.flag }}</span>
                        <span>{{ t(item.title_key) }}</span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <ShieldCheck
                          class="w-3 h-3 flex-shrink-0 transition-colors duration-200"
                          :class="itemOpen[item.title_key] ? 'text-primary/75' : 'text-primary/40'"
                        />
                        <span
                          class="text-[length:var(--text-sm)] text-primary/50 tracking-[0.08em] transition-colors duration-200"
                          :class="itemOpen[item.title_key] ? '!text-primary/80' : ''"
                        >
                          {{ t(item.provider_key) }}
                        </span>
                      </div>
                    </div>

                    <div class="flex-shrink-0 flex items-center gap-2">
                      <div
                        class="flex items-center gap-1.5 overflow-hidden transition-all duration-200"
                        :style="itemOpen[item.title_key] ? 'max-width:0;opacity:0;margin:0' : 'max-width:96px;opacity:1'"
                      >
                        <span
                          v-if="item.hours"
                          class="text-[10px] font-black text-primary/45 tracking-[0.08em] uppercase whitespace-nowrap"
                        >
                          {{ item.hours }}{{ t('edu_hours_unit') }}
                        </span>
                        <div
                          v-if="item.cert"
                          class="w-1.5 h-1.5 bg-primary/50 rotate-45 flex-shrink-0"
                        ></div>
                        <div v-if="item.proficiency" class="flex items-end gap-[2px] flex-shrink-0">
                          <div
                            v-for="i in 5"
                            :key="i"
                            :class="i <= item.proficiency ? 'bg-primary/65' : 'bg-primary/15'"
                            :style="{ height: `${3 + i * 1.5}px` }"
                            class="w-[3px]"
                          ></div>
                        </div>
                      </div>

                      <div
                        class="flex-shrink-0 transition-all duration-300"
                        :class="
                          itemOpen[item.title_key]
                            ? 'bg-primary/15 shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.2)]'
                            : 'bg-primary/5'
                        "
                        style="width: 1.5rem; height: 1.5rem"
                      >
                        <div class="edu-chev w-full h-full" :class="itemOpen[item.title_key] ? 'is-open' : ''">
                          <ChevronDown
                            class="w-3 h-3 transition-colors duration-200"
                            :class="itemOpen[item.title_key] ? 'text-primary' : 'text-primary/40'"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- ITEM EXPANDED PANEL -->
                  <div
                    class="edu-item-wrap overflow-hidden"
                    :style="itemOpen[item.title_key] ? 'max-height:140px; opacity:1' : 'max-height:0; opacity:0'"
                  >
                    <div class="flex items-center flex-shrink-0 gap-2 px-4 py-3 flex-wrap border-t border-white/10">
                      <!-- Proficiency badge -->
                      <div
                        v-if="item.proficiency && item.proficiency_key"
                        class="group/prof flex items-center gap-2 h-8 px-2.5 bg-black/50 border border-sky-500/30 hover:border-sky-400/70 transition-all duration-200"
                      >
                        <div class="flex items-end gap-[3px]">
                          <div
                            v-for="i in 5"
                            :key="i"
                            :class="i <= item.proficiency ? 'bg-sky-400' : 'bg-sky-900/50'"
                            :style="{ height: `${6 + i * 2}px` }"
                            class="w-1.5"
                          ></div>
                        </div>
                        <span class="text-[length:var(--text-xs)] font-black tracking-[0.1em] uppercase text-sky-300">
                          {{ t(item.proficiency_key) }}
                        </span>
                      </div>

                      <!-- Hours badge -->
                      <div
                        v-if="item.hours"
                        class="group/hrs flex items-center gap-1.5 h-8 px-2.5 bg-black/50 border border-amber-500/30 hover:border-amber-400/70 transition-all duration-200"
                      >
                        <Clock class="w-3 h-3 text-amber-400/80" />
                        <span class="text-[length:var(--text-xs)] font-black tracking-[0.1em] uppercase text-amber-300">
                          {{ item.hours }}{{ t('edu_hours_unit') }}
                        </span>
                      </div>

                      <!-- Cert button -->
                      <button
                        v-if="item.cert"
                        type="button"
                        @click.stop="openCert(item.cert)"
                        class="group/cert flex items-center gap-1.5 h-8 px-3 bg-black/60 border border-violet-500/40 text-[length:var(--text-xs)] font-black uppercase tracking-[0.1em] text-violet-200 hover:border-violet-400 hover:bg-violet-950/60 transition-all duration-200 cursor-pointer"
                      >
                        <FileBadge class="w-3.5 h-3.5 text-[#c9a84c]" />
                        <span>{{ t('edu_cert_btn') }}</span>
                      </button>

                      <div class="flex-1 min-w-0"></div>

                      <a
                        v-if="item.url && item.url !== '#'"
                        :href="item.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        @click.stop="sfx.play('link')"
                        class="group/ext flex items-center justify-center w-8 h-8 bg-black/40 border border-teal-500/30 hover:border-teal-400/70 transition-all duration-200"
                      >
                        <ExternalLink class="w-3.5 h-3.5 text-teal-400/75 group-hover/ext:text-teal-300" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="relative flex items-center justify-between px-5 py-2.5 border-t border-white/20 bg-black/40">
          <div class="flex items-center gap-2">
            <div class="flex gap-1">
              <div class="w-1 h-1.5 bg-primary/20"></div>
              <div class="w-1 h-1.5 bg-primary/50"></div>
              <div class="w-1 h-1.5 bg-primary animate-pulse"></div>
            </div>
            <span class="text-[length:var(--text-xs)] text-primary/60 uppercase tracking-[0.1em]">
              {{ t('edu_status_verified') }}
            </span>
          </div>
        </div>

        <div
          v-if="!isEldenMode"
          class="absolute bottom-0 right-0 w-6 h-6 bg-primary/15 pointer-events-none"
          style="clip-path: polygon(100% 0, 100% 100%, 0 100%)"
        ></div>
      </div>

      <!-- PDF CERTIFICATE MODAL -->
      <CertViewerModal
        v-if="activeCertFile"
        :file="activeCertFile"
        @close="closeCert"
      />
    </div>
  </div>
</template>
