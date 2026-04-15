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
        ('en' in val || 'pt-br' in val)
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

      window.dispatchEvent(
        new CustomEvent('i18n:changed', {
          detail: { lang: this.lang },
        })
      );
    },

    toggle() {
      this.setLang(this.lang === 'en' ? 'pt-br' : 'en');
    },
  }); // ==============================
  // GLOBAL: SFX STORE — Web Audio API
  // Armored Core VI: Fires of Rubicon — dark mech interface
  // $store.sfx.play('nome') | toggleMute() | muted
  // ==============================
  Alpine.store('sfx', {
    muted: localStorage.getItem('sfx-muted') === 'true',
    musicPlaying: false,
    __ctx: null,
    __master: null,

    // ── Lazy init do AudioContext ──────────────────────────────
    _ctx() {
      if (!this.__ctx) {
        this.__ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.__master = this.__ctx.createGain();
        this.__master.gain.value = 0.38;
        this.__master.connect(this.__ctx.destination);

        // Desbloqueia no primeiro gesto do usuário (resolve o aviso de autoplay)
        const resume = () => {
          if (this.__ctx?.state === 'suspended') {
            this.__ctx.resume().catch(() => {});
          }
        };
        ['click', 'keydown', 'pointerdown'].forEach(evt =>
          document.addEventListener(evt, resume, { once: true, capture: true })
        );
      }

      // NÃO chama resume() aqui — o listener acima cuida disso no primeiro gesto
      // Retorna null se ainda suspenso; play() trata o null com segurança
      if (this.__ctx.state === 'suspended') return null;

      return this.__ctx;
    },

    // ── Buffer de ruído branco com decay exponencial ──────────
    _noise(c, duration, decay = 0.3) {
      const len = Math.floor(c.sampleRate * duration);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * decay));
      }
      return buf;
    },

    // ── WaveShaper para distorção metálica ────────────────────
    _distort(c, amount = 180) {
      const ws = c.createWaveShaper();
      const n = 512;
      const curve = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const x = (i * 2) / n - 1;
        curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
      }
      ws.curve = curve;
      ws.oversample = '4x';
      return ws;
    },

    // ── Conecta cadeia e termina no master ────────────────────
    _chain(master, ...nodes) {
      for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
      nodes[nodes.length - 1].connect(master);
    },

    // ── Catálogo de sons ──────────────────────────────────────
    _sounds: {
      /* ── hover ─────────────────────────────────────────────
         Retículo de mira se movendo: micro-tick metálico
         + sweep HF suave. Quase inaudível, só uma textura.    */
      hover(c, ch, ns, ds) {
        const t = c.currentTime;

        // Tick metálico de crosshair
        const s1 = c.createBufferSource();
        s1.buffer = ns(c, 0.012, 0.08);
        const hpf = c.createBiquadFilter();
        hpf.type = 'highpass';
        hpf.frequency.value = 4000;
        const g1 = c.createGain();
        g1.gain.setValueAtTime(0.18, t);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.012);
        ch(s1, hpf, g1);
        s1.start(t);

        // Sweep sine suave (reticle lock partial)
        const osc = c.createOscillator();
        const g2 = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t + 0.005);
        osc.frequency.linearRampToValueAtTime(1000, t + 0.055);
        g2.gain.setValueAtTime(0.045, t + 0.005);
        g2.gain.linearRampToValueAtTime(0, t + 0.07);
        ch(osc, g2);
        osc.start(t + 0.005);
        osc.stop(t + 0.08);
      },

      /* ── click ─────────────────────────────────────────────
         Painel tático: impacto metálico seco + sub-thud.
         Peso físico de interface de mech.                     */
      click(c, ch, ns, ds) {
        const t = c.currentTime;

        // Sub-thud (massa física)
        const sub = c.createOscillator();
        const gs = c.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(90, t);
        sub.frequency.exponentialRampToValueAtTime(30, t + 0.055);
        gs.gain.setValueAtTime(0.32, t);
        gs.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        ch(sub, gs);
        sub.start(t);
        sub.stop(t + 0.065);

        // Impacto metálico (corpo do clique)
        const s1 = c.createBufferSource();
        s1.buffer = ns(c, 0.03, 0.1);
        const bpf = c.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.value = 2800;
        bpf.Q.value = 1.2;
        const g1 = c.createGain();
        g1.gain.setValueAtTime(0.45, t);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        ch(s1, bpf, g1);
        s1.start(t);

        // HF click (definição de borda)
        const s2 = c.createBufferSource();
        s2.buffer = ns(c, 0.008, 0.05);
        const hpf = c.createBiquadFilter();
        hpf.type = 'highpass';
        hpf.frequency.value = 5500;
        const g2 = c.createGain();
        g2.gain.setValueAtTime(0.22, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.008);
        ch(s2, hpf, g2);
        s2.start(t);
      },

      /* ── loading ── alias de click ──────────────────────── */
      loading(c, ch, ns, ds) {
        this.click(c, ch, ns, ds);
      },

      /* ── select ─────────────────────────────────────────────
         Confirmação de seleção de missão: dois beeps limpos
         eletrônicos, precisos, militares.                     */
      select(c, ch, ns, ds) {
        const t = c.currentTime;
        [
          [880, 0],
          [1320, 0.08],
        ].forEach(([freq, delay]) => {
          const osc = c.createOscillator();
          const g = c.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          g.gain.setValueAtTime(0.0, t + delay);
          g.gain.linearRampToValueAtTime(0.14, t + delay + 0.004);
          g.gain.setValueAtTime(0.14, t + delay + 0.035);
          g.gain.linearRampToValueAtTime(0.0, t + delay + 0.055);
          ch(osc, g);
          osc.start(t + delay);
          osc.stop(t + delay + 0.065);
        });
      },

      /* ── close ──────────────────────────────────────────────
         Retração de servo: descida mecânica + thud de fechamento.
         Como uma escotilha de cockpit sendo fechada.          */
      close(c, ch, ns, ds) {
        const t = c.currentTime;

        // Descida de servo (sawtooth filtrado)
        const osc = c.createOscillator();
        const lpf = c.createBiquadFilter();
        const g1 = c.createGain();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(1800, t);
        lpf.frequency.exponentialRampToValueAtTime(200, t + 0.18);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.18);
        g1.gain.setValueAtTime(0.12, t);
        g1.gain.linearRampToValueAtTime(0, t + 0.2);
        ch(osc, lpf, g1);
        osc.start(t);
        osc.stop(t + 0.22);

        // Thud de impacto mecânico no fim
        const sub = c.createOscillator();
        const gs = c.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(65, t + 0.14);
        sub.frequency.exponentialRampToValueAtTime(28, t + 0.22);
        gs.gain.setValueAtTime(0.28, t + 0.14);
        gs.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
        ch(sub, gs);
        sub.start(t + 0.14);
        sub.stop(t + 0.26);

        // Noise de impacto
        const sn = c.createBufferSource();
        sn.buffer = ns(c, 0.04, 0.12);
        const bpf = c.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.value = 600;
        bpf.Q.value = 0.8;
        const gn = c.createGain();
        gn.gain.setValueAtTime(0.2, t + 0.15);
        gn.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        ch(sn, bpf, gn);
        sn.start(t + 0.15);
      },

      /* ── toggle ─────────────────────────────────────────────
         Acionamento de sistema: alavanca pesada + servo motor.
         Painéis de skills, details, educação, rank legend.    */
      toggle(c, ch, ns, ds) {
        const t = c.currentTime;

        // Alavanca / switch throw (noise + distorção)
        const s1 = c.createBufferSource();
        s1.buffer = ns(c, 0.018, 0.1);
        const d1 = ds(c, 120);
        const bpf = c.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.value = 1600;
        bpf.Q.value = 1.5;
        const g1 = c.createGain();
        g1.gain.setValueAtTime(0.3, t);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.018);
        ch(s1, d1, bpf, g1);
        s1.start(t);

        // Servo motor (pitch descendente rápido)
        const osc = c.createOscillator();
        const lpf = c.createBiquadFilter();
        const g2 = c.createGain();
        lpf.type = 'lowpass';
        lpf.frequency.value = 800;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, t + 0.018);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.07);
        g2.gain.setValueAtTime(0.08, t + 0.018);
        g2.gain.linearRampToValueAtTime(0, t + 0.08);
        ch(osc, lpf, g2);
        osc.start(t + 0.018);
        osc.stop(t + 0.085);

        // Echo tick seco
        const s2 = c.createBufferSource();
        s2.buffer = ns(c, 0.01, 0.06);
        const hpf = c.createBiquadFilter();
        hpf.type = 'highpass';
        hpf.frequency.value = 3500;
        const g3 = c.createGain();
        g3.gain.setValueAtTime(0.12, t + 0.055);
        g3.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
        ch(s2, hpf, g3);
        s2.start(t + 0.055);
      },

      /* ── nav ────────────────────────────────────────────────
         Propulsão de boost lateral: rajada de thruster
         + aceleração sônica. Prev/next projetos.             */
      nav(c, ch, ns, ds) {
        const t = c.currentTime;

        // Rajada de thruster (ruído bass filtrado)
        const sn = c.createBufferSource();
        sn.buffer = ns(c, 0.14, 0.35);
        const lpf = c.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(300, t);
        lpf.frequency.exponentialRampToValueAtTime(80, t + 0.14);
        const gn = c.createGain();
        gn.gain.setValueAtTime(0.22, t);
        gn.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        ch(sn, lpf, gn);
        sn.start(t);

        // Whoosh sônico (sawtooth + bandpass)
        const osc = c.createOscillator();
        const bpf = c.createBiquadFilter();
        const g1 = c.createGain();
        bpf.type = 'bandpass';
        bpf.frequency.value = 700;
        bpf.Q.value = 2;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.13);
        g1.gain.setValueAtTime(0.14, t);
        g1.gain.linearRampToValueAtTime(0, t + 0.15);
        ch(osc, bpf, g1);
        osc.start(t);
        osc.stop(t + 0.16);

        // HF tail (esteira de ar)
        const osc2 = c.createOscillator();
        const g2 = c.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2200, t + 0.06);
        osc2.frequency.exponentialRampToValueAtTime(600, t + 0.2);
        g2.gain.setValueAtTime(0.05, t + 0.06);
        g2.gain.linearRampToValueAtTime(0, t + 0.22);
        ch(osc2, g2);
        osc2.start(t + 0.06);
        osc2.stop(t + 0.24);
      },

      /* ── decrypt ────────────────────────────────────────────
         Invasão de sistema: interferência em 3 ondas
         + estática de transmissão + acesso autorizado.        */
      decrypt(c, ch, ns, ds) {
        const t = c.currentTime;

        // Onda 1: interferência digital baixa
        const o1 = c.createOscillator();
        const d1 = ds(c, 250);
        const g1 = c.createGain();
        o1.type = 'square';
        o1.frequency.setValueAtTime(110, t);
        o1.frequency.linearRampToValueAtTime(440, t + 0.09);
        g1.gain.setValueAtTime(0.12, t);
        g1.gain.linearRampToValueAtTime(0, t + 0.1);
        ch(o1, d1, g1);
        o1.start(t);
        o1.stop(t + 0.11);

        // Onda 2: glitch médio
        const o2 = c.createOscillator();
        const d2 = ds(c, 180);
        const g2 = c.createGain();
        o2.type = 'sawtooth';
        o2.frequency.setValueAtTime(280, t + 0.1);
        o2.frequency.linearRampToValueAtTime(900, t + 0.19);
        g2.gain.setValueAtTime(0.1, t + 0.1);
        g2.gain.linearRampToValueAtTime(0, t + 0.2);
        ch(o2, d2, g2);
        o2.start(t + 0.1);
        o2.stop(t + 0.21);

        // Onda 3: alta frequência (data corruption)
        const o3 = c.createOscillator();
        const bpf = c.createBiquadFilter();
        const g3 = c.createGain();
        bpf.type = 'bandpass';
        bpf.frequency.value = 3200;
        bpf.Q.value = 3;
        o3.type = 'square';
        o3.frequency.setValueAtTime(1600, t + 0.2);
        o3.frequency.linearRampToValueAtTime(400, t + 0.28);
        g3.gain.setValueAtTime(0.09, t + 0.2);
        g3.gain.linearRampToValueAtTime(0, t + 0.3);
        ch(o3, bpf, g3);
        o3.start(t + 0.2);
        o3.stop(t + 0.32);

        // Estática de transmissão
        const sn = c.createBufferSource();
        sn.buffer = ns(c, 0.28, 0.5);
        const bpf2 = c.createBiquadFilter();
        bpf2.type = 'bandpass';
        bpf2.frequency.value = 2000;
        bpf2.Q.value = 1.5;
        const gn = c.createGain();
        gn.gain.setValueAtTime(0.16, t);
        gn.gain.setValueAtTime(0.16, t + 0.22);
        gn.gain.linearRampToValueAtTime(0, t + 0.28);
        ch(sn, bpf2, gn);
        sn.start(t);

        // Sub-impacto de breach
        const sub = c.createOscillator();
        const gs = c.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(55, t + 0.28);
        sub.frequency.exponentialRampToValueAtTime(22, t + 0.42);
        gs.gain.setValueAtTime(0.28, t + 0.28);
        gs.gain.exponentialRampToValueAtTime(0.001, t + 0.44);
        ch(sub, gs);
        sub.start(t + 0.28);
        sub.stop(t + 0.46);

        // Confirmação de acesso (tom limpo ascendente)
        const osc = c.createOscillator();
        const gc = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, t + 0.38);
        osc.frequency.linearRampToValueAtTime(1320, t + 0.52);
        gc.gain.setValueAtTime(0.0, t + 0.38);
        gc.gain.linearRampToValueAtTime(0.13, t + 0.42);
        gc.gain.setValueAtTime(0.13, t + 0.5);
        gc.gain.linearRampToValueAtTime(0.0, t + 0.55);
        ch(osc, gc);
        osc.start(t + 0.38);
        osc.stop(t + 0.57);
      },

      /* ── unlock ─────────────────────────────────────────────
         Acesso autorizado: sequência militar ascendente,
         limpa e decisiva. Após decrypt completar.            */
      unlock(c, ch, ns, ds) {
        const t = c.currentTime;

        // Arpejo de autorização (AC6-style: 4 notas + acorde)
        [
          [440, 0],
          [554, 0.075],
          [659, 0.15],
          [880, 0.225],
        ].forEach(([freq, delay]) => {
          const osc = c.createOscillator();
          const g = c.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          g.gain.setValueAtTime(0.0, t + delay);
          g.gain.linearRampToValueAtTime(0.12, t + delay + 0.006);
          g.gain.setValueAtTime(0.12, t + delay + 0.055);
          g.gain.linearRampToValueAtTime(0.0, t + delay + 0.09);
          ch(osc, g);
          osc.start(t + delay);
          osc.stop(t + delay + 0.1);
        });

        // Tick metálico de confirmação final
        const sn = c.createBufferSource();
        sn.buffer = ns(c, 0.015, 0.08);
        const hpf = c.createBiquadFilter();
        hpf.type = 'highpass';
        hpf.frequency.value = 5000;
        const gn = c.createGain();
        gn.gain.setValueAtTime(0.2, t + 0.32);
        gn.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
        ch(sn, hpf, gn);
        sn.start(t + 0.32);
      },

      /* ── download ───────────────────────────────────────────
         Uplink de dados: sequência de beeps de transmissão
         + pulso de confirmação. Download CV.                  */
      download(c, ch, ns, ds) {
        const t = c.currentTime;

        // Sequência de uplink (beeps precisos)
        [
          [440, 0],
          [440, 0.06],
          [660, 0.12],
          [440, 0.18],
          [880, 0.24],
        ].forEach(([freq, delay]) => {
          const osc = c.createOscillator();
          const g = c.createGain();
          osc.type = 'square';
          osc.frequency.value = freq;
          g.gain.setValueAtTime(0.0, t + delay);
          g.gain.linearRampToValueAtTime(0.07, t + delay + 0.003);
          g.gain.setValueAtTime(0.07, t + delay + 0.035);
          g.gain.linearRampToValueAtTime(0.0, t + delay + 0.048);
          ch(osc, g);
          osc.start(t + delay);
          osc.stop(t + delay + 0.055);
        });

        // Ruído de transmissão (carrier wave)
        const sn = c.createBufferSource();
        sn.buffer = ns(c, 0.32, 0.6);
        const bpf = c.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.value = 3500;
        bpf.Q.value = 4;
        const gn = c.createGain();
        gn.gain.setValueAtTime(0.06, t);
        gn.gain.linearRampToValueAtTime(0, t + 0.32);
        ch(sn, bpf, gn);
        sn.start(t);

        // Confirmação final: sub-thud + beep limpo
        const sub = c.createOscillator();
        const gs = c.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(80, t + 0.3);
        sub.frequency.exponentialRampToValueAtTime(35, t + 0.38);
        gs.gain.setValueAtTime(0.22, t + 0.3);
        gs.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        ch(sub, gs);
        sub.start(t + 0.3);
        sub.stop(t + 0.42);
      },

      /* ── lang ───────────────────────────────────────────────
         Reconfiguração de sistema: scramble de dados
         + confirmação de sync. Troca de idioma.              */
      lang(c, ch, ns, ds) {
        const t = c.currentTime;

        // Scramble rápido (glitch de reconfiguraçã)
        for (let i = 0; i < 5; i++) {
          const osc = c.createOscillator();
          const d = ds(c, 90 + i * 30);
          const g = c.createGain();
          osc.type = i % 2 === 0 ? 'square' : 'sawtooth';
          osc.frequency.value = 300 + i * 280 + Math.random() * 200;
          g.gain.setValueAtTime(0.07, t + i * 0.028);
          g.gain.linearRampToValueAtTime(0, t + i * 0.028 + 0.022);
          ch(osc, d, g);
          osc.start(t + i * 0.028);
          osc.stop(t + i * 0.028 + 0.03);
        }

        // Beep de sync confirmado
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'sine';
        osc.frequency.value = 1100;
        g.gain.setValueAtTime(0.0, t + 0.16);
        g.gain.linearRampToValueAtTime(0.1, t + 0.168);
        g.gain.linearRampToValueAtTime(0.0, t + 0.2);
        ch(osc, g);
        osc.start(t + 0.16);
        osc.stop(t + 0.21);
      },

      /* ── theme ──────────────────────────────────────────────
         Ciclo de energia: corte de energia + reinicialização
         + power-up whine crescente. Troca de tema.           */
      theme(c, ch, ns, ds) {
        const t = c.currentTime;

        // Corte de energia (ruído de capacitor descarregando)
        const sn = c.createBufferSource();
        sn.buffer = ns(c, 0.12, 0.2);
        const lpf = c.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(800, t);
        lpf.frequency.exponentialRampToValueAtTime(60, t + 0.12);
        const gn = c.createGain();
        gn.gain.setValueAtTime(0.25, t);
        gn.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        ch(sn, lpf, gn);
        sn.start(t);

        // Silêncio + power-up whine
        const osc = c.createOscillator();
        const lpf2 = c.createBiquadFilter();
        const g1 = c.createGain();
        lpf2.type = 'lowpass';
        lpf2.frequency.setValueAtTime(400, t + 0.15);
        lpf2.frequency.exponentialRampToValueAtTime(3000, t + 0.45);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(55, t + 0.15);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.45);
        g1.gain.setValueAtTime(0.0, t + 0.14);
        g1.gain.linearRampToValueAtTime(0.14, t + 0.22);
        g1.gain.linearRampToValueAtTime(0.0, t + 0.48);
        ch(osc, lpf2, g1);
        osc.start(t + 0.15);
        osc.stop(t + 0.5);

        // Sub-impacto de reboot
        const sub = c.createOscillator();
        const gs = c.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(45, t + 0.15);
        sub.frequency.exponentialRampToValueAtTime(18, t + 0.3);
        gs.gain.setValueAtTime(0.3, t + 0.15);
        gs.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
        ch(sub, gs);
        sub.start(t + 0.15);
        sub.stop(t + 0.34);
      },

      /* ── gamepad ────────────────────────────────────────────
         Aceitar missão: fanfare curto estilo AC6,
         arpejo decisivo + impacto. Botão accept() Tetris.    */
      gamepad(c, ch, ns, ds) {
        const t = c.currentTime;

        // Arpejo de missão aceita (square wave limpo)
        [
          [523, 0],
          [659, 0.07],
          [784, 0.14],
          [1047, 0.21],
        ].forEach(([freq, delay]) => {
          const osc = c.createOscillator();
          const lpf = c.createBiquadFilter();
          const g = c.createGain();
          lpf.type = 'lowpass';
          lpf.frequency.value = 2000 - delay * 1000;
          osc.type = 'square';
          osc.frequency.value = freq;
          g.gain.setValueAtTime(0.0, t + delay);
          g.gain.linearRampToValueAtTime(0.11, t + delay + 0.005);
          g.gain.setValueAtTime(0.11, t + delay + 0.045);
          g.gain.linearRampToValueAtTime(0.0, t + delay + 0.065);
          ch(osc, lpf, g);
          osc.start(t + delay);
          osc.stop(t + delay + 0.075);
        });

        // Impacto de confirmação no fim
        const sub = c.createOscillator();
        const gs = c.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(70, t + 0.3);
        sub.frequency.exponentialRampToValueAtTime(28, t + 0.42);
        gs.gain.setValueAtTime(0.3, t + 0.3);
        gs.gain.exponentialRampToValueAtTime(0.001, t + 0.44);
        ch(sub, gs);
        sub.start(t + 0.3);
        sub.stop(t + 0.46);

        const sn = c.createBufferSource();
        sn.buffer = ns(c, 0.04, 0.15);
        const bpf = c.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.value = 1200;
        bpf.Q.value = 1;
        const gn = c.createGain();
        gn.gain.setValueAtTime(0.25, t + 0.3);
        gn.gain.exponentialRampToValueAtTime(0.001, t + 0.36);
        ch(sn, bpf, gn);
        sn.start(t + 0.3);
      },

      /* ── decline ────────────────────────────────────────────
         Missão abortada: arpejo descendente + estática
         de sistema rejeitado. Botão decline() Tetris.        */
      decline(c, ch, ns, ds) {
        const t = c.currentTime;

        // Descida de frequência (abort sequence)
        [
          [440, 0],
          [330, 0.08],
          [220, 0.16],
          [165, 0.24],
        ].forEach(([freq, delay]) => {
          const osc = c.createOscillator();
          const d = ds(c, 60);
          const g = c.createGain();
          osc.type = 'sawtooth';
          osc.frequency.value = freq;
          g.gain.setValueAtTime(0.0, t + delay);
          g.gain.linearRampToValueAtTime(0.1, t + delay + 0.005);
          g.gain.setValueAtTime(0.1, t + delay + 0.05);
          g.gain.linearRampToValueAtTime(0.0, t + delay + 0.07);
          ch(osc, d, g);
          osc.start(t + delay);
          osc.stop(t + delay + 0.08);
        });

        // Buzz de sistema rejeitado
        const osc = c.createOscillator();
        const lpf = c.createBiquadFilter();
        const g = c.createGain();
        lpf.type = 'lowpass';
        lpf.frequency.value = 400;
        osc.type = 'square';
        osc.frequency.value = 120;
        g.gain.setValueAtTime(0.1, t + 0.32);
        g.gain.linearRampToValueAtTime(0, t + 0.46);
        ch(osc, lpf, g);
        osc.start(t + 0.32);
        osc.stop(t + 0.48);
      },

      /* ── cert ───────────────────────────────────────────────
         Verificação de lacre: impacto + scan + aprovação.
         Botão openCert() nos itens de educação.              */
      cert(c, ch, ns, ds) {
        const t = c.currentTime;

        // Impacto de verificação (stamp)
        const sub = c.createOscillator();
        const gs = c.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(100, t);
        sub.frequency.exponentialRampToValueAtTime(38, t + 0.06);
        gs.gain.setValueAtTime(0.32, t);
        gs.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        ch(sub, gs);
        sub.start(t);
        sub.stop(t + 0.08);

        const sn = c.createBufferSource();
        sn.buffer = ns(c, 0.05, 0.18);
        const bpf = c.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.value = 2500;
        bpf.Q.value = 2;
        const gn = c.createGain();
        gn.gain.setValueAtTime(0.28, t);
        gn.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        ch(sn, bpf, gn);
        sn.start(t);

        // Scan de verificação (sweep sine)
        const osc = c.createOscillator();
        const g1 = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t + 0.08);
        osc.frequency.linearRampToValueAtTime(2400, t + 0.2);
        g1.gain.setValueAtTime(0.0, t + 0.08);
        g1.gain.linearRampToValueAtTime(0.08, t + 0.1);
        g1.gain.linearRampToValueAtTime(0.0, t + 0.22);
        ch(osc, g1);
        osc.start(t + 0.08);
        osc.stop(t + 0.24);

        // Aprovação: dois beeps limpos
        [
          [880, 0.26],
          [1320, 0.33],
        ].forEach(([freq, delay]) => {
          const o = c.createOscillator();
          const g = c.createGain();
          o.type = 'sine';
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.0, t + delay);
          g.gain.linearRampToValueAtTime(0.1, t + delay + 0.005);
          g.gain.setValueAtTime(0.1, t + delay + 0.04);
          g.gain.linearRampToValueAtTime(0.0, t + delay + 0.06);
          ch(o, g);
          o.start(t + delay);
          o.stop(t + delay + 0.07);
        });
      },

      /* ── timeline ───────────────────────────────────────────
         Acesso a arquivo: click mecânico de ratchet
         + tom de arquivo aberto. Cards de experiência.       */
      timeline(c, ch, ns, ds) {
        const t = c.currentTime;

        // Ratchet click (mola mecânica)
        const s1 = c.createBufferSource();
        s1.buffer = ns(c, 0.015, 0.08);
        const d1 = ds(c, 100);
        const bpf = c.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.value = 1400;
        bpf.Q.value = 2;
        const g1 = c.createGain();
        g1.gain.setValueAtTime(0.3, t);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.016);
        ch(s1, d1, bpf, g1);
        s1.start(t);

        // Tom de arquivo (triangle suave)
        const osc = c.createOscillator();
        const g2 = c.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, t + 0.012);
        osc.frequency.linearRampToValueAtTime(360, t + 0.1);
        g2.gain.setValueAtTime(0.0, t + 0.012);
        g2.gain.linearRampToValueAtTime(0.09, t + 0.022);
        g2.gain.linearRampToValueAtTime(0.0, t + 0.11);
        ch(osc, g2);
        osc.start(t + 0.012);
        osc.stop(t + 0.12);
      },

      /* ── search ─────────────────────────────────────────────
         Varredura de radar: ping sônico + eco suave.
         Input de busca no header.                            */
      search(c, ch, ns, ds) {
        const t = c.currentTime;

        // Ping principal (sonar)
        const osc = c.createOscillator();
        const g1 = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2200, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.09);
        g1.gain.setValueAtTime(0.0, t);
        g1.gain.linearRampToValueAtTime(0.1, t + 0.005);
        g1.gain.linearRampToValueAtTime(0.0, t + 0.1);
        ch(osc, g1);
        osc.start(t);
        osc.stop(t + 0.11);

        // Eco atenuado (radar return)
        const osc2 = c.createOscillator();
        const g2 = c.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2200, t + 0.12);
        osc2.frequency.exponentialRampToValueAtTime(800, t + 0.2);
        g2.gain.setValueAtTime(0.0, t + 0.12);
        g2.gain.linearRampToValueAtTime(0.035, t + 0.128);
        g2.gain.linearRampToValueAtTime(0.0, t + 0.21);
        ch(osc2, g2);
        osc2.start(t + 0.12);
        osc2.stop(t + 0.22);
      },
    },

    /* ── link ───────────────────────────────────────────────
       Portal aberto: ping ascendente + burst de dados
       + eco de confirmação. Links externos e sociais.        */
    link(c, ch, ns, ds) {
      const t = c.currentTime;

      // Ping de portal (varredura ascendente)
      const osc = c.createOscillator();
      const g1 = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(1800, t + 0.08);
      g1.gain.setValueAtTime(0.0, t);
      g1.gain.linearRampToValueAtTime(0.11, t + 0.01);
      g1.gain.linearRampToValueAtTime(0.0, t + 0.1);
      ch(osc, g1);
      osc.start(t);
      osc.stop(t + 0.11);

      // Burst de dados
      const sn = c.createBufferSource();
      sn.buffer = ns(c, 0.04, 0.15);
      const bpf = c.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 3000;
      bpf.Q.value = 2;
      const gn = c.createGain();
      gn.gain.setValueAtTime(0.14, t + 0.04);
      gn.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      ch(sn, bpf, gn);
      sn.start(t + 0.04);

      // Eco de confirmação
      const osc2 = c.createOscillator();
      const g2 = c.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = 1200;
      g2.gain.setValueAtTime(0.0, t + 0.1);
      g2.gain.linearRampToValueAtTime(0.055, t + 0.11);
      g2.gain.linearRampToValueAtTime(0.0, t + 0.17);
      ch(osc2, g2);
      osc2.start(t + 0.1);
      osc2.stop(t + 0.18);
    },

    /* ── carousel ───────────────────────────────────────────
       Avanço de filme mecânico: click de precisão +
       sweep direcional rápido. Carrossel de imagens.         */
    carousel(c, ch, ns, ds) {
      const t = c.currentTime;

      // Click de avanço mecânico
      const sn = c.createBufferSource();
      sn.buffer = ns(c, 0.015, 0.08);
      const d1 = ds(c, 80);
      const bpf = c.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 1800;
      bpf.Q.value = 2;
      const g1 = c.createGain();
      g1.gain.setValueAtTime(0.26, t);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.016);
      ch(sn, d1, bpf, g1);
      sn.start(t);

      // Sweep direcional (triangle suave)
      const osc = c.createOscillator();
      const lpf = c.createBiquadFilter();
      const g2 = c.createGain();
      lpf.type = 'lowpass';
      lpf.frequency.value = 900;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, t + 0.01);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.07);
      g2.gain.setValueAtTime(0.07, t + 0.01);
      g2.gain.linearRampToValueAtTime(0.0, t + 0.09);
      ch(osc, lpf, g2);
      osc.start(t + 0.01);
      osc.stop(t + 0.1);
    },

    /* ── expand ─────────────────────────────────────────────
       Expansão de membrana: swell grave + cauda HF.
       Botões expand/collapse de texto em cards e timeline.   */
    expand(c, ch, ns, ds) {
      const t = c.currentTime;

      // Swell de membrana
      const osc = c.createOscillator();
      const g1 = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.linearRampToValueAtTime(290, t + 0.13);
      g1.gain.setValueAtTime(0.0, t);
      g1.gain.linearRampToValueAtTime(0.085, t + 0.03);
      g1.gain.linearRampToValueAtTime(0.0, t + 0.16);
      ch(osc, g1);
      osc.start(t);
      osc.stop(t + 0.17);

      // Cauda HF (dados revelados)
      const osc2 = c.createOscillator();
      const g2 = c.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2800, t + 0.05);
      osc2.frequency.linearRampToValueAtTime(1400, t + 0.14);
      g2.gain.setValueAtTime(0.0, t + 0.05);
      g2.gain.linearRampToValueAtTime(0.038, t + 0.07);
      g2.gain.linearRampToValueAtTime(0.0, t + 0.15);
      ch(osc2, g2);
      osc2.start(t + 0.05);
      osc2.stop(t + 0.16);

      // Noise sussurro
      const sn = c.createBufferSource();
      sn.buffer = ns(c, 0.08, 0.4);
      const hpf = c.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 2000;
      const gn = c.createGain();
      gn.gain.setValueAtTime(0.045, t + 0.02);
      gn.gain.linearRampToValueAtTime(0.0, t + 0.1);
      ch(sn, hpf, gn);
      sn.start(t + 0.02);
    },

    /* ── page ───────────────────────────────────────────────
       Virada de página digital: burst de ruído +
       tick de confirmação. Navegação de páginas do PDF.      */
    page(c, ch, ns, ds) {
      const t = c.currentTime;

      // Burst de virada
      const sn = c.createBufferSource();
      sn.buffer = ns(c, 0.06, 0.2);
      const bpf = c.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 2200;
      bpf.Q.value = 1.5;
      const gn = c.createGain();
      gn.gain.setValueAtTime(0.18, t);
      gn.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      ch(sn, bpf, gn);
      sn.start(t);

      // Tick de confirmação descendente
      const osc = c.createOscillator();
      const g1 = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, t + 0.04);
      osc.frequency.linearRampToValueAtTime(900, t + 0.1);
      g1.gain.setValueAtTime(0.0, t + 0.04);
      g1.gain.linearRampToValueAtTime(0.065, t + 0.05);
      g1.gain.linearRampToValueAtTime(0.0, t + 0.11);
      ch(osc, g1);
      osc.start(t + 0.04);
      osc.stop(t + 0.12);
    },

    /* ── zoom ───────────────────────────────────────────────
       Ajuste óptico: micro-servo click + tom de lente.
       Zoom in/out e botões fit do visualizador de cert.      */
    zoom(c, ch, ns, ds) {
      const t = c.currentTime;

      // Micro-servo click
      const sn = c.createBufferSource();
      sn.buffer = ns(c, 0.008, 0.06);
      const hpf = c.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 4500;
      const g1 = c.createGain();
      g1.gain.setValueAtTime(0.14, t);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.01);
      ch(sn, hpf, g1);
      sn.start(t);

      // Tom de ajuste óptico
      const osc = c.createOscillator();
      const g2 = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1600, t + 0.006);
      osc.frequency.linearRampToValueAtTime(2000, t + 0.04);
      g2.gain.setValueAtTime(0.0, t + 0.006);
      g2.gain.linearRampToValueAtTime(0.055, t + 0.013);
      g2.gain.linearRampToValueAtTime(0.0, t + 0.045);
      ch(osc, g2);
      osc.start(t + 0.006);
      osc.stop(t + 0.05);
    },

    /* ── tetris_move ─────────────────────────────────────────
       Micro-tick de posicionamento: noise HF ultracurto.
       Movimentação ← → de peça.                             */
    tetris_move(c, ch, ns, ds) {
      const t = c.currentTime;
      const sn = c.createBufferSource();
      sn.buffer = ns(c, 0.006, 0.04);
      const hpf = c.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 5500;
      const g = c.createGain();
      g.gain.setValueAtTime(0.1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.007);
      ch(sn, hpf, g);
      sn.start(t);
    },

    /* ── tetris_rotate ───────────────────────────────────────
       Spin mecânico: sine ascendente rápido.
       Rotação de peça (↻ / ↺).                              */
    tetris_rotate(c, ch, ns, ds) {
      const t = c.currentTime;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(1100, t + 0.045);
      g.gain.setValueAtTime(0.0, t);
      g.gain.linearRampToValueAtTime(0.065, t + 0.006);
      g.gain.linearRampToValueAtTime(0.0, t + 0.052);
      ch(osc, g);
      osc.start(t);
      osc.stop(t + 0.06);
    },

    /* ── tetris_lock ─────────────────────────────────────────
       Encaixe de peça: sub-thud + click metálico.
       solidify() — peça fixada no board.                    */
    tetris_lock(c, ch, ns, ds) {
      const t = c.currentTime;
      const sub = c.createOscillator();
      const gs = c.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(110, t);
      sub.frequency.exponentialRampToValueAtTime(42, t + 0.07);
      gs.gain.setValueAtTime(0.28, t);
      gs.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      ch(sub, gs);
      sub.start(t);
      sub.stop(t + 0.09);
      const sn = c.createBufferSource();
      sn.buffer = ns(c, 0.03, 0.12);
      const bpf = c.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 2000;
      bpf.Q.value = 1.5;
      const gn = c.createGain();
      gn.gain.setValueAtTime(0.18, t);
      gn.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      ch(sn, bpf, gn);
      sn.start(t);
    },

    /* ── tetris_drop ─────────────────────────────────────────
       Hard drop: impacto pesado + burst de ruído.
       hardDrop() — queda forçada.                           */
    tetris_drop(c, ch, ns, ds) {
      const t = c.currentTime;
      const sub = c.createOscillator();
      const gs = c.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(200, t);
      sub.frequency.exponentialRampToValueAtTime(35, t + 0.09);
      gs.gain.setValueAtTime(0.38, t);
      gs.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      ch(sub, gs);
      sub.start(t);
      sub.stop(t + 0.11);
      const sn = c.createBufferSource();
      sn.buffer = ns(c, 0.08, 0.2);
      const bpf = c.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 700;
      bpf.Q.value = 1.0;
      const gn = c.createGain();
      gn.gain.setValueAtTime(0.25, t);
      gn.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      ch(sn, bpf, gn);
      sn.start(t);
    },

    /* ── tetris_clear ────────────────────────────────────────
       Limpeza de linha: arpejo ascendente satisfatório.
       clearLines() — 1-3 linhas.                            */
    tetris_clear(c, ch, ns, ds) {
      const t = c.currentTime;
      [
        [349, 0],
        [440, 0.055],
        [523, 0.11],
        [659, 0.165],
      ].forEach(([freq, delay]) => {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.0, t + delay);
        g.gain.linearRampToValueAtTime(0.085, t + delay + 0.006);
        g.gain.setValueAtTime(0.085, t + delay + 0.04);
        g.gain.linearRampToValueAtTime(0.0, t + delay + 0.068);
        ch(osc, g);
        osc.start(t + delay);
        osc.stop(t + delay + 0.08);
      });
      const sn = c.createBufferSource();
      sn.buffer = ns(c, 0.22, 0.45);
      const bpf = c.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 2800;
      bpf.Q.value = 2;
      const gn = c.createGain();
      gn.gain.setValueAtTime(0.09, t);
      gn.gain.linearRampToValueAtTime(0.0, t + 0.22);
      ch(sn, bpf, gn);
      sn.start(t);
    },

    /* ── tetris_4lines ───────────────────────────────────────
       TETRIS: acorde épico + sub-boom.
       clearLines() — 4 linhas simultâneas.                  */
    tetris_4lines(c, ch, ns, ds) {
      const t = c.currentTime;
      [
        [440, 0],
        [554, 0.05],
        [659, 0.1],
        [880, 0.15],
        [1100, 0.22],
      ].forEach(([freq, delay]) => {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.0, t + delay);
        g.gain.linearRampToValueAtTime(0.13, t + delay + 0.007);
        g.gain.setValueAtTime(0.13, t + delay + 0.1);
        g.gain.linearRampToValueAtTime(0.0, t + delay + 0.25);
        ch(osc, g);
        osc.start(t + delay);
        osc.stop(t + delay + 0.27);
      });
      const sub = c.createOscillator();
      const gs = c.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(75, t + 0.18);
      sub.frequency.exponentialRampToValueAtTime(28, t + 0.42);
      gs.gain.setValueAtTime(0.38, t + 0.18);
      gs.gain.exponentialRampToValueAtTime(0.001, t + 0.46);
      ch(sub, gs);
      sub.start(t + 0.18);
      sub.stop(t + 0.48);
      const sn = c.createBufferSource();
      sn.buffer = ns(c, 0.5, 0.38);
      const bpf = c.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 1800;
      bpf.Q.value = 1;
      const gn = c.createGain();
      gn.gain.setValueAtTime(0.14, t);
      gn.gain.linearRampToValueAtTime(0.0, t + 0.5);
      ch(sn, bpf, gn);
      sn.start(t);
    },

    /* ── tetris_levelup ──────────────────────────────────────
       Level up: fanfare ascendente de 5 notas.
       clearLines() — level++.                               */
    tetris_levelup(c, ch, ns, ds) {
      const t = c.currentTime;
      [
        [523, 0],
        [659, 0.065],
        [784, 0.13],
        [1047, 0.195],
        [1319, 0.27],
      ].forEach(([freq, delay]) => {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.0, t + delay);
        g.gain.linearRampToValueAtTime(0.1, t + delay + 0.005);
        g.gain.setValueAtTime(0.1, t + delay + 0.046);
        g.gain.linearRampToValueAtTime(0.0, t + delay + 0.068);
        ch(osc, g);
        osc.start(t + delay);
        osc.stop(t + delay + 0.08);
      });
    },

    // ── Método principal ──────────────────────────────────────
    play(name) {
      if (this.muted) return;
      try {
        const c = this._ctx();
        if (!c) return; // AudioContext ainda suspenso — aguarda primeiro gesto
        const ch = (...nodes) => this._chain(this.__master, ...nodes);
        const ns = this._noise.bind(this);
        const ds = this._distort.bind(this);
        const fn = this._sounds[name] ?? this._sounds.click;
        fn.call(this._sounds, c, ch, ns, ds);
      } catch (_) {
        /* silencia erros de autoplay */
      }
    },

    // ── Mute — preserva localStorage ─────────────────────────
    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('sfx-muted', this.muted);
      if (this.muted) this.stopMusic();
    },

    startMusic() {
      if (this.muted) return;
      window.TetrisMusic?.start();
      this.musicPlaying = true;
    },

    stopMusic() {
      window.TetrisMusic?.stop();
      this.musicPlaying = false;
    },

    toggleMusic() {
      this.musicPlaying ? this.stopMusic() : this.startMusic();
    },

    // ── Compat ───────────────────────────────────────────────
    init() {},
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
      this.interval = setInterval(() => {
        this.next();
      }, 3000);
    },

    pause() {
      if (this.interval) clearInterval(this.interval);
      this.interval = null;
    },

    resume() {
      this.start();
    },
    destroy() {
      this.pause();
    },

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
    },
  }));

  // ==============================
  // SEARCH STORE
  // ==============================
  Alpine.store('search', {
    q: localStorage.getItem('search-q') || '',

    persist() {
      localStorage.setItem('search-q', this.q || '');
    },
    clear() {
      this.q = '';
      localStorage.removeItem('search-q');
    },

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
    },
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
    },
  }));
});

// ==============================
// GLOBAL HELPERS
// ==============================

function getTranslatedLabels() {
  const i18nStore = Alpine.store('i18n');
  const hardLabels = Object.values(window.skillLevels?.hard ?? {})
    .map(s => s?.label)
    .filter(Boolean);
  const softLabels = Object.values(window.skillLevels?.soft ?? {})
    .map(s => s?.label)
    .filter(Boolean);
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
    level: level?.level ?? null,
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
    percent: Math.min(progress, 100).toFixed(0),
  };
}

// ==============================
// HEADER SCROLL (OPTIMIZED)
// ==============================
(() => {
  let lastCompact = null;

  window.addEventListener(
    'scroll',
    () => {
      const header = document.getElementById('main-header');
      const logoContainer = document.getElementById('header-logo-container');
      if (!header || !logoContainer) return;

      const compact = window.scrollY > 50;
      if (compact === lastCompact) return;
      lastCompact = compact;

      if (compact) {
        header.classList.remove('p-4', 'md:p-6', 'h-24', 'md:h-28');
        header.classList.add(
          'p-2',
          'md:p-3',
          'h-16',
          'border-primary/60',
          'backdrop-blur-md',
          'shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
        );
        logoContainer.classList.remove('md:w-16', 'md:h-16');
        logoContainer.classList.add('md:w-10', 'md:h-10');
      } else {
        header.classList.add('p-4', 'md:p-6', 'h-24', 'md:h-28');
        header.classList.remove(
          'p-2',
          'md:p-3',
          'h-16',
          'border-primary/60',
          'backdrop-blur-md',
          'shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
        );
        logoContainer.classList.add('md:w-16', 'md:h-16');
        logoContainer.classList.remove('md:w-10', 'md:h-10');
      }
    },
    { passive: true }
  );
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
      opacity: {
        value: 0.5,
        random: false,
        anim: { enable: false, speed: 1, opacity_min: 0.1, sync: false },
      },
      size: {
        value: 2,
        random: true,
        anim: { enable: false, speed: 20, size_min: 0.1, sync: false },
      },
      line_linked: { enable: true, distance: 150, color: '#d0eef2', opacity: 0.4, width: 1 },
      move: {
        enable: true,
        speed: 2,
        direction: 'none',
        random: false,
        straight: false,
        out_mode: 'out',
        bounce: false,
        attract: { enable: false, rotateX: 600, rotateY: 1200 },
      },
    },
    interactivity: {
      detect_on: 'canvas',
      events: { onhover: { enable: true, mode: 'grab' }, resize: true },
      modes: { grab: { distance: 180, line_linked: { opacity: 0.6 } } },
    },
    retina_detect: true,
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

      this.observer = new IntersectionObserver(
        entries => {
          const entry = entries[0];
          this.isVisible = entry.isIntersecting;
          if (!this.isVisible) this.stopTyping();
          if (this.isVisible && this.expanded && this.typedText.length < this.fullText.length) {
            this.resumeTyping();
          }
        },
        { threshold: 0.15 }
      );

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
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      if (this._onLang) {
        window.removeEventListener('i18n:changed', this._onLang);
        this._onLang = null;
      }
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
        if (!this.isVisible) {
          this.stopTyping();
          return;
        }
        this.typedText += full[i++] ?? '';
        if (i >= full.length) this.stopTyping();
      }, speed);
    },

    stopTyping() {
      if (this.interval) clearInterval(this.interval);
      this.interval = null;
    },
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

    get currentImage() {
      return this.images?.[this.index] ?? '';
    },

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
    },
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
        en: { Junior: 'Junior', Pleno: 'Mid-Level', Senior: 'Senior' },
      };
      return map[this.$store.i18n.lang]?.[this.level.label] ?? this.level.label;
    },

    startDecrypt() {
      // Se já desbloqueado, apenas exibe o fragmento
      if (this.unlocked) {
        this.showFragment = true;
        return;
      }

      // Duração total da animação de decrypt em ms
      // Deve cobrir o som 'decrypt' (~480ms) + silêncio de leitura
      const DECRYPT_DURATION = 1800;

      this.locked = true;
      this.decrypting = true;
      this.progress = 0;

      // ── 1. Som de glitch/decrypt ──────────────────────────
      this.$store.sfx.play('decrypt');

      // ── 2. Progresso guiado por timestamp (sem depender de
      //       audio.duration / audio.ended) ──────────────────
      if (this._raf) cancelAnimationFrame(this._raf);

      const startTime = performance.now();

      const tick = now => {
        const elapsed = now - startTime;
        this.progress = Math.min((elapsed / DECRYPT_DURATION) * 100, 100);

        if (elapsed < DECRYPT_DURATION) {
          this._raf = requestAnimationFrame(tick);
          return;
        }

        // ── 3. Decrypt concluído ──────────────────────────────
        cancelAnimationFrame(this._raf);
        this.progress = 100;
        this.locked = false;
        this.decrypting = false;
        this.unlocked = true;
        this.showFragment = true;
        localStorage.setItem('fragment-unlocked', '1');

        // Tom de acesso liberado logo após fechar o overlay
        this.$store.sfx.play('unlock');
      };

      this._raf = requestAnimationFrame(tick);
    },

    init() {
      this.$store.sfx.init();
      this.unlocked = localStorage.getItem('fragment-unlocked') === '1';

      currentLang = detectLocale();
      updateInterfaceStatic();
      this.recalculateLevel();

      window.addEventListener('i18n:changed', e => {
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
    },
  };
}
