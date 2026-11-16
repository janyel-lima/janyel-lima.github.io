<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '../../composables/useI18n';
import { useTheme } from '../../composables/useTheme';
import { useSfx } from '../../composables/useSfx';
import { getRealmIconAsset, handleImageError } from '../../utils/portfolioLogic';

const { t } = useI18n();
const { realm, isEldenMode } = useTheme();
const sfx = useSfx();

const realmIcon = computed(() => getRealmIconAsset(realm.value));
</script>

<template>
  <footer
    data-interactive
    class="mt-20 border-t border-primary/30 bg-black/40 pt-12 pb-8 px-4"
  >
    <div class="max-w-6xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-start text-center md:text-left">
        <!-- LEFT -->
        <div class="space-y-4 flex flex-col items-center md:items-start">
          <div class="flex items-center gap-2">
            <div
              class="w-2 h-2 animate-pulse"
              :class="
                isEldenMode
                  ? 'rotate-45 bg-[#c9a84c] shadow-[0_0_8px_rgba(201,168,76,0.75)]'
                  : 'bg-primary'
              "
            ></div>
            <span
              class="text-[length:var(--text-md)] tracking-[0.1em] text-primary uppercase"
              :class="isEldenMode ? 'font-elden text-[#e2c777] font-bold' : ''"
            >
              {{ t('sys_online') }}
            </span>
          </div>

          <p
            id="footer-realm-meta"
            class="text-[length:var(--text-micro)] tracking-[0.1em] leading-relaxed uppercase"
            :class="isEldenMode ? 'text-[#d4c4eb]/80' : 'text-gray-400'"
          >
            {{ t('footer_meta_1') }}
            <br />
            {{ t('footer_meta_2') }}
            <br />
            {{ t('footer_meta_3') }}
          </p>
        </div>

        <!-- CENTER -->
        <div class="flex flex-col items-center justify-center space-y-4">
          <div
            id="footer-logo-container"
            class="w-14 h-14 flex items-center justify-center group transition-all duration-300"
            :class="
              isEldenMode
                ? 'er-slot p-1.5 border border-[#c9a84c]/45 bg-[#120822]/90'
                : 'rpg-box border border-primary/40 bg-primary/5 rotate-45 hover:border-primary'
            "
          >
            <img
              id="footer-realm-icon"
              :src="realmIcon.src"
              :alt="realmIcon.alt"
              @error="handleImageError"
              class="core-glow w-8 h-8 object-contain group-hover:scale-110 transition-all duration-500"
              :class="isEldenMode ? '' : '-rotate-45'"
            />
          </div>

          <div class="space-y-1 text-center">
            <p class="text-[length:var(--text-sm)] font-black uppercase tracking-[0.1em] text-white">
              Janyel B. Lima
            </p>
            <p class="text-[length:var(--text-xs)] tracking-[0.1em] text-gray-300 uppercase">
              {{ t('made_with') }}
            </p>
          </div>
        </div>

        <!-- RIGHT -->
        <div class="flex flex-col items-center md:items-end gap-2">
          <span class="text-[length:var(--text-md)] tracking-[0.1em] text-gray-200 uppercase mb-2">
            {{ t('footer_termination') }}
          </span>

          <a
            href="#top"
            @click="sfx.play('link')"
            class="text-[length:var(--text-micro)] tracking-[0.1em] text-gray-400 hover:text-primary transition-colors uppercase"
          >
            {{ t('return_top') }}
          </a>

          <a
            href="mailto:janyel.lima2809@outlook.com"
            @click="sfx.play('link')"
            class="text-[length:var(--text-micro)] tracking-[0.1em] text-gray-400 hover:text-primary transition-colors uppercase"
          >
            {{ t('send_transmission') }}
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>
