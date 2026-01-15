document.addEventListener('DOMContentLoaded', () => {

  /**
   * Função genérica para criar charts de skills
   * @param {string} canvasId - id do canvas
   * @param {object} skillsData - objeto com skills
   * @param {'hard'|'soft'} type - tipo de skill
   */
  function renderSkillChart(canvasId, skillsData, type = 'hard') {

    // Labels traduzidas usando i18n
    const labels = Object.keys(skillsData).map(key => {
      const skillKey = key.toLowerCase().replace(/ /g, "_").replace(/\./g,'')
      const i18nKey = type === 'soft' ? `skills.soft_${skillKey}` : `skills.skill_${skillKey}`
      return Alpine.store('i18n').t(i18nKey) || key
    })

    const values = Object.values(skillsData).map(s => s.value)
    const ctx = document.getElementById(canvasId)

    new Chart(ctx, {
      type: type === 'hard' ? 'radar' : 'bar',
      data: {
        labels,
        datasets: [{
          label: type.toUpperCase() + '_SKILLS',
          data: values,
          fill: true,
          borderColor: 'rgba(8,196,202,0.6)',
          borderWidth: 1,
          backgroundColor: 'rgba(7,123,128,0.22)',
          pointBackgroundColor: '#00ffffff',
          pointBorderColor: '#00ffffff',
          pointRadius: 2,
          // Configuração específica de barras
          barThickness: type === 'soft' ? 15 : undefined,
          borderRadius: type === 'soft' ? 0 : undefined,
          borderSkipped: type === 'soft' ? false : undefined,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: type === 'hard' ? {
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

                // Define a chave correta para i18n
                const skillKey = skillName.toLowerCase().replace(/ /g,"_").replace(/\./g,'')
                const i18nSkillKey = type === 'soft' ? `skills.soft_${skillKey}` : `skills.skill_${skillKey}`
                const translatedSkill = Alpine.store('i18n').t(i18nSkillKey) || skillName

                // Nível traduzido
                const levelText = Alpine.store('i18n').t(`levels.${skill.level}`) || skill.level

                return `Rank [${skill.level}]: ${levelText}`
              }
            }
          }
        }
      }
    })
  }

  // Renderiza Hard Skills
  renderSkillChart('hardSkillsChart', window.skillLevels.hard, 'hard')

  // Renderiza Soft Skills
  renderSkillChart('softSkillsChart', window.skillLevels.soft, 'soft')

})