<script setup lang="ts">
import { useI18n } from '../../composables/useI18n';

defineProps<{
  locked: boolean;
  progress: number;
}>();

const { t } = useI18n();
</script>

<template>
  <Teleport to="body">
    <div
      v-if="locked"
      data-interactive
      role="dialog"
      aria-modal="true"
      aria-labelledby="overlay-title"
      class="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
    >
      <div
        class="relative w-[320px] bg-black p-4 border-forced shadow-[0_0_25px_rgba(var(--color-primary-rgb),0.35)]"
      >
        <p
          id="overlay-title"
          class="text-[length:var(--text-md)] text-primary tracking-widest uppercase mb-2"
        >
          {{ t('system_alert') }}
        </p>

        <p class="text-[length:var(--text-sm)] text-gray-300 mb-4">
          {{ t('secure_fragment_locked') }}
        </p>

        <div
          class="h-2 bg-black overflow-hidden border border-primary/30"
          role="progressbar"
          :aria-valuenow="Math.round(progress)"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            class="h-full bg-primary transition-all duration-100"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>

        <p class="text-[length:var(--text-micro)] text-gray-400 mt-2 uppercase tracking-widest">
          {{ t('decrypting') }}
        </p>
      </div>
    </div>
  </Teleport>
</template>
