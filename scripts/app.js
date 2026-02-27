// ==============================
// LOCALE AUTO-DETECT
// ==============================
function detectLocale() {
  const saved = localStorage.getItem('pref-lang');
  if (saved === 'pt-br' || saved === 'en') return saved;

  const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  return nav.startsWith('pt') ? 'pt-br' : 'en';
}

// currentLang é a fonte de verdade para updateInterfaceStatic
// É sincronizado sempre que o idioma muda
let currentLang = detectLocale();

// ==============================
// ALPINE INIT
// ==============================
document.addEventListener('alpine:init', () => {

  // ==============================
  // GLOBAL: I18N STORE
  // ==============================
  Alpine.store('i18n', {
    lang: detectLocale(),
    messages: i18n,

    t(key) {
      const keys = String(key ?? '').split('.');
      let val = this.messages?.[this.lang];

      for (const k of keys) {
        if (val == null) break;
        val = val[k];
      }

      if (
        val &&
        typeof val === 'object' &&
        !Array.isArray(val) &&
        (('en' in val) || ('pt-br' in val))
      ) {
        return val[this.lang] ?? val.en ?? val['pt-br'] ?? key;
      }

      return val ?? key;
    },

    setLang(next) {
      const newLang = next === 'pt-br' ? 'pt-br' : 'en';
      if (this.lang === newLang) return;

      this.lang = newLang;
      localStorage.setItem('pref-lang', this.lang);

      // Sincroniza a variável global ANTES de disparar o evento
      // para que updateInterfaceStatic já leia o valor correto
      currentLang = this.lang;

      window.dispatchEvent(new CustomEvent('i18n:changed', {
        detail: { lang: this.lang }
      }));
    },

    toggle() {
      this.setLang(this.lang === 'en' ? 'pt-br' : 'en');
    }
  });

  // ==============================
  // GLOBAL: SFX STORE
  // ==============================
  Alpine.store('sfx', {
    muted: localStorage.getItem('sfx-muted') === 'true',

    sounds: {
      click: new Audio('./sfx/click.mp3'),
      loading: new Audio('./sfx/loading.mp3'),
      close: new Audio('./sfx/close.mp3'),
      hover: new Audio('./sfx/hover.mp3'),
      select: new Audio('./sfx/click.mp3')
    },

    init() {
      for (const a of Object.values(this.sounds)) {
        a.preload = 'auto';
        a.volume = 0.6;
      }
      this.sounds.loading.loop = false;
    },

    play(name) {
      if (this.muted) return;
      const sound = this.sounds[name];
      if (!sound) return;

      try {
        sound.currentTime = 0;
        sound.play().catch(() => { });
      } catch (_) { }
    },

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('sfx-muted', this.muted);
    }
  });

  // ==============================
  // COMPONENT: IMAGE CAROUSEL
  // ==============================
  Alpine.data('imageCarousel', (images = []) => ({
    images,
    index: 0,
    interval: null,

    get currentImage() {
      return this.images?.[this.index] ?? '';
    },

    start() {
      this.pause();
      if (!this.images || this.images.length <= 1) return;
      this.interval = setInterval(() => { this.next(); }, 3000);
    },

    pause() {
      if (this.interval) clearInterval(this.interval);
      this.interval = null;
    },

    resume() { this.start(); },
    destroy() { this.pause(); },

    next() {
      const total = this.images?.length ?? 0;
      if (!total) return;
      this.index = (this.index + 1) % total;
    },

    go(i) {
      const total = this.images?.length ?? 0;
      if (!total) return;
      const idx = Number(i);
      if (!Number.isFinite(idx)) return;
      this.index = Math.max(0, Math.min(idx, total - 1));
    }
  }));

  // ==============================
  // SEARCH STORE
  // ==============================
  Alpine.store('search', {
    q: localStorage.getItem('search-q') || '',

    persist() { localStorage.setItem('search-q', this.q || ''); },
    clear() { this.q = ''; localStorage.removeItem('search-q'); },

    normalize(str) {
      return String(str ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[_\-]+/g, ' ')
        .trim();
    },

    match(haystack) {
      const q = this.normalize(this.q);
      if (!q) return true;
      return this.normalize(haystack).includes(q);
    }
  });

  // ==============================
  // COMPONENT: PROJECT STREAM
  // ==============================
  Alpine.data('projectStream', (projects, windowSize = 4) => ({
    projects,
    windowSize,
    cursor: 0,
    direction: 'next',

    get visibleProjects() {
      const list = this.filteredProjects;
      const total = list.length;
      if (!total) return [];

      const out = [];
      for (let i = 0; i < this.windowSize; i++) {
        out.push(list[(this.cursor + i) % total]);
      }
      return out;
    },

    next() {
      const total = this.projects?.length ?? 0;
      if (!total) return;
      this.direction = 'next';
      this.cursor = (this.cursor + 1) % total;
      this.$store.sfx.play('select');
      refreshIcons();
    },

    prev() {
      const total = this.projects?.length ?? 0;
      if (!total) return;
      this.direction = 'prev';
      this.cursor = (this.cursor - 1 + total) % total;
      this.$store.sfx.play('select');
      refreshIcons();
    },

    get filteredProjects() {
      const s = Alpine.store('search');
      return this.projects.filter(p => {
        const lang = Alpine.store('i18n').lang;
        const text = [
          p.title,
          p.type?.[lang],
          p.about?.[lang],
          ...(p.stack?.map(x => x.key) ?? []),
          ...(p.team?.map(x => x.name) ?? []),
        ].join(' ');
        return s.match(text);
      });
    }
  }));
});


// ==============================
// GLOBAL HELPERS
// ==============================

function getTranslatedLabels() {
  const i18nStore = Alpine.store('i18n');
  const hardLabels = Object.values(window.skillLevels?.hard ?? {}).map(s => s?.label).filter(Boolean);
  const softLabels = Object.values(window.skillLevels?.soft ?? {}).map(s => s?.label).filter(Boolean);
  return [...hardLabels, ...softLabels].map(key => i18nStore.t(`skills.${key}`));
}

function getMinYear(period) {
  if (!period) return '';
  if (typeof period === 'object' && period !== null) {
    const lang = Alpine.store('i18n')?.lang ?? 'en';
    period = period[lang] ?? period.en ?? period['pt-br'] ?? '';
  }
  const years = String(period).match(/\d{4}/g);
  return years ? Math.min(...years.map(Number)) : '';
}


// ==============================
// STATIC I18N: DATA-I18N ELEMENTS
// Lê sempre de currentLang (sincronizado com o store)
// ==============================
function updateInterfaceStatic() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[currentLang]?.[key]) el.innerText = i18n[currentLang][key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (i18n[currentLang]?.[key]) el.placeholder = i18n[currentLang][key];
  });

  const langLabel = document.getElementById('current-lang');
  if (langLabel) langLabel.innerText = currentLang.toUpperCase();
}

document.addEventListener('DOMContentLoaded', () => {
  currentLang = detectLocale(); // garante sincronia no carregamento
  updateInterfaceStatic();
});


// ==============================
// ICONS REFRESH (RAF DEBOUNCED)
// ==============================
let _iconsRAF = null;
function refreshIcons() {
  if (_iconsRAF) return;
  _iconsRAF = requestAnimationFrame(() => {
    _iconsRAF = null;
    if (window.lucide) lucide.createIcons();
  });
}


// ==============================
// SKILL RESOLVER
// ==============================
function resolveSkill(skillKey) {
  const level = window.skillLevels?.hard?.[skillKey] || window.skillLevels?.soft?.[skillKey];
  const labelKey = level?.label ?? skillKey;
  return {
    key: skillKey,
    labelKey,
    label: Alpine.store('i18n').t(`skills.${labelKey}`),
    icon: window.skillIcons?.[labelKey] ?? window.DEFAULT_ICON,
    level: level?.level ?? null
  };
}


// ==============================
// IMAGE ERROR HANDLING
// ==============================
const IMAGE_FALLBACK = 'https://placehold.co/600x400/1a0b33/ab34fa?text=Asset+Missing';

function handleImageError(e) {
  const img = e?.target;
  if (!img) return;

  img.onerror = null;
  img.src = IMAGE_FALLBACK;

  const container = img.parentElement;
  if (container) container.classList.remove('loading-shimmer');

  img.classList.remove(
    'group-hover:grayscale-0',
    'group-hover/member:grayscale-0',
    'group-hover:opacity-100',
    'group-hover:scale-110'
  );
  img.classList.add('grayscale', 'opacity-20');
  img.style.filter = 'sepia(1) hue-rotate(240deg) brightness(0.3)';
}


// ==============================
// SENIORITY CALCULATION
// ==============================
function calculateLevel() {
  const start = new Date(devStats.startedCareer);
  const now = new Date();
  const years = (now - start) / (1000 * 60 * 60 * 24 * 365.25);

  let label = 'Junior';
  let progress = 0;

  if (years >= 5) {
    label = 'Senior';
    progress = 100;
  } else if (years >= 2) {
    label = 'Pleno';
    progress = ((years - 2) / 3) * 100;
  } else {
    label = 'Junior';
    progress = (years / 2) * 100;
  }

  return {
    years: years.toFixed(1),
    label,
    percent: Math.min(progress, 100).toFixed(0)
  };
}


// ==============================
// HEADER SCROLL (OPTIMIZED)
// ==============================
(() => {
  let lastCompact = null;

  window.addEventListener('scroll', () => {
    const header = document.getElementById('main-header');
    const logoContainer = document.getElementById('header-logo-container');
    if (!header || !logoContainer) return;

    const compact = window.scrollY > 50;
    if (compact === lastCompact) return;
    lastCompact = compact;

    if (compact) {
      header.classList.remove('p-4', 'md:p-6', 'h-24', 'md:h-28');
      header.classList.add('p-2', 'md:p-3', 'h-16', 'border-primary/60', 'backdrop-blur-md', 'shadow-[0_4px_20px_rgba(0,0,0,0.5)]');
      logoContainer.classList.remove('md:w-16', 'md:h-16');
      logoContainer.classList.add('md:w-10', 'md:h-10');
    } else {
      header.classList.add('p-4', 'md:p-6', 'h-24', 'md:h-28');
      header.classList.remove('p-2', 'md:p-3', 'h-16', 'border-primary/60', 'backdrop-blur-md', 'shadow-[0_4px_20px_rgba(0,0,0,0.5)]');
      logoContainer.classList.add('md:w-16', 'md:h-16');
      logoContainer.classList.remove('md:w-10', 'md:h-10');
    }
  }, { passive: true });
})();


// ==============================
// PARTICLES (SAFE INIT)
// ==============================
(() => {
  if (typeof particlesJS !== 'function') return;

  particlesJS('particles-js', {
    particles: {
      number: { value: 70, density: { enable: true, value_area: 850 } },
      color: { value: '#d0eef2' },
      opacity: { value: 0.5, random: false, anim: { enable: false, speed: 1, opacity_min: 0.1, sync: false } },
      size: { value: 2, random: true, anim: { enable: false, speed: 20, size_min: 0.1, sync: false } },
      line_linked: { enable: true, distance: 150, color: '#d0eef2', opacity: 0.4, width: 1 },
      move: { enable: true, speed: 2, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false, attract: { enable: false, rotateX: 600, rotateY: 1200 } }
    },
    interactivity: {
      detect_on: 'canvas',
      events: { onhover: { enable: true, mode: 'grab' }, resize: true },
      modes: { grab: { distance: 180, line_linked: { opacity: 0.6 } } }
    },
    retina_detect: true
  });
})();


// ==============================
// EXPANDABLE TYPED TEXT
// ==============================
function expandableTypedText(getText, truncateAt = 20, speed = 12) {
  return {
    expanded: false,
    typedText: '',
    interval: null,
    observer: null,
    isVisible: true,
    lastFullText: '',

    get fullText() {
      const t = typeof getText === 'function' ? getText() : getText;
      return String(t ?? '');
    },

    get shouldShowToggle() {
      return this.fullText.length > truncateAt;
    },

    get displayText() {
      if (this.expanded) return this.typedText;
      const base = this.fullText.slice(0, truncateAt);
      return base + (this.fullText.length > truncateAt ? '…' : '');
    },

    // Expõe o idioma atual como propriedade reativa do Alpine
    // para que o template possa usar x-text com o store diretamente
    get toggleLabel() {
      return Alpine.store('i18n').t(this.expanded ? 'collapse_data' : 'expand_data');
    },

    init() {
      this.lastFullText = this.fullText;

      this.observer = new IntersectionObserver((entries) => {
        const entry = entries[0];
        this.isVisible = entry.isIntersecting;
        if (!this.isVisible) this.stopTyping();
        if (this.isVisible && this.expanded && this.typedText.length < this.fullText.length) {
          this.resumeTyping();
        }
      }, { threshold: 0.15 });

      this.observer.observe(this.$el);

      this._onLang = () => {
        // Sincroniza currentLang caso o evento chegue antes do store atualizar
        currentLang = Alpine.store('i18n').lang;
        this.onTextChanged();
      };

      window.addEventListener('i18n:changed', this._onLang);
    },

    destroy() {
      this.stopTyping();
      if (this.observer) { this.observer.disconnect(); this.observer = null; }
      if (this._onLang) { window.removeEventListener('i18n:changed', this._onLang); this._onLang = null; }
    },

    onTextChanged() {
      const now = this.fullText;
      if (now === this.lastFullText) return;
      this.lastFullText = now;

      if (!this.expanded) {
        this.stopTyping();
        this.typedText = '';
        return;
      }

      this.stopTyping();
      this.typedText = now.slice(0, truncateAt);
      if (this.isVisible) this.resumeTyping();
    },

    toggle() {
      this.expanded = !this.expanded;

      if (!this.expanded) {
        this.stopTyping();
        this.typedText = '';
        return;
      }

      this.typedText = this.fullText.slice(0, truncateAt);
      if (this.isVisible) this.resumeTyping();
    },

    resumeTyping() {
      this.stopTyping();
      const full = this.fullText;
      if (this.typedText.length >= full.length) return;

      let i = this.typedText.length;
      this.interval = setInterval(() => {
        if (!this.isVisible) { this.stopTyping(); return; }
        this.typedText += full[i++] ?? '';
        if (i >= full.length) this.stopTyping();
      }, speed);
    },

    stopTyping() {
      if (this.interval) clearInterval(this.interval);
      this.interval = null;
    }
  };
}


// ==============================
// PROJECT CARD
// ==============================
function projectCard(p) {
  return {
    p,
    images: p?.images ?? [],
    index: 0,

    get currentImage() { return this.images?.[this.index] ?? ''; },

    init() {
      if (!this.images.length) this.index = 0;
      if (this.index >= this.images.length) this.index = 0;
    },

    next() {
      const total = this.images.length;
      if (!total) return;
      this.index = (this.index + 1) % total;
    },

    prev() {
      const total = this.images.length;
      if (!total) return;
      this.index = (this.index - 1 + total) % total;
    }
  };
}


// ==============================
// MAIN APP
// ==============================
function app() {
  return {
    devStats,
    myData,

    level: { label: 'Junior', years: '0.0', percent: 0 },

    locked: false,
    decrypting: false,
    progress: 0,
    showFragment: false,
    unlocked: false,

    skillIcons,
    _raf: null,

    get tierLabel() {
      const map = {
        'pt-br': { Junior: 'Júnior', Pleno: 'Pleno', Senior: 'Sênior' },
        'en': { Junior: 'Junior', Pleno: 'Mid-Level', Senior: 'Senior' }
      };
      return map[this.$store.i18n.lang]?.[this.level.label] ?? this.level.label;
    },

    startDecrypt() {
      if (this.unlocked) { this.showFragment = true; return; }

      this.locked = true;
      this.decrypting = true;
      this.progress = 0;

      const audio = this.$store.sfx.sounds.loading;
      audio.currentTime = 0;

      if (this._raf) cancelAnimationFrame(this._raf);
      audio.play().catch(() => { });

      const updateProgress = () => {
        if (!audio.duration || audio.duration === Infinity) {
          this._raf = requestAnimationFrame(updateProgress);
          return;
        }
        this.progress = Math.min((audio.currentTime / audio.duration) * 100, 100);
        if (!audio.ended) this._raf = requestAnimationFrame(updateProgress);
      };

      updateProgress();

      audio.onended = () => {
        cancelAnimationFrame(this._raf);
        this.progress = 100;
        this.locked = false;
        this.decrypting = false;
        this.unlocked = true;
        this.showFragment = true;
        localStorage.setItem('fragment-unlocked', '1');
      };
    },

    init() {
      this.$store.sfx.init();
      this.unlocked = localStorage.getItem('fragment-unlocked') === '1';

      currentLang = detectLocale();
      updateInterfaceStatic();
      this.recalculateLevel();

      window.addEventListener('i18n:changed', (e) => {
        // currentLang já foi sincronizado pelo store.setLang antes do evento
        // mas garantimos aqui também por segurança
        currentLang = e.detail.lang;
        updateInterfaceStatic();

        if (window.charts) {
          charts.data.labels = getTranslatedLabels();
          charts.update();
        }
      });
    },

    recalculateLevel() {
      if (typeof calculateLevel === 'function') this.level = calculateLevel();
    },

    closeFragment() {
      this.showFragment = false;
      this.$store.sfx.play('close');
    }
  };
}