/**
 * certViewerData()
 * Alpine.js data factory — PDF certificate modal viewer.
 * Usage in x-data:  { ...certViewerData(), educationLogs }
 *
 * Requires:
 *   - PDF.js  (window.pdfjsLib)  loaded before Alpine initialises
 *   - A <canvas id="cert-canvas"> inside #cert-modal-box
 *   - An element with id="main-header" (hidden while modal is open)
 */
function certViewerData() {
    return {

        /* ── state ───────────────────────────────────────── */
        certModal: {
            open: false,
            file: null,
            page: 1,
            total: 0,
            loading: false,
            pdf: null,
            fullscreen: false,
        },

        /* ── public API ──────────────────────────────────── */

        openCert(file) {
            this.certModal = {
                open: true,
                file,
                page: 1,
                total: 0,
                loading: true,
                pdf: null,
                fullscreen: false,
            };
            this._setHeader(true);
            this.$nextTick(() => this._loadPdf(file, 1));
        },

        closeCert() {
            if (this.certModal.fullscreen) this._exitFullscreen();
            this.certModal.open = false;
            this.certModal.pdf = null;
            this._setHeader(false);
        },

        toggleFullscreen() {
            const el = document.getElementById('cert-modal-box');
            if (!el) return;

            if (!document.fullscreenElement) {
                el.requestFullscreen()
                    .then(() => {
                        this.certModal.fullscreen = true;
                        this.$nextTick(() =>
                            this._renderPage(this.certModal.pdf, this.certModal.page)
                        );
                    })
                    .catch(() => { });
            } else {
                this._exitFullscreen();
            }
        },

        async prevPage() {
            if (this.certModal.page <= 1) return;
            await this._renderPage(this.certModal.pdf, this.certModal.page - 1);
        },

        async nextPage() {
            if (this.certModal.page >= this.certModal.total) return;
            await this._renderPage(this.certModal.pdf, this.certModal.page + 1);
        },

        /* ── private helpers ─────────────────────────────── */

        _setHeader(hide) {
            const h = document.getElementById('main-header');
            if (!h) return;

            if (hide) {
                h.dataset.certPrevStyle = h.getAttribute('style') || '';
                h.style.display = 'none';
            } else {
                h.style.display = '';
                if (h.dataset.certPrevStyle !== undefined) {
                    h.setAttribute('style', h.dataset.certPrevStyle);
                    delete h.dataset.certPrevStyle;
                }
            }
        },

        _exitFullscreen() {
            if (document.fullscreenElement) document.exitFullscreen();
            this.certModal.fullscreen = false;
        },

        async _loadPdf(file, page) {
            const lib = window.pdfjsLib;
            if (!lib) {
                console.error('[certViewer] PDF.js (pdfjsLib) not found on window.');
                this.certModal.loading = false;
                return;
            }

            lib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

            try {
                const pdf = await lib.getDocument({
                    url: './certs/' + file,
                    cMapPacked: true,
                }).promise;

                this.certModal.pdf = pdf;
                this.certModal.total = pdf.numPages;
                await this._renderPage(pdf, page);
            } catch (err) {
                console.error('[certViewer] Failed to load PDF:', err);
                this.certModal.loading = false;
            }
        },

        async _renderPage(pdf, pageNum) {
            if (!pdf) return;
            this.certModal.loading = true;

            const page = await pdf.getPage(pageNum);
            const canvas = document.getElementById('cert-canvas');
            if (!canvas) return;

            const wrap = canvas.parentElement;
            const scale = Math.min(
                (wrap.clientWidth - 32) / page.getViewport({ scale: 1 }).width,
                2
            );
            const vp = page.getViewport({ scale });

            canvas.width = vp.width;
            canvas.height = vp.height;

            await page.render({
                canvasContext: canvas.getContext('2d'),
                viewport: vp,
            }).promise;

            this.certModal.loading = false;
            this.certModal.page = pageNum;

            // Re-run Lucide so any icons re-rendered by Alpine are picked up
            if (window.lucide) lucide.createIcons();
        },

    };
}