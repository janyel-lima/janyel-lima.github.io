<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Gamepad2 } from 'lucide-vue-next';
import { useI18n } from '../../composables/useI18n';
import { useSfx } from '../../composables/useSfx';
import { useTheme } from '../../composables/useTheme';
import TetrisChallengeModal from '../modals/TetrisChallengeModal.vue';

const { t } = useI18n();
const sfx = useSfx();
const { isEldenMode } = useTheme();

const visible = ref(false);
const accepted = ref(false);
const declined = ref(false);

function onScroll() {
  visible.value = window.scrollY > 300;
}

function accept() {
  accepted.value = true;
  sfx.play('gamepad');
}

function decline() {
  declined.value = true;
  accepted.value = false;
  sfx.play('decline');
}

function closeModal() {
  accepted.value = false;
  sfx.play('close');
}

function reopen() {
  declined.value = false;
  visible.value = true;
  sfx.play('click');
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
  <div data-interactive>
    <!-- FLOATING CHALLENGE CARD -->
    <div
      v-show="visible && !accepted && !declined"
      @mouseenter="sfx.play('hover')"
      class="mt-8 relative animate-fade-in"
    >
      <div class="absolute -inset-1 bg-primary/10 blur-xl animate-pulse pointer-events-none rounded-sm"></div>

      <div
        class="rpg-card relative border bg-black/60 shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.2)] overflow-hidden"
        :class="isEldenMode ? '' : 'animate-pulse'"
        :style="
          isEldenMode
            ? ''
            : 'clip-path: polygon(0 0, 100% 0, 100% 88%, 94% 100%, 0 100%)'
        "
      >
        <div class="absolute inset-x-0 top-0 h-px bg-primary/40"></div>
        <div
          v-if="!isEldenMode"
          class="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[2px_0_8px_rgba(var(--color-primary-rgb),0.5)]"
        ></div>
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full animate-[sweep_4s_ease-in-out_infinite] pointer-events-none"></div>

        <div class="p-4 pl-5">
          <div class="flex justify-between items-center mb-3">
            <span class="text-[length:var(--text-micro)] text-primary/60 uppercase tracking-[0.15em]">
              {{ t('challenge_incoming') }}
            </span>
            <div class="flex gap-1">
              <div class="w-1 h-2 bg-primary/20"></div>
              <div class="w-1 h-2 bg-primary/50"></div>
              <div class="w-1 h-2 bg-primary animate-pulse"></div>
            </div>
          </div>

          <div class="flex items-center gap-3 mb-2">
            <div
              class="w-2 h-2 rotate-45 shadow-[0_0_6px_var(--color-primary)] shrink-0"
              :class="isEldenMode ? 'bg-[#c9a84c]' : 'bg-primary'"
            ></div>
            <h4
              class="text-[length:var(--text-md)] font-black uppercase tracking-[0.1em] text-primary"
              :class="isEldenMode ? 'font-elden text-[#e2c777]' : ''"
            >
              {{ t('challenge_title') }}
            </h4>
          </div>

          <p
            class="text-[length:var(--text-sm)] text-gray-300 leading-relaxed mb-1.5 ml-[3.5px] pl-3.5 tracking-[0.05em]"
            :class="isEldenMode ? 'border-l border-[#c9a84c]/45' : 'border-l border-primary/40'"
          >
            {{ t('challenge_body') }}
          </p>

          <p class="text-[length:var(--text-micro)] text-gray-400 ml-[3.5px] pl-3.5 mb-4 uppercase tracking-widest leading-relaxed">
            {{ t('challenge_disclaimer') }}
          </p>

          <div class="flex flex-wrap items-stretch gap-2.5">
            <button
              type="button"
              @click="accept"
              class="flex-1 min-w-[140px] rpg-button py-2.5 px-3.5 flex items-center justify-center gap-2 hover:border-primary bg-primary/5 hover:bg-primary/10 text-[length:var(--text-xs)] uppercase tracking-widest transition-all duration-200 group cursor-pointer text-center leading-snug"
            >
              <Gamepad2 class="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform shrink-0" />
              <span class="text-primary font-black">{{ t('challenge_accept') }}</span>
            </button>

            <button
              type="button"
              @click="decline"
              class="flex-1 sm:flex-initial min-w-[120px] rpg-button-alt py-2.5 px-4 flex items-center justify-center text-[length:var(--text-xs)] uppercase tracking-widest transition-all duration-200 cursor-pointer text-center leading-snug"
            >
              <span>{{ t('challenge_decline') }}</span>
            </button>
          </div>
        </div>

        <div
          v-if="!isEldenMode"
          class="absolute bottom-0 right-0 w-3 h-3 bg-primary/20"
          style="clip-path: polygon(100% 0, 100% 100%, 0 100%)"
        ></div>
      </div>
    </div>

    <!-- DECLINED STATE -->
    <div
      v-if="declined"
      class="mt-6 relative border border-white/5 bg-black/40 p-3 overflow-hidden animate-fade-in"
    >
      <div class="absolute left-0 top-0 bottom-0 w-[2px] bg-red-500/40"></div>
      <div class="pl-3 space-y-2">
        <p class="text-[length:var(--text-sm)] text-red-500/60 font-bold uppercase tracking-[0.15em]">
          {{ t('challenge_refused_label') }}
        </p>
        <p class="text-[length:var(--text-xs)] text-gray-300 uppercase tracking-widest leading-relaxed">
          {{ t('challenge_refused_body') }}
        </p>
        <button
          type="button"
          @click="reopen"
          class="group flex items-center gap-2 mt-1 text-[length:var(--text-xs)] uppercase tracking-widest text-primary/50 hover:text-primary transition-all duration-300 cursor-pointer"
        >
          <span>{{ t('challenge_reopen') }}</span>
          <span class="w-3 h-px bg-primary/30 group-hover:bg-primary group-hover:w-5 transition-all duration-300"></span>
        </button>
      </div>
      <div
        class="absolute bottom-0 right-0 w-2 h-2 bg-red-500/10"
        style="clip-path: polygon(100% 0, 100% 100%, 0 100%)"
      ></div>
    </div>

    <!-- TETRIS MODAL -->
    <TetrisChallengeModal v-if="accepted" @close="closeModal" />
  </div>
</template>
