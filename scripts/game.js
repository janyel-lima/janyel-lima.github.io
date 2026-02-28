/**
 * tetrisChallengeData()
 * Alpine.js data factory — Tetris challenge floating button + modal.
 * Usage in x-data:  x-data="tetrisChallengeData()"
 *
 * Requires:
 *   - An element with id="main-header" (hidden on mobile while game is open)
 *   - An element with id="tetris-mount"  (game HTML is injected here)
 *   - The game file at ./games/tetris.html
 */
function tetrisChallengeData() {
    return {

        /* ── State ───────────────────────────────────────── */
        visible:    false,
        accepted:   false,
        gameLoaded: false,
        declined:   false,

        /* ══════════════════════════════════════════════════
           METHODS — estrutura idêntica ao inline original
        ══════════════════════════════════════════════════ */

        _setHeader(hide) {
            const h = document.getElementById('main-header');
            if (!h) return;
            if (hide) {
                h.dataset.certPrev = h.getAttribute('style') || '';
                h.style.display = 'none';
            } else {
                h.style.display = '';
                if (h.dataset.certPrev !== undefined) {
                    h.setAttribute('style', h.dataset.certPrev);
                    delete h.dataset.certPrev;
                }
            }
        },

        accept() {
            this.accepted   = true;
            this.gameLoaded = false;
            this.$store.sfx.play('click');
            this._setHeader(true);

            fetch('./games/tetris.html')
                .then(r => r.text())
                .then(html => {
                    const container = document.getElementById('tetris-mount');
                    if (!container) return;
                    container.innerHTML = html;
                    container.querySelectorAll('script').forEach(old => {
                        const s = document.createElement('script');
                        if (old.src) s.src = old.src;
                        else s.textContent = old.textContent;
                        document.body.appendChild(s);
                    });
                    this.gameLoaded = true;
                    if (window.lucide) lucide.createIcons();
                })
                .catch(() => { this.gameLoaded = true; });
        },

        decline() {
            this.declined = true;
            this.accepted = false;
            this.$store.sfx.play('close');
        },

        close() {
            this.accepted   = false;
            this.gameLoaded = false;
            this._setHeader(false);
            this.$store.sfx.play('close');
        },
    };
}