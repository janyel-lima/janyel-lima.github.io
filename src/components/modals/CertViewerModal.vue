<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  MoveHorizontal,
  Maximize,
  Minus,
  Plus,
  Download,
  FileText,
} from 'lucide-vue-next';
import { useI18n } from '../../composables/useI18n';
import { useTheme } from '../../composables/useTheme';
import { useSfx } from '../../composables/useSfx';
import { getPdfDisplayLabel, resolvePdfDocumentUrl } from '../../utils/portfolioLogic';

const props = withDefaults(
  defineProps<{
    file: string;
    docType?: 'cert' | 'resume';
    displayName?: string;
    downloadName?: string;
  }>(),
  {
    docType: 'cert',
    displayName: '',
    downloadName: '',
  }
);

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { t } = useI18n();
const { isEldenMode } = useTheme();
const sfx = useSfx();

const modalBoxRef = ref<HTMLElement | null>(null);
const canvasWrapRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const page = ref(1);
const total = ref(0);
const loading = ref(true);
const loadError = ref(false);
const fullscreen = ref(false);
const zoom = ref(1);
const zoomPct = ref(100);
const fitMode = ref<'width' | 'page' | 'custom'>('width');

const isResume = computed(() => props.docType === 'resume');
const resolvedUrl = computed(() => resolvePdfDocumentUrl(props.file));
const displayLabel = computed(() => getPdfDisplayLabel(props.file, props.displayName));
const downloadFilename = computed(
  () => props.downloadName || getPdfDisplayLabel(props.file, props.displayName)
);

const viewerTitle = computed(() =>
  isResume.value ? t('cv_pdf_viewer') : t('edu_cert_viewer')
);
const loadingText = computed(() =>
  isResume.value ? t('cv_pdf_loading') : t('edu_cert_loading')
);
const footerHintText = computed(() =>
  isResume.value ? t('cv_pdf_esc') : t('edu_cert_esc')
);

// Closure variables to avoid Vue proxy breaking PDF.js private fields (#d, #map)
let pdfDoc: any = null;
let renderTask: any = null;
let resizeObs: ResizeObserver | null = null;

function cancelRender() {
  if (renderTask) {
    try {
      renderTask.cancel();
    } catch {
      // ignore
    }
    renderTask = null;
  }
}

async function renderPage(pageNum: number) {
  if (!pdfDoc) return;
  cancelRender();
  loading.value = true;

  let pdfPage: any;
  try {
    pdfPage = await pdfDoc.getPage(pageNum);
  } catch {
    loading.value = false;
    return;
  }

  const canvas = canvasRef.value;
  const wrap = canvasWrapRef.value;
  if (!canvas || !wrap) {
    loading.value = false;
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const availW = Math.max(240, wrap.clientWidth - 32);
  const availH = Math.max(240, wrap.clientHeight - 32);

  const base = pdfPage.getViewport({ scale: 1 });

  let scale = zoom.value;
  if (fitMode.value === 'width') {
    scale = availW / base.width;
  } else if (fitMode.value === 'page') {
    scale = Math.min(availW / base.width, availH / base.height);
  }
  scale = Math.max(0.25, Math.min(scale, 4));

  zoom.value = scale;
  zoomPct.value = Math.round(scale * 100);

  const cssW = Math.round(base.width * scale);
  const cssH = Math.round(base.height * scale);

  const vp = pdfPage.getViewport({ scale: scale * dpr });
  canvas.width = vp.width;
  canvas.height = vp.height;
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;

  const task = pdfPage.render({
    canvasContext: canvas.getContext('2d'),
    viewport: vp,
  });
  renderTask = task;

  try {
    await task.promise;
    loading.value = false;
    page.value = pageNum;
  } catch (err: any) {
    if (err?.name !== 'RenderingCancelledException') {
      loading.value = false;
    }
  }
  renderTask = null;
}

async function loadPdf() {
  cancelRender();
  loading.value = true;
  loadError.value = false;
  total.value = 0;
  page.value = 1;
  pdfDoc = null;

  await nextTick();

  const lib = window.pdfjsLib;
  const targetUrl = resolvedUrl.value;
  if (!lib || !targetUrl) {
    loadError.value = true;
    loading.value = false;
    return;
  }

  lib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  try {
    const loadTask = lib.getDocument({
      url: targetUrl,
      cMapPacked: true,
      isEvalSupported: false,
    });
    const doc = await loadTask.promise;
    pdfDoc = doc;
    total.value = doc.numPages;
    await renderPage(1);
  } catch {
    loadError.value = true;
    loading.value = false;
  }
}

watch(
  () => props.file,
  () => {
    loadPdf();
  }
);

async function prevPage() {
  if (page.value <= 1) return;
  sfx.play('page');
  await renderPage(page.value - 1);
}

async function nextPage() {
  if (page.value >= total.value) return;
  sfx.play('page');
  await renderPage(page.value + 1);
}

function applyCustomZoom(scale: number) {
  fitMode.value = 'custom';
  zoom.value = scale;
  zoomPct.value = Math.round(scale * 100);
  renderPage(page.value);
}

function zoomIn() {
  sfx.play('zoom');
  applyCustomZoom(Math.min(zoom.value * 1.25, 4));
}

function zoomOut() {
  sfx.play('zoom');
  applyCustomZoom(Math.max(zoom.value * 0.8, 0.25));
}

function fitWidth() {
  fitMode.value = 'width';
  sfx.play('zoom');
  renderPage(page.value);
}

function fitPage() {
  fitMode.value = 'page';
  sfx.play('zoom');
  renderPage(page.value);
}

function toggleFullscreen() {
  const el = modalBoxRef.value;
  if (!el) return;
  if (!document.fullscreenElement) {
    el.requestFullscreen()
      .then(() => {
        fullscreen.value = true;
        nextTick(() => renderPage(page.value));
      })
      .catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
    fullscreen.value = false;
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close');
    return;
  }
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      e.preventDefault();
      nextPage();
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault();
      prevPage();
      break;
    case '+':
    case '=':
      e.preventDefault();
      zoomIn();
      break;
    case '-':
      e.preventDefault();
      zoomOut();
      break;
    case '0':
      e.preventDefault();
      fitWidth();
      break;
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
  if (canvasWrapRef.value) {
    resizeObs = new ResizeObserver(() => {
      if (pdfDoc && !loading.value) {
        renderPage(page.value);
      }
    });
    resizeObs.observe(canvasWrapRef.value);
  }
  loadPdf();
});

onUnmounted(() => {
  cancelRender();
  window.removeEventListener('keydown', onKeydown);
  if (resizeObs) {
    resizeObs.disconnect();
    resizeObs = null;
  }
  pdfDoc = null;
});
</script>

<template>
  <Teleport to="body">
    <div
      data-interactive
      class="fixed inset-0 z-[12000] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style="backdrop-filter: blur(10px); background: rgba(0, 0, 0, 0.9)"
      role="dialog"
      aria-modal="true"
      :aria-label="viewerTitle"
      @click.self="emit('close')"
    >
      <div
        id="cert-modal-box"
        ref="modalBoxRef"
        class="relative w-full sm:max-w-4xl flex flex-col bg-black border border-primary shadow-[0_0_60px_rgba(var(--color-primary-rgb),0.2)]"
        :class="isEldenMode ? 'er-panel' : ''"
        style="height: 92svh; max-height: 92svh"
      >
        <div
          class="absolute inset-x-0 top-0 h-px opacity-70 bg-gradient-to-r from-transparent via-primary to-transparent pointer-events-none"
        ></div>

        <!-- HEADER -->
        <div
          class="flex-shrink-0 flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-primary bg-primary/5"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <FileText
              v-if="isResume && isEldenMode"
              class="w-4 h-4 text-[#c9a84c] flex-shrink-0"
            />
            <div
              v-else
              class="w-1.5 h-1.5 bg-primary rotate-45 flex-shrink-0 animate-pulse"
              style="box-shadow: 0 0 6px var(--color-primary)"
            ></div>
            <span
              id="pdf-viewer-title"
              class="text-[length:var(--text-sm)] font-black uppercase tracking-[0.08em] truncate"
              :class="isEldenMode ? 'font-elden text-[#f3efe6]' : 'text-primary'"
            >
              {{ viewerTitle }}
            </span>
            <span
              id="pdf-viewer-filename"
              class="hidden md:block text-[length:var(--text-xs)] tracking-[0.06em] truncate max-w-[260px]"
              :class="isEldenMode ? 'text-[#d8b4fe]/70' : 'text-primary/45 uppercase'"
            >
              · {{ displayLabel }}
            </span>
          </div>

          <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <!-- PAGE CONTROLS -->
            <div v-if="total > 1" class="flex items-center gap-1">
              <button
                type="button"
                @click="prevPage"
                :disabled="page <= 1"
                class="w-6 h-6 flex items-center justify-center border border-primary bg-black/60 text-primary/60 hover:text-primary hover:border-primary disabled:opacity-20 cursor-pointer"
              >
                <ChevronLeft class="w-3 h-3" />
              </button>
              <span
                id="pdf-page-indicator"
                class="text-[length:var(--text-xs)] text-primary/80 font-black tracking-[0.1em] px-1.5 whitespace-nowrap tabular-nums"
              >
                {{ page }} / {{ total }}
              </span>
              <button
                type="button"
                @click="nextPage"
                :disabled="page >= total"
                class="w-6 h-6 flex items-center justify-center border border-primary bg-black/60 text-primary/60 hover:text-primary hover:border-primary disabled:opacity-20 cursor-pointer"
              >
                <ChevronRight class="w-3 h-3" />
              </button>
            </div>

            <!-- DIRECT DOWNLOAD CTA -->
            <a
              :href="resolvedUrl"
              :download="downloadFilename"
              @click="sfx.play('download')"
              class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 border text-[length:var(--text-xs)] font-bold uppercase tracking-[0.08em] transition-colors cursor-pointer"
              :class="
                isEldenMode
                  ? 'border-[#c9a84c]/50 bg-[#1a0b2e]/80 text-[#e2c777] hover:border-[#c9a84c] hover:text-[#f3efe6]'
                  : 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
              "
            >
              <Download class="w-3.5 h-3.5" />
              <span>{{ t('cv_pdf_download') }}</span>
            </a>

            <div class="w-px h-4 bg-primary/15 hidden sm:block"></div>

            <button
              type="button"
              @click="toggleFullscreen"
              :title="fullscreen ? t('edu_fullscreen_exit') : t('edu_fullscreen_enter')"
              class="w-7 h-7 hidden sm:flex items-center justify-center bg-primary/10 text-primary/60 hover:text-primary hover:bg-primary/20 transition-all duration-200 cursor-pointer"
            >
              <Minimize2 v-if="fullscreen" class="w-3.5 h-3.5" />
              <Maximize2 v-else class="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              aria-label="Close PDF Viewer"
              @click="emit('close')"
              class="w-7 h-7 flex items-center justify-center bg-primary/10 text-primary/60 hover:text-primary hover:bg-primary/20 transition-all duration-200 cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- ZOOM TOOLBAR -->
        <div
          class="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 border-b border-primary bg-black/60"
        >
          <button
            type="button"
            @click="fitWidth"
            class="flex items-center gap-1.5 px-2.5 py-1 transition-all duration-150 text-[length:var(--text-xs)] font-black uppercase tracking-[0.08em] cursor-pointer"
            :class="
              fitMode === 'width'
                ? 'text-primary bg-primary/15 border border-primary'
                : 'text-primary/50 hover:text-primary border border-transparent'
            "
          >
            <MoveHorizontal class="w-3 h-3" />
            <span class="hidden sm:inline">{{ t('pdf_fit_width') }}</span>
          </button>

          <button
            type="button"
            @click="fitPage"
            class="flex items-center gap-1.5 px-2.5 py-1 transition-all duration-150 text-[length:var(--text-xs)] font-black uppercase tracking-[0.08em] cursor-pointer"
            :class="
              fitMode === 'page'
                ? 'text-primary bg-primary/15 border border-primary'
                : 'text-primary/50 hover:text-primary border border-transparent'
            "
          >
            <Maximize class="w-3 h-3" />
            <span class="hidden sm:inline">{{ t('pdf_fit_page') }}</span>
          </button>

          <div class="w-px h-4 bg-primary/15 mx-0.5"></div>

          <button
            type="button"
            @click="zoomOut"
            :disabled="zoom <= 0.26"
            class="w-7 h-7 flex items-center justify-center border border-primary bg-black/40 text-primary/60 hover:text-primary disabled:opacity-20 cursor-pointer"
          >
            <Minus class="w-3 h-3" />
          </button>

          <button
            type="button"
            @click="fitWidth"
            class="min-w-[3.5rem] px-2 py-1 text-center border border-primary bg-black/40 text-[length:var(--text-xs)] font-black tracking-[0.08em] tabular-nums text-primary/70 hover:text-primary cursor-pointer"
          >
            <span>{{ zoomPct }}%</span>
          </button>

          <button
            type="button"
            @click="zoomIn"
            :disabled="zoom >= 3.99"
            class="w-7 h-7 flex items-center justify-center border border-primary bg-black/40 text-primary/60 hover:text-primary disabled:opacity-20 cursor-pointer"
          >
            <Plus class="w-3 h-3" />
          </button>

          <div class="ml-auto hidden md:flex items-center gap-2 text-primary/40">
            <span class="text-[10px] uppercase tracking-[0.1em]">{{ t('pdf_hint_pages') }}</span>
            <span class="w-px h-3 bg-primary/15"></span>
            <span class="text-[10px] uppercase tracking-[0.1em]">{{ t('pdf_hint_zoom') }}</span>
          </div>
        </div>

        <!-- CANVAS AREA -->
        <div
          id="cert-canvas-wrap"
          ref="canvasWrapRef"
          class="flex-1 overflow-auto relative flex items-start justify-center p-4"
          style="min-height: 0; scroll-behavior: smooth"
        >
          <div
            v-show="loading"
            class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 z-10 backdrop-blur-sm"
          >
            <div class="flex items-center gap-2">
              <div class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
              <div
                class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]"
              ></div>
              <div
                class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]"
              ></div>
            </div>
            <span
              class="text-[length:var(--text-xs)] text-primary/70 uppercase tracking-[0.12em]"
            >
              {{ loadingText }}
            </span>
          </div>

          <div
            v-if="loadError && !loading"
            class="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-6"
          >
            <p class="text-sm text-primary/80">{{ t('pdf_error_msg') }}</p>
            <a
              :href="resolvedUrl"
              :download="downloadFilename"
              class="rpg-button px-4 py-2 text-xs font-bold uppercase tracking-widest text-white"
            >
              {{ t('cv_pdf_download') }}
            </a>
          </div>

          <canvas
            v-show="!loadError"
            id="cert-canvas"
            ref="canvasRef"
            class="shadow-[0_0_40px_rgba(0,0,0,0.9)]"
            style="display: block; max-width: none"
          ></canvas>
        </div>

        <!-- FOOTER -->
        <div
          class="flex-shrink-0 flex items-center justify-between px-3 sm:px-4 py-1.5 border-t border-primary bg-black/40"
        >
          <span class="text-[length:var(--text-xs)] text-primary/60 uppercase tracking-[0.08em]">
            {{ footerHintText }}
          </span>
          <div class="flex gap-1 items-end">
            <div class="w-1 h-1.5 bg-primary/20"></div>
            <div class="w-1 h-1.5 bg-primary/50"></div>
            <div class="w-1 h-1.5 bg-primary animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
