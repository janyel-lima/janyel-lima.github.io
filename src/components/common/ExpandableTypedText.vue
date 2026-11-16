<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { useI18n } from '../../composables/useI18n';
import { useSfx } from '../../composables/useSfx';
import { useTheme } from '../../composables/useTheme';

const props = withDefaults(
  defineProps<{
    text: string;
    truncateAt?: number;
    speed?: number;
    paragraphClass?: string;
  }>(),
  {
    truncateAt: 160,
    speed: 12,
    paragraphClass: '',
  }
);

const { t } = useI18n();
const sfx = useSfx();
const { isEldenMode } = useTheme();

const expanded = ref(false);
const typedText = ref('');
const revealCycle = ref(0);
let intervalId: ReturnType<typeof setInterval> | null = null;

const shouldShowToggle = computed(() => props.text.length > props.truncateAt);

const collapsedPreview = computed(() => {
  const base = props.text.slice(0, props.truncateAt);
  return base + (props.text.length > props.truncateAt ? '…' : '');
});

const displayText = computed(() => {
  if (expanded.value) return typedText.value;
  return collapsedPreview.value;
});

const eldenLines = computed(() =>
  props.text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
);

function stopTyping() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function resumeTyping() {
  stopTyping();
  const full = props.text;
  if (typedText.value.length >= full.length) return;
  let i = typedText.value.length;
  intervalId = setInterval(() => {
    typedText.value += full[i++] ?? '';
    if (i >= full.length) stopTyping();
  }, props.speed);
}

function toggle() {
  expanded.value = !expanded.value;
  sfx.play('expand');
  if (isEldenMode.value) {
    if (expanded.value) {
      revealCycle.value += 1;
    }
    return;
  }
  if (!expanded.value) {
    stopTyping();
    typedText.value = '';
    return;
  }
  typedText.value = props.text.slice(0, props.truncateAt);
  resumeTyping();
}

watch(
  () => props.text,
  (newText) => {
    stopTyping();
    if (!expanded.value) {
      typedText.value = '';
      return;
    }
    if (!isEldenMode.value) {
      typedText.value = newText.slice(0, props.truncateAt);
      resumeTyping();
    }
  }
);

onUnmounted(() => {
  stopTyping();
});
</script>

<template>
  <div>
    <!-- PURPLE ELDEN RING MODE: MYSTIC LORE UNSEAL ANIMATION -->
    <template v-if="isEldenMode">
      <!-- Collapsed Teaser with Mist Mask (smoothly folds when expanded) -->
      <div
        class="er-lore-preview-drawer"
        :class="expanded ? 'is-hidden' : ''"
      >
        <div class="overflow-hidden">
          <p
            :class="[
              paragraphClass,
              shouldShowToggle ? 'line-clamp-2 er-lore-preview-masked' : '',
            ]"
          >
            {{ collapsedPreview }}
          </p>
        </div>
      </div>

      <!-- Animated Smooth Grid Drawer for Full Lore Reveal & Collapse -->
      <div
        class="er-lore-drawer"
        :class="expanded ? 'is-expanded' : ''"
      >
        <div class="overflow-hidden">
          <div :key="revealCycle" class="pt-0.5 pb-1">
            <div v-if="expanded" class="er-unseal-beam" aria-hidden="true"></div>
            <div class="space-y-1.5">
              <p
                v-for="(line, idx) in eldenLines"
                :key="idx"
                class="text-[length:var(--text-sm)] text-[#f3efe6]/95 leading-relaxed tracking-[0.04em]"
                :class="expanded ? 'er-lore-line' : 'er-lore-line-collapsing'"
                :style="expanded ? { animationDelay: `${idx * 65}ms` } : {}"
              >
                {{ line }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Ornate Elden Ring Lore Toggle Plaque Button -->
      <button
        v-show="shouldShowToggle"
        type="button"
        data-expand-toggle
        @click="toggle"
        class="er-lore-toggle-btn mt-3 mb-1 cursor-pointer group/lorebtn"
      >
        <span
          class="w-4 h-px bg-gradient-to-r from-transparent to-[#c9a84c]/70 transition-all duration-300 group-hover/lorebtn:w-6"
        ></span>
        <span
          class="inline-block w-2 h-2 border border-[#c9a84c] bg-[#b366ff]/40 transition-transform duration-500"
          :class="
            expanded
              ? 'rotate-[225deg] scale-110 shadow-[0_0_8px_#c9a84c]'
              : 'rotate-45'
          "
        ></span>
        <span class="text-[11px] font-bold uppercase tracking-[0.14em] text-[#e2c777] group-hover/lorebtn:text-[#f3efe6] transition-colors">
          {{ t(expanded ? 'collapse_data' : 'expand_data') }}
        </span>
        <span
          class="w-4 h-px bg-gradient-to-l from-transparent to-[#c9a84c]/70 transition-all duration-300 group-hover/lorebtn:w-6"
        ></span>
      </button>
    </template>

    <!-- TURQUOISE ('core') MODE: CYBER TERMINAL TYPEWRITER -->
    <template v-else>
      <p
        :class="[
          paragraphClass,
          expanded ? '' : 'line-clamp-2',
        ]"
      >
        {{ displayText }}
      </p>

      <button
        v-show="shouldShowToggle"
        type="button"
        data-expand-toggle
        @click="toggle"
        class="animate-pulse mt-3 mb-3 flex items-center gap-2 text-[length:var(--text-micro)] uppercase tracking-[0.1em] cursor-pointer"
      >
        <span class="text-primary tracking-[0.1em] hover:text-primary transition">
          {{ t(expanded ? 'collapse_data' : 'expand_data') }}
        </span>
        <span class="animate-pulse text-primary">█</span>
      </button>
    </template>
  </div>
</template>
