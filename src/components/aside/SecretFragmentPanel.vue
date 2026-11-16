<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Unlock, ChevronRight, X, MessageCircle, Mail } from 'lucide-vue-next';
import { devStats } from '../../data/portfolioData';
import { useI18n } from '../../composables/useI18n';
import { useSfx } from '../../composables/useSfx';
import { useTheme } from '../../composables/useTheme';

defineProps<{
  unlocked: boolean;
  showFragment: boolean;
}>();

const emit = defineEmits<{
  (e: 'start-decrypt'): void;
  (e: 'close-fragment'): void;
}>();

const { t, lang } = useI18n();
const sfx = useSfx();
const { isEldenMode } = useTheme();

const showUnlock = ref(false);

function onScroll() {
  showUnlock.value = window.scrollY > 100;
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
});

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
});
</script>

<template>
  <div>
    <!-- DECRYPT TRIGGER BUTTON (Modern Cyberpunk mode only) -->
    <div
      v-if="!isEldenMode"
      data-interactive
      @mouseenter="sfx.play('hover')"
      class="my-6 flex justify-center order-2"
    >
      <button
        v-show="showUnlock"
        type="button"
        @click="emit('start-decrypt')"
        class="rpg-decriptor-card animate-pulse w-full py-4 px-6 bg-black/60 flex items-center justify-between group border-2 hover:border-primary bg-primary/5 hover:bg-primary/10 shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.3)] hover:shadow-[0_0_25px_rgba(var(--color-primary-rgb),0.5)] transition-all duration-300 cursor-pointer relative overflow-hidden"
      >
        <div class="flex items-center gap-4">
          <div class="relative">
            <Unlock class="w-6 h-6 text-primary shrink-0 transition-transform group-hover:rotate-12 group-hover:scale-110" />
            <div class="absolute inset-0 bg-primary/20 blur-lg animate-pulse"></div>
          </div>

          <div class="flex flex-col items-start gap-0.5">
            <span class="text-[length:var(--text-md)] tracking-[0.05em]">
              {{ t(unlocked ? 'access_fragment' : 'decrypt_fragment') }}
            </span>
            <span class="text-[length:var(--text-micro)] text-primary/70 tracking-[0.1em] uppercase animate-pulse">
              {{ t('click_to_decrypt') }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <span class="hidden sm:block tracking-[0.1em] text-[length:var(--text-micro)] text-gray-400 group-hover:text-white transition-colors uppercase">
            [ Secure_Gate ]
          </span>
          <ChevronRight class="w-5 h-5 text-primary animate-pulse" />
        </div>

        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>
      </button>
    </div>

    <!-- DATA FRAGMENT PANEL -->
    <div
      v-if="showFragment || isEldenMode"
      data-interactive
      class="order-3 relative flex bg-black/60 group overflow-hidden animate-fade-in"
      :class="isEldenMode ? 'rpg-card my-6 p-1' : ''"
      :style="isEldenMode ? '' : 'clip-path: polygon(0 0, 100% 0, 100% 85%, 92% 100%, 0 100%)'"
    >
      <button
        v-if="!isEldenMode"
        type="button"
        aria-label="Close fragment"
        @click="emit('close-fragment')"
        class="absolute top-2 right-2 text-primary/60 hover:text-primary transition-colors cursor-pointer z-20"
      >
        <X class="w-4 h-4" />
      </button>
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
            {{ t('data_fragment') }}
          </h5>
        </div>

        <div class="text-[length:var(--text-xs)] text-gray-400 uppercase mb-1 tracking-[0.1em]">
          {{ t('transmission_source') }}
        </div>

        <p class="text-[length:var(--text-base)] text-gray-200 tracking-[0.06em] leading-relaxed group-hover:text-white transition-colors">
          {{ t('contact_text') }}
        </p>
      </div>

      <div
        v-if="!isEldenMode"
        class="absolute bottom-0 right-0 w-2 h-2 bg-primary/20"
        style="clip-path: polygon(100% 0, 100% 100%, 0 100%)"
      ></div>
    </div>

    <!-- CONTACT CHANNELS -->
    <template v-if="showFragment || isEldenMode">
      <h2
        class="text-accent font-bold text-[length:var(--text-md)] mb-4 uppercase tracking-[0.1em] mt-6 animate-fade-in"
        :class="isEldenMode ? 'er-section-banner' : ''"
      >
        {{ t('title_contact') }}
      </h2>

      <div
        data-interactive
        @mouseenter="sfx.play('hover')"
        class="rpg-card bg-black/60 p-5 relative group/contact animate-fade-in"
      >
        <div class="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
          <span class="text-[length:var(--text-xs)] text-primary/80 uppercase tracking-[0.1em]">
            {{ t('comm_channel') }}
          </span>
          <div class="flex gap-1">
            <div class="w-1 h-2 bg-primary/20"></div>
            <div class="w-1 h-2 bg-primary/40"></div>
            <div class="w-1 h-2 bg-primary animate-pulse"></div>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <a
            :href="devStats.social_links.whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            @click="sfx.play('link')"
            class="rpg-button py-3.5 px-4 flex items-center justify-between group/btn"
          >
            <div class="flex items-center gap-3.5">
              <MessageCircle class="w-5 h-5 text-primary shrink-0 transition-transform group-hover/btn:scale-110" />
              <div class="flex flex-col">
                <span class="text-[length:var(--text-xs)] tracking-[0.1em] font-black uppercase">
                  {{
                    isEldenMode
                      ? lang === 'pt-br'
                        ? 'WhatsApp Profissional'
                        : 'Professional WhatsApp'
                      : 'WhatsApp_Link'
                  }}
                </span>
                <span
                  class="text-[length:var(--text-micro)] text-gray-300 transition-opacity"
                  :class="isEldenMode ? 'opacity-90' : 'lowercase opacity-0 group-hover/btn:opacity-100'"
                >
                  {{ t('secure_msg') }}
                </span>
              </div>
            </div>
            <div class="text-[length:var(--text-md)] text-primary opacity-60 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all">
              {{ t('btn_send') }}
            </div>
          </a>

          <a
            :href="devStats.social_links.email"
            @click="sfx.play('link')"
            class="rpg-button py-3.5 px-4 flex items-center justify-between group/btn"
          >
            <div class="flex items-center gap-3.5">
              <Mail class="w-5 h-5 text-primary shrink-0 transition-transform group-hover/btn:scale-110" />
              <div class="flex flex-col">
                <span class="text-[length:var(--text-xs)] tracking-[0.1em] font-black uppercase">
                  {{
                    isEldenMode
                      ? lang === 'pt-br'
                        ? 'E-mail Direto'
                        : 'Direct Email'
                      : 'Direct_Email'
                  }}
                </span>
                <span
                  class="text-[length:var(--text-micro)] text-gray-300 transition-opacity"
                  :class="isEldenMode ? 'opacity-90' : 'lowercase opacity-0 group-hover/btn:opacity-100'"
                >
                  {{ t('request_msg') }}
                </span>
              </div>
            </div>
            <div class="text-[length:var(--text-md)] text-primary opacity-60 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all">
              {{ t('btn_send') }}
            </div>
          </a>
        </div>
      </div>

      <!-- NETWORK LINKS -->
      <h2
        class="text-accent font-bold text-[length:var(--text-md)] mb-4 uppercase tracking-[0.1em] mt-6 animate-fade-in"
        :class="isEldenMode ? 'er-section-banner' : ''"
      >
        {{ t('title_network') }}
      </h2>

      <div data-interactive class="rpg-card p-5 bg-black/60 mb-6 animate-fade-in">
        <div
          class="flex justify-between items-center mb-4 border-b border-white/10 pb-2"
          @mouseenter="sfx.play('hover')"
        >
          <span class="text-[length:var(--text-xs)] text-primary/80 uppercase tracking-[0.1em]">
            {{ t('social_links') }}
          </span>
          <div class="flex gap-1">
            <div class="w-1 h-2 bg-primary/20"></div>
            <div class="w-1 h-2 bg-primary/40"></div>
            <div class="w-1 h-2 bg-primary animate-pulse"></div>
          </div>
        </div>
        <div class="flex flex-col gap-3">
          <a
            target="_blank"
            rel="noopener noreferrer"
            @click="sfx.play('link')"
            :href="devStats.social_links.github"
            class="rpg-button py-3 px-4 flex items-center justify-start gap-4 text-[length:var(--text-md)]"
          >
            <i class="devicon-github-original text-primary text-lg shrink-0"></i>
            <span class="tracking-[0.1em]">GitHub</span>
          </a>
          <a
            target="_blank"
            rel="noopener noreferrer"
            @click="sfx.play('link')"
            :href="devStats.social_links.linkedin"
            class="rpg-button py-3 px-4 flex items-center justify-start gap-4 text-[length:var(--text-md)]"
          >
            <i class="devicon-linkedin-plain text-primary text-lg shrink-0"></i>
            <span class="tracking-[0.1em]">LinkedIn</span>
          </a>
        </div>
      </div>
    </template>
  </div>
</template>
