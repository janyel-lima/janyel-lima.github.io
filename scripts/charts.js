document.addEventListener('DOMContentLoaded', () => {

  let currentChart = null

  /**
   * Retorna labels traduzidas para qualquer dataset
   * @param {object} skillsData 
   * @param {'hard'|'soft'} type 
   * @returns {string[]}
   */
  function getTranslatedLabels(skillsData, type = 'hard') {
    return Object.keys(skillsData).map(key => {
      const skillKey = key.toLowerCase().replace(/ /g, "_").replace(/\./g,'')
      const i18nKey = type === 'soft' ? `skills.soft_${skillKey}` : `skills.skill_${skillKey}`
      return Alpine.store('i18n').t(i18nKey) || key
    })
  }

  /**
   * Cria ou atualiza o chart
   * @param {string} canvasId 
   * @param {object} skillsData 
   * @param {'hard'|'soft'} type 
   * @param {'radar'|'bar'} chartType
   */
  function renderSkillChart(canvasId, skillsData, type = 'hard', chartType = 'radar') {
    const labels = getTranslatedLabels(skillsData, type)
    const values = Object.values(skillsData).map(s => s.value)
    const ctx = document.getElementById(canvasId)


    currentChart = new Chart(ctx, {
      type: chartType,
      data: {
        labels,
        datasets: [{
          label: type.toUpperCase() + '_SKILLS',
          data: values,
          fill: chartType === 'radar',
          borderColor: 'rgba(8,196,202,0.6)',
          borderWidth: 1,
          backgroundColor: chartType === 'radar' ? 'rgba(7,123,128,0.22)' : 'rgba(7,123,128,0.4)',
          pointBackgroundColor: '#00ffffff',
          pointBorderColor: '#00ffffff',
          pointRadius: 2,
          barThickness: chartType === 'bar' ? 15 : undefined,
          borderRadius: chartType === 'bar' ? 0 : undefined,
          borderSkipped: chartType === 'bar' ? false : undefined
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: chartType === 'radar' ? {
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
        } : {
          y: {
            min: 0,
            max: 5,
            ticks: { display: false },
            grid: { display: false }
          },
          x: {
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
                const skillKeys = Object.keys(skillsData)
                const skillName = skillKeys[ctx.dataIndex]
                const skill = skillsData[skillName]
                const skillKey = skillName.toLowerCase().replace(/ /g,"_").replace(/\./g,'')
                const i18nSkillKey = type === 'soft' ? `skills.soft_${skillKey}` : `skills.skill_${skillKey}`
                const translatedSkill = Alpine.store('i18n').t(i18nSkillKey) || skillName
                const levelText = Alpine.store('i18n').t(`levels.${skill.level}`) || skill.level
                return `Rank [${skill.level}]: ${levelText}`
              }
            }
          }
        }
      }
    })
  }

  // Inicializa com Hard Skills (radar)
  renderSkillChart('hardSkillsChart', window.skillLevels.hard, 'hard', 'radar')
renderSkillChart('softSkillsChart', window.skillLevels.soft, 'soft', 'radar')

  // Botões de toggle
 

})
