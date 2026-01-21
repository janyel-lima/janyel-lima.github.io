// ─────────────────────────────────────────
// I18N RESOLVER (ANTI-DUPLICAÇÃO DEFINITIVO)
// ─────────────────────────────────────────
function resolveSkillI18nKey(skill) {
  let key = skill.label

  key = key.replace(/^soft_soft_/, 'soft_')
  key = key.replace(/^skill_skill_/, 'skill_')

  return `skills.${key}`
}

// ─────────────────────────────────────────
// MAIN RENDER
// ─────────────────────────────────────────
window.renderSkillChart = function ({
  canvasId,
  skillsData,
  type = 'hard',          // 'hard' | 'soft'
  chartType = null        // null = auto
}) {
  const canvas = document.getElementById(canvasId)
  if (!canvas || !window.Chart || !window.Alpine) return

  if (canvas._chart) {
    canvas._chart.destroy()
    canvas._chart = null
  }

  const resolvedChartType =
    chartType ?? (type === 'soft' ? 'radar' : 'bar')

  const isRadar = resolvedChartType === 'radar'
  const isBar   = resolvedChartType === 'bar'

  // ─────────────────────────────────────────
  // NORMALIZE + ORDER DATA
  // ─────────────────────────────────────────
  let entries = Object.entries(skillsData)

  if (isBar) {
    entries.sort((a, b) => b[1].value - a[1].value)
  }

  const skillKeys = entries.map(([key]) => key)

  const labels = entries.map(([, skill]) =>
    Alpine.store('i18n')?.t(resolveSkillI18nKey(skill)) || skill.label
  )

  const values = entries.map(([, skill]) => skill.value)

  // ─────────────────────────────────────────
  // RANK AXIS — DERIVED FROM DATASET (CRITICAL)
  // value → level
  // ─────────────────────────────────────────
  const rankAxis = {}
  entries.forEach(([, skill]) => {
    if (!rankAxis[skill.value]) {
      rankAxis[skill.value] = skill.level
    }
  })

  // ─────────────────────────────────────────
  // TOP 3 GLOW (BAR)
  // ─────────────────────────────────────────
  const backgroundColors = isBar
    ? values.map((_, i) => {
        if (i === 0) return 'rgba(0,255,255,0.65)'
        if (i === 1) return 'rgba(0,220,220,0.55)'
        if (i === 2) return 'rgba(0,180,180,0.45)'
        return 'rgba(7,123,128,0.4)'
      })
    : 'rgba(7,123,128,0.22)'

  const borderColors = isBar
    ? values.map((_, i) =>
        i < 3
          ? 'rgba(0,255,255,0.95)'
          : 'rgba(8,196,202,0.6)'
      )
    : 'rgba(8,196,202,0.6)'

  // ─────────────────────────────────────────
  // CHART INSTANCE
  // ─────────────────────────────────────────
  canvas._chart = new Chart(canvas, {
    type: resolvedChartType,
    data: {
      labels,
      datasets: [{
        data: values,
        fill: isRadar,
        borderColor: borderColors,
        backgroundColor: backgroundColors,
        borderWidth: 1,

        // radar
        pointRadius: isRadar ? 2 : 0,
        pointBackgroundColor: '#00ffffff',
        pointBorderColor: '#00ffffff',

        // bar
        barThickness: isBar ? 14 : undefined,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: isBar ? 'y' : undefined,

      scales: isRadar
        ? {
            r: {
              min: 0,
              max: 5,
              ticks: { display: false },
              grid: { color: 'rgba(255,255,255,0.08)' },
              angleLines: { color: 'rgba(255,255,255,0.08)' },
              pointLabels: {
                color: 'rgba(255,255,255,0.95)',
                font: { family: 'monospace', size: 9 }
              }
            }
          }
        : {
            x: {
              min: 0,
              max: 5,
              ticks: {
                padding: 6,
                color: 'rgba(0,255,255,0.9)',
                font: {
                  family: 'monospace',
                  size: 10,
                  weight: 'bold'
                },
                callback: value => rankAxis[value] ?? ''
              },
              grid: {
                color: ctx =>
                  rankAxis[ctx.tick.value]
                    ? 'rgba(0,255,255,0.35)'
                    : 'rgba(255,255,255,0.12)',
                lineWidth: ctx =>
                  rankAxis[ctx.tick.value] ? 1.5 : 1
              }
            },
            y: {
              ticks: {
                color: 'rgba(255,255,255,0.95)',
                font: { family: 'monospace', size: 9 }
              },
              grid: { display: false }
            }
          },

      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const key = skillKeys[ctx.dataIndex]
              const skill = skillsData[key]

              const translated =
                Alpine.store('i18n')?.t(resolveSkillI18nKey(skill)) ||
                skill.label

              const levelText =
                Alpine.store('i18n')?.t(`levels.${skill.level}`) ||
                skill.level

              return `${translated} — Rank ${skill.level} · Power ${skill.value}`
            }
          }
        }
      }
    }
  })
}

// ─────────────────────────────────────────
// INITIALIZERS
// ─────────────────────────────────────────
window.initSoftSkillsChart = () =>
  renderSkillChart({
    canvasId: 'softSkillsChart',
    skillsData: skillLevels.soft,
    type: 'soft'
  })

window.initHardSkillsChart = () =>
  renderSkillChart({
    canvasId: 'hardSkillsChart',
    skillsData: skillLevels.hard,
    type: 'hard'
  })
