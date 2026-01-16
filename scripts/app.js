
document.addEventListener('alpine:init', () => {
  Alpine.store('i18n', {
    lang: localStorage.getItem('pref-lang') || 'en',
     messages: i18n, // seu objeto inteiro

  t(key) {
    const keys = key.split('.');
    let val = this.messages[this.lang];

    for (const k of keys) {
      if (val == null) break;
      val = val[k];
    }

    // Se for um objeto {pt, en}, pega a língua correta
    if (val && typeof val === 'object' && 'pt' in val && 'en' in val) {
      return val[this.lang] ?? key;
    }

    return val ?? key;
  },
    toggle() {
      
      this.lang = this.lang === 'en' ? 'pt-br' : 'en'
      localStorage.setItem('pref-lang', this.lang)
      updateInterfaceStatic()
      chart.data.labels = getTranslatedLabels()
      chart.update()
      
    }
  })
})

document.addEventListener('alpine:init', () => {
  Alpine.store('sfx', {
    muted: localStorage.getItem('sfx-muted') === 'true',

    sounds: {
      click: new Audio('./sfx/click.mp3'),
      loading: new Audio('./sfx/loading.mp3'),
      close: new Audio('./sfx/close.mp3'),
      hover: new Audio('./sfx/hover.mp3'),
    },

    init() {
      Object.values(this.sounds).forEach(a => {
        a.preload = 'auto'
        a.volume = 0.6

        this.sounds.loading.loop = false
      })
    },

    play(name) {
      if (this.muted) return
      const sound = this.sounds[name]
      if (!sound) return

      sound.currentTime = 0
      sound.play().catch(() => {})
    },

    toggleMute() {
      this.muted = !this.muted
      localStorage.setItem('sfx-muted', this.muted)
    }
  })
})

function getTranslatedLabels() {
  const i18n = Alpine.store('i18n')

  const hardLabels = Object.values(window.skillLevels.hard)
    .map(s => s?.label)
    .filter(Boolean)

  const softLabels = Object.values(window.skillLevels.soft)
    .map(s => s?.label)
    .filter(Boolean)

  return [...hardLabels, ...softLabels].map(
    key => i18n.t(`skills.${key}`)
  )
}


function getMinYear(period) {
  // Se o período for tipo "2023-2025" ou "2024"
  if (!period) return '';
  // Se for array por idioma
  if (typeof period === 'object') period = period[$store.i18n.lang] || '';
  const years = period.match(/\d{4}/g); // pega todos os anos
  return years ? Math.min(...years.map(Number)) : '';
}


function updateInterfaceStatic() {
  const lang = Alpine.store('i18n').lang
  const dict = i18n[lang]

  if (!dict) return

  document.title = dict.title

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n
    if (dict[key]) el.textContent = dict[key]
  })
}



document.addEventListener('alpine:init', () => {
  Alpine.data('projectStream', (projects, windowSize = 4) => ({
    projects,
    windowSize,
    cursor: 0,
    direction: 'next',

    get visibleProjects() {
      const total = this.projects.length
      const out = []

      for (let i = 0; i < this.windowSize; i++) {
        out.push(this.projects[(this.cursor + i) % total])
      }

      return out
    },

    next() {
      this.direction = 'next'
      this.cursor = (this.cursor + 1) % this.projects.length
      this.$store.sfx.play('select')
      refreshIcons()
    },

    prev() {
      this.direction = 'prev'
      this.cursor =
        (this.cursor - 1 + this.projects.length) % this.projects.length
      this.$store.sfx.play('select')
      refreshIcons()
    }
  }))
})

particlesJS("particles-js", {
  particles: {
    number: {
      value: 70,
      density: {
        enable: true,
        value_area: 850
      }
    },

    color: {
      value: "#d0eef2"
    },

    opacity: {
      value: 0.5,
      random: false,
      anim: {
        enable: false,
        speed: 1,
        opacity_min: 0.1,
        sync: false
      }
    },

    size: {
      value: 2,
      random: true,
      anim: {
        enable: false,
        speed: 20,
        size_min: 0.1,
        sync: false
      }
    },

    line_linked: {
      enable: true,
      distance: 150,
      color: "#d0eef2",
      opacity: 0.4,
      width: 1
    },

    move: {
      enable: true,
      speed: 2,
      direction: "none",
      random: false,
      straight: false,
      out_mode: "out",
      bounce: false,
      attract: {
        enable: false,
        rotateX: 600,
        rotateY: 1200
      }
    }
  },

  interactivity: {
  detect_on: "canvas",
  events: {
    onhover: {
      enable: true,
      mode: "grab"
    },
    resize: true
  },
  modes: {
    grab: {
      distance: 180,
      line_linked: {
        opacity: 0.6
      }
    }
  }
}
,

  retina_detect: true
});


function app() {
  return {
    devStats,
    myData,

    level: {
      label: 'Junior',
      years: '0.0',
      percent: 0
    },

    locked: false,
    decrypting: false,
    progress: 0,
    showFragment: false,
    unlocked: false,
    skillIcons,

    rafId: null,

    get tierLabel() {
      const map = {
        'pt-br': { Junior: 'Júnior', Pleno: 'Pleno', Senior: 'Sênior' },
        'en': { Junior: 'Junior', Pleno: 'Mid-Level', Senior: 'Senior' }
      }
      return map[this.$store.i18n.lang]?.[this.level.label] ?? this.level.label
    },iconFor(skillKey) {


        
  // 2. Retorna ícone ou fallback seguro
  return skillIcons[skillKey] ?? DEFAULT_ICON

      
    },
    startDecrypt() {
  // já descriptografado → só abrir
  if (this.unlocked) {
    this.showFragment = true
    return
  }

  this.locked = true
  this.decrypting = true
  this.progress = 0

  const audio = this.$store.sfx.sounds.loading
  audio.currentTime = 0

  // evita múltiplos loops
  if (this._raf) cancelAnimationFrame(this._raf)

  audio.play().catch(() => {})

  const updateProgress = () => {
    // ainda carregando metadata
    if (!audio.duration || audio.duration === Infinity) {
      this._raf = requestAnimationFrame(updateProgress)
      return
    }

    this.progress = Math.min(
      (audio.currentTime / audio.duration) * 100,
      100
    )

    if (!audio.ended) {
      this._raf = requestAnimationFrame(updateProgress)
    }
  }

  updateProgress()

  audio.onended = () => {
    cancelAnimationFrame(this._raf)

    this.progress = 100
    this.locked = false
    this.decrypting = false
    this.unlocked = true
    this.showFragment = true
  }
}
,
     finishDecrypt() {
      cancelAnimationFrame(this.rafId)
      this.progress = 100

      setTimeout(() => {
        this.locked = false
      }, 200)
    },

    init() {
      this.$store.sfx.init()
      updateInterfaceStatic();
      this.recalculateLevel()
      this.$nextTick(() => lucide.createIcons())
      this.unlocked = localStorage.getItem('fragment-unlocked') === '1'
    },
    watch: {
      unlocked(value) {
        if (value) localStorage.setItem('fragment-unlocked', '1')
      }
    },

    recalculateLevel() {
      if (typeof calculateLevel === 'function') {
        this.level = calculateLevel()
      }
    },
    closeFragment() {
      this.showFragment = false
    }
  }
}
function refreshIcons() {
  requestAnimationFrame(() => {
    if (window.lucide) {
      lucide.createIcons()
    }
  })
}


function resolveSkill(skillKey) {
  const level =
    window.skillLevels.hard[skillKey] ||
    window.skillLevels.soft[skillKey]

  return {
    key: skillKey,
    labelKey: level?.label ?? skillKey,
    label: Alpine.store('i18n').t(`skills.${level?.label ?? skillKey}`),
    icon: skillIcons[level?.label] ?? DEFAULT_ICON,
    level: level?.level ?? null
  }
}

// Image Error Handling

const IMAGE_FALLBACK = "https://placehold.co/600x400/1a0b33/ab34fa?text=Asset+Missing";

function handleImageError(e) {
  e.target.onerror = null;
  e.target.src = IMAGE_FALLBACK;
  const container = e.target.parentElement;
  if (container) container.classList.remove('loading-shimmer');
  e.target.classList.remove('group-hover:grayscale-0', 'group-hover/member:grayscale-0', 'group-hover:opacity-100', 'group-hover:scale-110');
  e.target.classList.add('grayscale', 'opacity-20');
  e.target.style.filter = 'sepia(1) hue-rotate(240deg) brightness(0.3)';
}

// Seniority Calculation
function calculateLevel() {
  const start = new Date(devStats.startedCareer);
  const now = new Date();
  const years = (now - start) / (1000 * 60 * 60 * 24 * 365.25);

  let label = "Junior";
  let progress = 0;

  if (years >= 5) {
    label = "Senior";
    progress = 100;
  } else if (years >= 2) {
    label = "Pleno";
    progress = ((years - 2) / 3) * 100;
  } else {
    label = "Junior";
    progress = (years / 2) * 100;
  }

  return {
    years: years.toFixed(1),
    label: label,
    percent: Math.min(progress, 100).toFixed(0)
  };
}
// header scroll behavior

window.addEventListener('scroll', () => {
  const header = document.getElementById('main-header');
  const logoContainer = document.getElementById('header-logo-container');

  if (window.scrollY > 50) {
    // Estado Compacto
    header.classList.remove('p-4', 'md:p-6', 'h-24', 'md:h-28');
    header.classList.add('p-2', 'md:p-3', 'h-16', 'border-primary/60','backdrop-blur-md', 'shadow-[0_4px_20px_rgba(0,0,0,0.5)]');
    logoContainer.classList.remove('md:w-16', 'md:h-16');
    logoContainer.classList.add('md:w-10', 'md:h-10');
  } else {
    // Estado Original
    header.classList.add('p-4', 'md:p-6', 'h-24', 'md:h-28');
    header.classList.remove('p-2', 'md:p-3', 'h-16', 'border-primary/60','backdrop-blur-md', 'shadow-[0_4px_20px_rgba(0,0,0,0.5)]');
    logoContainer.classList.add('md:w-16', 'md:h-16');
    logoContainer.classList.remove('md:w-10', 'md:h-10');
  }
});


