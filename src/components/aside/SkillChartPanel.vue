<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  PolarAreaController,
  ArcElement,
  Tooltip,
} from 'chart.js';
import type { ChartType, SkillLevelEntry } from '../../types/portfolio';
import { formatRadarLabel, getChartThemePalette } from '../../utils/portfolioLogic';
import { useI18n } from '../../composables/useI18n';
import { useTheme } from '../../composables/useTheme';
import { useSfx } from '../../composables/useSfx';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  PolarAreaController,
  ArcElement,
  Tooltip
);

const props = defineProps<{
  canvasId: string;
  category: 'hard' | 'soft';
  skillsData: Record<string, SkillLevelEntry>;
  heightPx?: number;
  selectedSkillKey?: string | null;
}>();

const emit = defineEmits<{
  (e: 'select-skill', skillKey: string | null): void;
}>();

const { t, lang } = useI18n();
const { realm: currentRealm, isEldenMode } = useTheme();
const sfx = useSfx();

const availableTypes: ChartType[] =
  props.category === 'hard'
    ? ['bar', 'radar', 'polarArea']
    : ['radar', 'bar', 'polarArea'];

const typeIcons: Record<ChartType, string> = {
  bar: '▬ BAR',
  radar: '◈ RADAR',
  polarArea: '◎ POLAR',
};

const activeChartType = ref<ChartType>(props.category === 'soft' ? 'radar' : 'bar');
const canvasRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

function resolveSkillI18nKey(skill: SkillLevelEntry): string {
  let key = skill.label;
  key = key.replace(/^soft_soft_/, 'soft_');
  key = key.replace(/^skill_skill_/, 'skill_');
  return `skills.${key}`;
}

const selectedSkillDetails = computed(() => {
  const key = props.selectedSkillKey;
  if (!key || !props.skillsData[key]) return null;
  const entry = props.skillsData[key];
  return {
    key,
    label: t(resolveSkillI18nKey(entry)) || entry.label,
    level: entry.level,
    desc: t(`levels.${entry.level}`) || entry.level,
  };
});

function renderChart() {
  if (!canvasRef.value) return;
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const palette = getChartThemePalette(currentRealm.value);
  const resolvedType = activeChartType.value;
  const rawEntries = Object.entries(props.skillsData);
  const entries =
    resolvedType === 'bar'
      ? [...rawEntries].sort((a, b) => b[1].value - a[1].value)
      : rawEntries;

  const skillKeys = entries.map(([k]) => k);
  const rawLabels = entries.map(([, s]) => t(resolveSkillI18nKey(s)) || s.label);
  const isRadar = resolvedType === 'radar';
  const isBar = resolvedType === 'bar';
  const isPolar = resolvedType === 'polarArea';

  const labels = isRadar
    ? rawLabels.map((lbl) => formatRadarLabel(lbl, 13))
    : rawLabels;
  const values = entries.map(([, s]) => s.value);

  const rankAxis: Record<number, string> = {};
  entries.forEach(([, s]) => {
    if (!rankAxis[s.value]) rankAxis[s.value] = s.level;
  });

  const bgColors =
    isBar || isPolar
      ? values.map((_, i) => {
          const key = skillKeys[i];
          if (props.selectedSkillKey && key === props.selectedSkillKey) {
            return palette.selectedFill;
          }
          return (
            [palette.top1, palette.top2, palette.top3][i] ?? palette.default
          );
        })
      : palette.radarFill;

  const borderColors =
    isBar || isPolar
      ? values.map((_, i) => {
          const key = skillKeys[i];
          if (props.selectedSkillKey && key === props.selectedSkillKey) {
            return palette.selectedBorder;
          }
          return i < 3 ? palette.borderTop : palette.borderDefault;
        })
      : palette.radarBorder;

  const pointBackgroundColors = isRadar
    ? skillKeys.map((k) =>
        props.selectedSkillKey && k === props.selectedSkillKey
          ? palette.selectedBorder
          : palette.pointColor
      )
    : palette.pointColor;

  const pointRadii = isRadar
    ? skillKeys.map((k) =>
        props.selectedSkillKey && k === props.selectedSkillKey ? 6 : 3
      )
    : 0;

  let scales: Record<string, any> = {};
  if (isRadar) {
    scales = {
      r: {
        min: 0,
        max: 5,
        ticks: { display: false },
        grid: { color: palette.gridDefault },
        angleLines: { color: palette.gridDefault },
        pointLabels: {
          color: (ctx: any) => {
            const key = skillKeys[ctx.index];
            return props.selectedSkillKey && key === props.selectedSkillKey
              ? palette.tickHighlight
              : palette.tickLabel;
          },
          font: {
            family: isEldenMode.value ? '"Rajdhani", sans-serif' : 'monospace',
            size: 10,
            weight: 'bold',
          },
          padding: 6,
        },
      },
    };
  } else if (isPolar) {
    scales = {
      r: {
        min: 0,
        max: 5,
        ticks: { display: false },
        grid: { color: palette.gridDefault },
      },
    };
  } else {
    scales = {
      x: {
        min: 0,
        max: 5,
        ticks: {
          padding: 6,
          color: palette.tickHighlight,
          font: { family: 'monospace', size: 10, weight: 'bold' },
          callback: (val: any) => rankAxis[Number(val)] ?? '',
        },
        grid: {
          color: (ctx: any) =>
            rankAxis[ctx.tick?.value]
              ? palette.gridHighlight
              : palette.gridDefault,
          lineWidth: (ctx: any) => (rankAxis[ctx.tick?.value] ? 1.5 : 1),
        },
      },
      y: {
        ticks: {
          color: (ctx: any) => {
            const key = skillKeys[ctx.index];
            return props.selectedSkillKey && key === props.selectedSkillKey
              ? palette.tickHighlight
              : palette.tickLabel;
          },
          font: {
            family: isEldenMode.value ? '"Rajdhani", sans-serif' : 'monospace',
            size: 10,
          },
        },
        grid: { display: false },
      },
    };
  }

  chartInstance = new Chart(canvasRef.value, {
    type: resolvedType,
    data: {
      labels: labels as any,
      datasets: [
        {
          data: values,
          fill: isRadar,
          borderColor: borderColors as any,
          backgroundColor: bgColors as any,
          hoverBackgroundColor: palette.selectedFill,
          hoverBorderColor: palette.selectedBorder,
          borderWidth: isRadar ? 2 : 1.25,
          pointRadius: pointRadii as any,
          pointHoverRadius: isRadar ? 6 : 0,
          pointBackgroundColor: pointBackgroundColors as any,
          pointBorderColor: pointBackgroundColors as any,
          barThickness: isBar ? 14 : undefined,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 350 },
      layout: {
        padding: isRadar
          ? { left: 12, right: 12, top: 8, bottom: 8 }
          : { left: 2, right: 8, top: 4, bottom: 4 },
      },
      indexAxis: isBar ? 'y' : undefined,
      scales,
      onHover: (event, elements) => {
        const target = event.native?.target as HTMLElement | null;
        if (target) {
          target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
        }
      },
      onClick: (_event, elements) => {
        if (!elements.length) {
          if (props.selectedSkillKey) {
            emit('select-skill', null);
          }
          return;
        }
        const idx = elements[0].index;
        const clickedKey = skillKeys[idx];
        if (!clickedKey) return;
        sfx.play('carousel');
        emit(
          'select-skill',
          props.selectedSkillKey === clickedKey ? null : clickedKey
        );
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: palette.tooltipBg,
          borderColor: palette.borderTop,
          borderWidth: 1,
          titleColor: palette.tickHighlight,
          bodyColor: palette.tickLabel,
          padding: 10,
          callbacks: {
            title: (ctx) => {
              const key = skillKeys[ctx[0]?.dataIndex ?? 0];
              const skill = props.skillsData[key];
              return skill ? t(resolveSkillI18nKey(skill)) : key;
            },
            label: (ctx) => {
              const key = skillKeys[ctx.dataIndex];
              const skill = props.skillsData[key];
              const lvl = skill?.level ?? '?';
              const desc = t(`levels.${lvl}`) || lvl;
              return ` Rank ${lvl} — ${desc}`;
            },
          },
        },
      },
    },
  });
}

function switchType(type: ChartType) {
  if (activeChartType.value === type) return;
  activeChartType.value = type;
  sfx.play('toggle');
  renderChart();
}

function exportPNG() {
  if (!canvasRef.value) return;
  sfx.play('download');
  const palette = getChartThemePalette(currentRealm.value);
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = canvasRef.value.width;
  tmpCanvas.height = canvasRef.value.height;
  const tmpCtx = tmpCanvas.getContext('2d');
  if (!tmpCtx) return;

  tmpCtx.fillStyle = palette.exportBg;
  tmpCtx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
  tmpCtx.drawImage(canvasRef.value, 0, 0);

  const link = document.createElement('a');
  link.download = `${props.canvasId}_${currentRealm.value}_${Date.now()}.png`;
  link.href = tmpCanvas.toDataURL('image/png');
  link.click();
}

function exportCSV() {
  sfx.play('download');
  const header = lang.value === 'pt-br' ? 'Habilidade,Rank,Valor' : 'Skill,Rank,Value';
  const rows = Object.entries(props.skillsData).map(([, skill]) => {
    const label = t(resolveSkillI18nKey(skill)) || skill.label;
    return `"${label}",${skill.level},${skill.value}`;
  });
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.download = `${props.canvasId}_${lang.value}_${Date.now()}.csv`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

watch([lang, currentRealm, () => props.selectedSkillKey], () => {
  renderChart();
});

onMounted(() => {
  renderChart();
});

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
});
</script>

<template>
  <div class="relative w-full flex flex-col gap-2.5">
    <!-- CONTROLS: UNIFIED THEME BUTTON PALETTE -->
    <div class="flex justify-between items-center flex-wrap gap-2">
      <div class="flex gap-1.5 flex-wrap" :data-chart-toggles="canvasId">
        <button
          v-for="ct in availableTypes"
          :key="ct"
          type="button"
          :data-chart-type="ct"
          @click="switchType(ct)"
          class="px-2.5 py-1 text-[length:var(--text-micro)] font-mono uppercase tracking-widest border transition-all duration-200 cursor-pointer"
          :class="[
            isEldenMode ? 'rounded-none' : 'rounded-sm',
            activeChartType === ct
              ? isEldenMode
                ? 'border-[#c9a84c] bg-[#b366ff]/20 text-[#e2c777] shadow-[0_0_10px_rgba(179,102,255,0.3)] font-bold'
                : 'border-primary bg-primary/15 text-primary shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.28)] font-bold'
              : isEldenMode
                ? 'border-[#b366ff]/35 bg-[#160a28]/80 text-[#d8b4fe]/75 hover:border-[#c9a84c]/80 hover:text-[#f3efe6] hover:bg-[#b366ff]/15'
                : 'border-primary/35 bg-primary/5 text-primary/70 hover:text-primary hover:border-primary hover:bg-primary/15',
          ]"
        >
          {{ typeIcons[ct] }}
        </button>
      </div>

      <div class="flex gap-1.5 flex-wrap">
        <button
          type="button"
          @click="exportPNG"
          class="px-2.5 py-1 text-[length:var(--text-micro)] font-mono uppercase tracking-widest border transition-all duration-200 cursor-pointer"
          :class="
            isEldenMode
              ? 'rounded-none border-[#b366ff]/35 bg-[#160a28]/80 text-[#d8b4fe]/80 hover:border-[#c9a84c] hover:text-[#e2c777] hover:bg-[#b366ff]/15'
              : 'rounded-sm border-primary/35 bg-primary/5 text-primary/75 hover:text-primary hover:border-primary hover:bg-primary/15'
          "
        >
          ↓ PNG
        </button>
        <button
          type="button"
          @click="exportCSV"
          class="px-2.5 py-1 text-[length:var(--text-micro)] font-mono uppercase tracking-widest border transition-all duration-200 cursor-pointer"
          :class="
            isEldenMode
              ? 'rounded-none border-[#b366ff]/35 bg-[#160a28]/80 text-[#d8b4fe]/80 hover:border-[#c9a84c] hover:text-[#e2c777] hover:bg-[#b366ff]/15'
              : 'rounded-sm border-primary/35 bg-primary/5 text-primary/75 hover:text-primary hover:border-primary hover:bg-primary/15'
          "
        >
          ↓ CSV
        </button>
      </div>
    </div>

    <!-- ACTIVE SKILL INTERACTION BADGE -->
    <div
      v-if="selectedSkillDetails"
      class="flex items-center justify-between px-3 py-1.5 border text-[length:var(--text-micro)] uppercase tracking-wider animate-fade-in"
      :class="
        isEldenMode
          ? 'border-[#c9a84c]/50 bg-[#1a0b2e]/90 text-[#f3efe6]'
          : 'border-primary/50 bg-primary/10 text-white'
      "
    >
      <div class="flex items-center gap-2 truncate">
        <span :class="isEldenMode ? 'text-[#c9a84c]' : 'text-primary'">◆</span>
        <span class="font-bold">{{ selectedSkillDetails.label }}</span>
        <span :class="isEldenMode ? 'text-[#e2c777]' : 'text-primary'">
          [ Rank {{ selectedSkillDetails.level }} — {{ selectedSkillDetails.desc }} ]
        </span>
      </div>
      <button
        type="button"
        aria-label="Clear selected skill"
        @click="emit('select-skill', null)"
        class="ml-2 px-1.5 text-white/60 hover:text-primary cursor-pointer"
      >
        ✕
      </button>
    </div>

    <!-- CANVAS -->
    <div
      class="relative w-full"
      :style="{ height: `${heightPx ?? 255}px` }"
    >
      <canvas :id="canvasId" ref="canvasRef"></canvas>
    </div>
  </div>
</template>
