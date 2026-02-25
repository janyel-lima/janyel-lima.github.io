// ============================================================
// CHARTS.JS — SKILL VISUALIZATION SYSTEM
// Features: i18n reactive, type switching, export (PNG/CSV),
//           tooltips traduzidos, glow, rank axis
// ============================================================


// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const CHART_COLORS = {
  top1:    'rgba(0,255,255,0.70)',
  top2:    'rgba(0,220,220,0.58)',
  top3:    'rgba(0,180,180,0.46)',
  default: 'rgba(7,123,128,0.40)',

  borderTop:     'rgba(0,255,255,0.95)',
  borderDefault: 'rgba(8,196,202,0.60)',

  radarFill:   'rgba(7,123,128,0.22)',
  radarBorder: 'rgba(8,196,202,0.60)',

  gridHighlight: 'rgba(0,255,255,0.35)',
  gridDefault:   'rgba(255,255,255,0.12)',

  tickHighlight: 'rgba(0,255,255,0.90)',
  tickLabel:     'rgba(255,255,255,0.95)',
  tooltipBg:     'rgba(5,20,30,0.92)',
};

// Tipos disponíveis por categoria
const CHART_TYPES = {
  hard: ['bar', 'radar', 'polarArea'],
  soft: ['radar', 'bar', 'polarArea'],
};

// Ícones dos botões de toggle (texto ASCII para zero dependência)
const TYPE_ICONS = {
  bar:       '▬ BAR',
  radar:     '◈ RADAR',
  polarArea: '◎ POLAR',
};


// ─────────────────────────────────────────────────────────────
// REGISTRY — instâncias ativas por canvasId
// Permite re-renderizar e exportar de fora
// ─────────────────────────────────────────────────────────────
const _chartRegistry = {};


// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function resolveSkillI18nKey(skill) {
  let key = skill.label;
  key = key.replace(/^soft_soft_/, 'soft_');
  key = key.replace(/^skill_skill_/, 'skill_');
  return `skills.${key}`;
}

function t(key) {
  return Alpine?.store('i18n')?.t(key) ?? key;
}

function getLabels(entries) {
  return entries.map(([, skill]) => t(resolveSkillI18nKey(skill)) || skill.label);
}

function sortEntries(entries, chartType) {
  return chartType === 'bar'
    ? [...entries].sort((a, b) => b[1].value - a[1].value)
    : entries;
}

// Mapa value → rank label (derivado do dataset)
function buildRankAxis(entries) {
  const map = {};
  entries.forEach(([, skill]) => {
    if (!map[skill.value]) map[skill.value] = skill.level;
  });
  return map;
}

// Cores por posição (bar) ou constante (radar/polar)
function buildColors(chartType, values) {
  if (chartType === 'bar') {
    return {
      bg: values.map((_, i) => [
        CHART_COLORS.top1, CHART_COLORS.top2, CHART_COLORS.top3
      ][i] ?? CHART_COLORS.default),
      border: values.map((_, i) =>
        i < 3 ? CHART_COLORS.borderTop : CHART_COLORS.borderDefault
      ),
    };
  }
  return {
    bg:     CHART_COLORS.radarFill,
    border: CHART_COLORS.radarBorder,
  };
}


// ─────────────────────────────────────────────────────────────
// SCALES CONFIG
// ─────────────────────────────────────────────────────────────

function buildScales(chartType, rankAxis) {
  if (chartType === 'radar') {
    return {
      r: {
        min: 0, max: 5,
        ticks: { display: false },
        grid:        { color: 'rgba(255,255,255,0.08)' },
        angleLines:  { color: 'rgba(255,255,255,0.08)' },
        pointLabels: {
          color: CHART_COLORS.tickLabel,
          font: { family: 'monospace', size: 9 },
        },
      },
    };
  }

  if (chartType === 'polarArea') {
    return {
      r: {
        min: 0, max: 5,
        ticks: { display: false },
        grid: { color: 'rgba(255,255,255,0.08)' },
      },
    };
  }

  // bar
  return {
    x: {
      min: 0, max: 5,
      ticks: {
        padding: 6,
        color: CHART_COLORS.tickHighlight,
        font: { family: 'monospace', size: 10, weight: 'bold' },
        callback: value => rankAxis[value] ?? '',
      },
      grid: {
        color:     ctx => rankAxis[ctx.tick?.value] ? CHART_COLORS.gridHighlight : CHART_COLORS.gridDefault,
        lineWidth: ctx => rankAxis[ctx.tick?.value] ? 1.5 : 1,
      },
    },
    y: {
      ticks: {
        color: CHART_COLORS.tickLabel,
        font: { family: 'monospace', size: 9 },
      },
      grid: { display: false },
    },
  };
}


// ─────────────────────────────────────────────────────────────
// DATASET CONFIG
// ─────────────────────────────────────────────────────────────

function buildDataset(chartType, values, colors) {
  const isRadar = chartType === 'radar';
  const isBar   = chartType === 'bar';
  const isPolar = chartType === 'polarArea';

  return {
    data:            values,
    fill:            isRadar,
    borderColor:     colors.border,
    backgroundColor: isPolar
      ? values.map((_, i) => [
          CHART_COLORS.top1, CHART_COLORS.top2, CHART_COLORS.top3
        ][i] ?? CHART_COLORS.default)
      : colors.bg,
    borderWidth: 1,
    pointRadius:          isRadar ? 2 : 0,
    pointBackgroundColor: '#00ffffff',
    pointBorderColor:     '#00ffffff',
    barThickness:  isBar ? 14 : undefined,
    borderSkipped: false,
  };
}


// ─────────────────────────────────────────────────────────────
// TOOLTIP CONFIG
// ─────────────────────────────────────────────────────────────

function buildTooltip(skillKeys, skillsData) {
  return {
    backgroundColor: CHART_COLORS.tooltipBg,
    borderColor:     CHART_COLORS.borderTop,
    borderWidth:     1,
    titleColor:      CHART_COLORS.tickHighlight,
    bodyColor:       CHART_COLORS.tickLabel,
    padding:         10,
    callbacks: {
      title: ctx => {
        const key   = skillKeys[ctx[0]?.dataIndex];
        const skill = skillsData[key];
        return t(resolveSkillI18nKey(skill)) || skill?.label || key;
      },
      label: ctx => {
        const key   = skillKeys[ctx.dataIndex];
        const skill = skillsData[key];
        const level = skill?.level ?? '?';
        const desc  = t(`levels.${level}`) || level;
        return ` Rank ${level} — ${desc}`;
      },
    },
  };
}


// ─────────────────────────────────────────────────────────────
// CORE RENDER
// ─────────────────────────────────────────────────────────────

window.renderSkillChart = function ({ canvasId, skillsData, type = 'hard', chartType = null }) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !window.Chart || !window.Alpine) return;

  // Destrói instância anterior
  if (canvas._chart) { canvas._chart.destroy(); canvas._chart = null; }

  const resolvedType = chartType ?? (type === 'soft' ? 'radar' : 'bar');
  const rawEntries   = Object.entries(skillsData);
  const entries      = sortEntries(rawEntries, resolvedType);
  const skillKeys    = entries.map(([key]) => key);
  const labels       = getLabels(entries);
  const values       = entries.map(([, s]) => s.value);
  const rankAxis     = buildRankAxis(entries);
  const colors       = buildColors(resolvedType, values);

  canvas._chart = new Chart(canvas, {
    type: resolvedType,
    data: {
      labels,
      datasets: [buildDataset(resolvedType, values, colors)],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      animation:           { duration: 400, easing: 'easeInOutQuart' },
      indexAxis:           resolvedType === 'bar' ? 'y' : undefined,
      scales:              buildScales(resolvedType, rankAxis),
      plugins: {
        legend:  { display: false },
        tooltip: buildTooltip(skillKeys, skillsData),
      },
    },
  });

  // Salva no registry com metadados para re-render e export
  _chartRegistry[canvasId] = {
    canvasId,
    skillsData,
    type,
    currentChartType: resolvedType,
  };

  return canvas._chart;
};


// ─────────────────────────────────────────────────────────────
// RE-RENDER (mantém chartType atual)
// Chamado pelo listener de i18n
// ─────────────────────────────────────────────────────────────

function reRenderChart(canvasId) {
  const reg = _chartRegistry[canvasId];
  if (!reg) return;
  renderSkillChart({
    canvasId:  reg.canvasId,
    skillsData: reg.skillsData,
    type:       reg.type,
    chartType:  reg.currentChartType,
  });
}


// ─────────────────────────────────────────────────────────────
// I18N REACTIVITY
// Re-renderiza todos os charts quando o idioma muda
// ─────────────────────────────────────────────────────────────

window.addEventListener('i18n:changed', () => {
  Object.keys(_chartRegistry).forEach(reRenderChart);
});


// ─────────────────────────────────────────────────────────────
// CHART TYPE SWITCHER
// Troca o tipo de gráfico com animação seamless
// ─────────────────────────────────────────────────────────────

window.switchChartType = function (canvasId, nextType) {
  const reg = _chartRegistry[canvasId];
  if (!reg) return;
  if (reg.currentChartType === nextType) return;

  reg.currentChartType = nextType;
  renderSkillChart({
    canvasId:   reg.canvasId,
    skillsData: reg.skillsData,
    type:       reg.type,
    chartType:  nextType,
  });

  // Atualiza estado dos botões de toggle
  _updateToggleButtons(canvasId, nextType);
};

// Cicla para o próximo tipo disponível
window.cycleChartType = function (canvasId) {
  const reg = _chartRegistry[canvasId];
  if (!reg) return;

  const available = CHART_TYPES[reg.type] ?? ['bar', 'radar'];
  const idx  = available.indexOf(reg.currentChartType);
  const next = available[(idx + 1) % available.length];
  switchChartType(canvasId, next);
};

function _updateToggleButtons(canvasId, activeType) {
  const wrapper = document.querySelector(`[data-chart-toggles="${canvasId}"]`);
  if (!wrapper) return;

  wrapper.querySelectorAll('[data-chart-type]').forEach(btn => {
    const isActive = btn.dataset.chartType === activeType;
    btn.classList.toggle('text-primary',    isActive);
    btn.classList.toggle('border-primary',  isActive);
    btn.classList.toggle('opacity-100',     isActive);
    btn.classList.toggle('opacity-40',      !isActive);
  });
}


// ─────────────────────────────────────────────────────────────
// EXPORT — PNG
// ─────────────────────────────────────────────────────────────

window.exportChartPNG = function (canvasId, filename) {
  const canvas = document.getElementById(canvasId);
  if (!canvas?._chart) return;

  // Renderiza em fundo escuro para o PNG ficar legível
  const tmpCanvas  = document.createElement('canvas');
  tmpCanvas.width  = canvas.width;
  tmpCanvas.height = canvas.height;
  const tmpCtx     = tmpCanvas.getContext('2d');

  tmpCtx.fillStyle = '#0a0a1a';
  tmpCtx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
  tmpCtx.drawImage(canvas, 0, 0);

  const link    = document.createElement('a');
  link.download = filename ?? `${canvasId}_${Date.now()}.png`;
  link.href     = tmpCanvas.toDataURL('image/png');
  link.click();
};


// ─────────────────────────────────────────────────────────────
// EXPORT — CSV
// ─────────────────────────────────────────────────────────────

window.exportChartCSV = function (canvasId, filename) {
  const reg = _chartRegistry[canvasId];
  if (!reg) return;

  const lang   = Alpine?.store('i18n')?.lang ?? 'en';
  const header = lang === 'pt-br'
    ? 'Habilidade,Rank,Valor'
    : 'Skill,Rank,Value';

  const rows = Object.entries(reg.skillsData).map(([, skill]) => {
    const label = t(resolveSkillI18nKey(skill)) || skill.label;
    return `"${label}",${skill.level},${skill.value}`;
  });

  const csv  = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.download = filename ?? `${canvasId}_${Date.now()}.csv`;
  link.href     = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
};


// ─────────────────────────────────────────────────────────────
// MOUNT CONTROLS
// Injeta os botões de toggle + export num container existente.
//
// Uso no HTML:
//   <div data-chart-controls="hardSkillsChart"
//        data-chart-category="hard">
//   </div>
//
// Depois chame: mountChartControls('hardSkillsChart')
// ─────────────────────────────────────────────────────────────

window.mountChartControls = function (canvasId) {
  const container = document.querySelector(`[data-chart-controls="${canvasId}"]`);
  if (!container) return;

  const reg      = _chartRegistry[canvasId];
  const category = container.dataset.chartCategory ?? (reg?.type ?? 'hard');
  const types    = CHART_TYPES[category] ?? ['bar', 'radar'];

  // Toggle buttons
  const togglesWrapper = document.createElement('div');
  togglesWrapper.setAttribute('data-chart-toggles', canvasId);
  togglesWrapper.className = 'flex gap-2 flex-wrap';

  types.forEach(ct => {
    const btn = document.createElement('button');
    btn.dataset.chartType = ct;
    btn.textContent       = TYPE_ICONS[ct] ?? ct.toUpperCase();
    btn.className = [
      'px-2 py-0.5',
      'text-[length:var(--text-micro)] font-mono uppercase tracking-widest',
      'border rounded-sm transition-all duration-200',
      'border-primary/30 text-primary/60',
      'hover:text-primary hover:border-primary hover:opacity-100',
    ].join(' ');

    btn.addEventListener('click', () => switchChartType(canvasId, ct));
    togglesWrapper.appendChild(btn);
  });

  // Export buttons
  const exportWrapper = document.createElement('div');
  exportWrapper.className = 'flex gap-2 flex-wrap';

  const exportPNGBtn = document.createElement('button');
  exportPNGBtn.textContent = '↓ PNG';
  exportPNGBtn.className = [
    'px-2 py-0.5',
    'text-[length:var(--text-micro)] font-mono uppercase tracking-widest',
    'border border-primary/20 rounded-sm text-primary/50',
    'hover:text-primary hover:border-primary transition-all duration-200',
  ].join(' ');
  exportPNGBtn.addEventListener('click', () => exportChartPNG(canvasId));

  const exportCSVBtn = document.createElement('button');
  exportCSVBtn.textContent = '↓ CSV';
  exportCSVBtn.className   = exportPNGBtn.className;
  exportCSVBtn.addEventListener('click', () => exportChartCSV(canvasId));

  exportWrapper.appendChild(exportPNGBtn);
  exportWrapper.appendChild(exportCSVBtn);

  container.innerHTML = '';
  container.appendChild(togglesWrapper);
  container.appendChild(exportWrapper);

  // Sincroniza estado inicial dos botões
  if (reg) _updateToggleButtons(canvasId, reg.currentChartType);
};


// ─────────────────────────────────────────────────────────────
// INITIALIZERS (API pública — compatível com uso anterior)
// ─────────────────────────────────────────────────────────────

window.initHardSkillsChart = () => {
  renderSkillChart({
    canvasId:  'hardSkillsChart',
    skillsData: skillLevels.hard,
    type:      'hard',
  });
  mountChartControls('hardSkillsChart');
};

window.initSoftSkillsChart = () => {
  renderSkillChart({
    canvasId:  'softSkillsChart',
    skillsData: skillLevels.soft,
    type:      'soft',
  });
  mountChartControls('softSkillsChart');
};

// Expõe o registry publicamente (para debug ou integrações externas)
window.charts = _chartRegistry;