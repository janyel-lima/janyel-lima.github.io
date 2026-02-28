/**
 * certViewerData()
 * Alpine.js data factory — PDF certificate modal viewer.
 * Usage in x-data:  { ...certViewerData(), educationLogs }
 *
 * Requires:
 *   - PDF.js  (window.pdfjsLib)  loaded before Alpine initialises
 *   - A <canvas id="cert-canvas"> inside #cert-canvas-wrap
 *   - An element with id="main-header" (hidden while modal is open)
 *
 * Features:
 *   - Fit-to-width / fit-to-page / custom zoom (25 %–400 %)
 *   - HiDPI / Retina rendering via devicePixelRatio
 *   - Cancel-safe render tasks (no stale paints on fast navigation)
 *   - Adjacent-page preloading for instant prev/next
 *   - ResizeObserver: re-renders on container resize (fullscreen, window resize)
 *   - Keyboard: ← → arrows = prev/next | + - = zoom | 0 = fit-width | F = fullscreen | Esc = close
 *   - Swipe left/right on touch devices
 *
 * FIX: Alpine.js wraps EVERY property of the returned object in a Proxy for
 * reactivity — including properties prefixed with _. PDF.js uses private class
 * fields (#d, #map, etc.) internally, and Proxy breaks access to them, causing:
 *   "TypeError: Cannot read private member #d from an object whose class did not declare it"
 *
 * The only safe solution is to keep the PDFDocumentProxy in a CLOSURE VARIABLE
 * declared before the return {}, so Alpine never sees it and never proxies it.
 */
function certViewerData() {

    // ── Closure variables — completely invisible to Alpine ────────────────────
    // Alpine proxies everything inside return{}. These live in the closure scope
    // and are accessed directly by all methods without going through the Proxy.
    let _pdfDoc      = null;   // PDFDocumentProxy — MUST stay here, not in return{}
    let _renderTask  = null;
    let _resizeObs   = null;
    let _boundKey    = null;
    let _boundFsChg  = null;
    let _touchStartX = null;
    // ─────────────────────────────────────────────────────────────────────────

    return {

        /* ── Reactive state (safe for Alpine Proxy) ──────── */
        certModal: {
            open:       false,
            file:       null,
            page:       1,
            total:      0,
            loading:    false,
            fullscreen: false,
            zoom:       1,        // actual render scale
            zoomPct:    100,      // display value (integer %)
            fitMode:   'width',   // 'width' | 'page' | 'custom'
        },

        /* ══════════════════════════════════════════════════
           PUBLIC API
        ══════════════════════════════════════════════════ */

        openCert(file) {
            _pdfDoc = null;
            this.certModal = {
                open: true, file,
                page: 1, total: 0,
                loading: true,
                fullscreen: false,
                zoom: 1, zoomPct: 100, fitMode: 'width',
            };
            this._setHeader(true);
            this.$nextTick(() => {
                this._attachListeners();
                this._loadPdf(file, 1);
            });
        },

        closeCert() {
            if (this.certModal.fullscreen) this._exitFs();
            this._cancelRender();
            this._detachListeners();
            _pdfDoc = null;
            this.certModal.open = false;
            this._setHeader(false);
        },

        async prevPage() {
            if (this.certModal.page <= 1) return;
            await this._renderPage(_pdfDoc, this.certModal.page - 1);
        },

        async nextPage() {
            if (this.certModal.page >= this.certModal.total) return;
            await this._renderPage(_pdfDoc, this.certModal.page + 1);
        },

        /* ── Zoom ────────────────────────────────────────── */

        zoomIn() {
            const next = Math.min(this.certModal.zoom * 1.25, 4);
            this._applyCustomZoom(next);
        },

        zoomOut() {
            const next = Math.max(this.certModal.zoom * 0.8, 0.25);
            this._applyCustomZoom(next);
        },

        fitWidth() {
            this.certModal.fitMode = 'width';
            this._renderPage(_pdfDoc, this.certModal.page);
        },

        fitPage() {
            this.certModal.fitMode = 'page';
            this._renderPage(_pdfDoc, this.certModal.page);
        },

        _applyCustomZoom(scale) {
            this.certModal.fitMode = 'custom';
            this.certModal.zoom    = scale;
            this.certModal.zoomPct = Math.round(scale * 100);
            this._renderPage(_pdfDoc, this.certModal.page);
        },

        /* ── Fullscreen ──────────────────────────────────── */

        toggleFullscreen() {
            const el = document.getElementById('cert-modal-box');
            if (!el) return;
            if (!document.fullscreenElement) {
                el.requestFullscreen()
                    .then(() => {
                        this.certModal.fullscreen = true;
                        this.$nextTick(() =>
                            this._renderPage(_pdfDoc, this.certModal.page)
                        );
                    })
                    .catch(() => {});
            } else {
                this._exitFs();
            }
        },

        /* ══════════════════════════════════════════════════
           PRIVATE HELPERS
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

        _exitFs() {
            if (document.fullscreenElement) document.exitFullscreen();
            this.certModal.fullscreen = false;
        },

        _cancelRender() {
            if (_renderTask) {
                try { _renderTask.cancel(); } catch (_) {}
                _renderTask = null;
            }
        },

        /* ── Event wiring ────────────────────────────────── */

        _attachListeners() {
            _boundKey = (e) => this._onKey(e);
            window.addEventListener('keydown', _boundKey);

            const wrap = document.getElementById('cert-canvas-wrap');
            if (wrap) {
                wrap.addEventListener('touchstart', (e) => {
                    _touchStartX = e.touches[0].clientX;
                }, { passive: true });
                wrap.addEventListener('touchend', (e) => {
                    if (_touchStartX === null) return;
                    const dx = e.changedTouches[0].clientX - _touchStartX;
                    _touchStartX = null;
                    if (Math.abs(dx) < 40) return;
                    dx < 0 ? this.nextPage() : this.prevPage();
                }, { passive: true });
            }

            if (wrap) {
                _resizeObs = new ResizeObserver(() => {
                    if (_pdfDoc && !this.certModal.loading)
                        this._renderPage(_pdfDoc, this.certModal.page);
                });
                _resizeObs.observe(wrap);
            }

            _boundFsChg = () => {
                if (!document.fullscreenElement) {
                    this.certModal.fullscreen = false;
                    this.$nextTick(() => {
                        this._renderPage(_pdfDoc, this.certModal.page);
                        if (window.lucide) lucide.createIcons();
                    });
                }
            };
            window.addEventListener('fullscreenchange', _boundFsChg);
        },

        _detachListeners() {
            if (_boundKey)   { window.removeEventListener('keydown', _boundKey); _boundKey = null; }
            if (_boundFsChg) { window.removeEventListener('fullscreenchange', _boundFsChg); _boundFsChg = null; }
            if (_resizeObs)  { _resizeObs.disconnect(); _resizeObs = null; }
        },

        _onKey(e) {
            if (!this.certModal.open) return;
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;

            switch (e.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault(); this.nextPage(); break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault(); this.prevPage(); break;
                case '+':
                case '=':
                    e.preventDefault(); this.zoomIn(); break;
                case '-':
                    e.preventDefault(); this.zoomOut(); break;
                case '0':
                    e.preventDefault(); this.fitWidth(); break;
                case 'f':
                case 'F':
                    if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); this.toggleFullscreen(); }
                    break;
            }
        },

        /* ── PDF loading ─────────────────────────────────── */

        async _loadPdf(file, startPage) {
            const lib = window.pdfjsLib;
            if (!lib) {
                console.error('[certViewer] pdfjsLib not found on window.');
                this.certModal.loading = false;
                return;
            }

            lib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

            try {
                const loadTask = lib.getDocument({
                    url: './certs/' + file,
                    cMapPacked: true,
                    disableRange: false,
                    disableStream: false,
                });

                const pdf = await loadTask.promise;

                // Assign to CLOSURE variable — never touches Alpine Proxy
                _pdfDoc = pdf;
                this.certModal.total = pdf.numPages;

                await this._renderPage(_pdfDoc, startPage);
                this._preload(_pdfDoc, startPage + 1);
            } catch (err) {
                console.error('[certViewer] Failed to load PDF:', err);
                this.certModal.loading = false;
            }
        },

        async _preload(pdf, pageNum) {
            if (pageNum < 1 || pageNum > (pdf?.numPages ?? 0)) return;
            try { await pdf.getPage(pageNum); } catch (_) {}
        },

        /* ── Rendering ───────────────────────────────────── */

        async _renderPage(pdf, pageNum) {
            if (!pdf) return;

            this._cancelRender();
            this.certModal.loading = true;

            let page;
            try {
                page = await pdf.getPage(pageNum);
            } catch (err) {
                console.error('[certViewer] getPage error:', err);
                this.certModal.loading = false;
                return;
            }

            const canvas = document.getElementById('cert-canvas');
            const wrap   = document.getElementById('cert-canvas-wrap');
            if (!canvas || !wrap) return;

            const dpr  = Math.min(window.devicePixelRatio || 1, 2);
            const padX = 32;
            const padY = 32;
            const availW = wrap.clientWidth  - padX;
            const availH = wrap.clientHeight - padY;

            const base = page.getViewport({ scale: 1 });

            let scale;
            const mode = this.certModal.fitMode;
            if (mode === 'width') {
                scale = availW / base.width;
            } else if (mode === 'page') {
                scale = Math.min(availW / base.width, availH / base.height);
            } else {
                scale = this.certModal.zoom;
            }
            scale = Math.max(0.25, Math.min(scale, 4));

            this.certModal.zoom    = scale;
            this.certModal.zoomPct = Math.round(scale * 100);

            const cssW = Math.round(base.width  * scale);
            const cssH = Math.round(base.height * scale);

            const vp = page.getViewport({ scale: scale * dpr });
            canvas.width  = vp.width;
            canvas.height = vp.height;
            canvas.style.width  = cssW + 'px';
            canvas.style.height = cssH + 'px';

            const task = page.render({
                canvasContext: canvas.getContext('2d'),
                viewport: vp,
            });
            _renderTask = task;

            try {
                await task.promise;

                this.certModal.loading = false;
                this.certModal.page    = pageNum;

                this._preload(pdf, pageNum + 1);
                this._preload(pdf, pageNum - 1);
            } catch (err) {
                if (err?.name !== 'RenderingCancelledException') {
                    console.error('[certViewer] Render error:', err);
                    this.certModal.loading = false;
                }
            }
            _renderTask = null;

            if (window.lucide) lucide.createIcons();
        },
    };
}