/**
 * Controlador del componente de accesibilidad universal de FoodJet.
 *
 * Implementación propia (first-party), gratuita y sin dependencias externas:
 * restaura el botón flotante azul de accesibilidad con soporte verificable para
 * atajo Alt + A, navegación por teclado, alto contraste (claro/oscuro), filtros
 * de daltonismo (protanopia, deuteranopia y tritanopia), ampliación tipográfica
 * hasta 200 %, tipografía OpenDyslexic autoalojada, lectura asistida por voz
 * (Web Speech API), reducción de animaciones/distracciones y persistencia local.
 */

import {
    COLOR_FILTERS,
    FONT_SCALE_MAX,
    FONT_SCALE_MIN,
    SPEECH_RATES,
    clearPreferences,
    countActiveAdjustments,
    createDefaultPreferences,
    extractReadableText,
    isOpenShortcut,
    loadPreferences,
    sanitizePreferences,
    savePreferences,
    stepFontScale
} from './domain/accessibility.js';

const COLOR_FILTER_LABELS = Object.freeze({
    none: 'Normal',
    protanopia: 'Protanopia',
    deuteranopia: 'Deuteranopia',
    tritanopia: 'Tritanopia'
});

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
].join(', ');

const READABLE_ELEMENT_SELECTOR =
    'h1, h2, h3, h4, h5, h6, p, li, a, button, label, input, select, textarea, [role="button"], .alert, .card-title, .card-text';

const VOICE_DEDUP_WINDOW_MS = 400;

/**
 * Divide texto largo en fragmentos manejables para evitar cortes en motores
 * SpeechSynthesis de navegadores basados en Chromium.
 */
export function splitTextForSpeech(text, maxChunkLength = 220) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return [];
    if (clean.length <= maxChunkLength) return [clean];

    const sentences = clean.split(/(?<=[.!?…:;])\s+/);
    const chunks = [];
    let current = '';

    for (const sentence of sentences) {
        if (sentence.length > maxChunkLength) {
            if (current) {
                chunks.push(current.trim());
                current = '';
            }
            const words = sentence.split(' ');
            let part = '';
            for (const word of words) {
                if ((part + ' ' + word).trim().length > maxChunkLength && part) {
                    chunks.push(part.trim());
                    part = word;
                } else {
                    part = (part + ' ' + word).trim();
                }
            }
            if (part) chunks.push(part.trim());
        } else if ((current + ' ' + sentence).trim().length > maxChunkLength && current) {
            chunks.push(current.trim());
            current = sentence;
        } else {
            current = (current + ' ' + sentence).trim();
        }
    }

    if (current) chunks.push(current.trim());
    return chunks;
}

/**
 * Aplica el estado de preferencias de accesibilidad directamente sobre el
 * documento (`<html>`), de forma idempotente y segura.
 */
export function applyPreferencesToDocument(rawPrefs, doc = globalThis.document, win = globalThis.window) {
    const prefs = sanitizePreferences(rawPrefs);
    const root = doc?.documentElement;
    if (!root) return prefs;

    if (prefs.highContrast) {
        root.setAttribute('data-a11y-contrast', 'high');
    } else {
        root.removeAttribute('data-a11y-contrast');
    }

    if (prefs.colorFilter && prefs.colorFilter !== 'none' && COLOR_FILTERS.includes(prefs.colorFilter)) {
        root.setAttribute('data-a11y-color-filter', prefs.colorFilter);
    } else {
        root.removeAttribute('data-a11y-color-filter');
    }

    if (prefs.fontScale > FONT_SCALE_MIN) {
        root.setAttribute('data-a11y-font-scale', String(prefs.fontScale));
        if (root.style && typeof root.style.setProperty === 'function') {
            root.style.setProperty('--a11y-font-scale', String(prefs.fontScale / 100));
        }
    } else {
        root.removeAttribute('data-a11y-font-scale');
        if (root.style && typeof root.style.removeProperty === 'function') {
            root.style.removeProperty('--a11y-font-scale');
        }
    }

    if (prefs.dyslexiaFont) {
        root.setAttribute('data-a11y-dyslexia', 'true');
    } else {
        root.removeAttribute('data-a11y-dyslexia');
    }

    if (prefs.reducedMotion) {
        root.setAttribute('data-a11y-reduced-motion', 'true');
    } else {
        root.removeAttribute('data-a11y-reduced-motion');
    }

    if (prefs.keyboardFocus) {
        root.setAttribute('data-a11y-keyboard-nav', 'true');
    } else {
        root.removeAttribute('data-a11y-keyboard-nav');
    }

    if (prefs.voiceReader) {
        root.setAttribute('data-a11y-voice-reader', 'true');
    } else {
        root.removeAttribute('data-a11y-voice-reader');
    }

    syncHeroCarouselMotion(prefs.reducedMotion, doc, win);
    return prefs;
}

function syncHeroCarouselMotion(reducedMotion, doc, win) {
    try {
        const carouselEl = doc?.getElementById?.('heroCarousel');
        if (!carouselEl) return;

        const osPrefersReduced = Boolean(
            win?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
        );
        const shouldPause = Boolean(reducedMotion || osPrefersReduced);

        const Carousel = win?.bootstrap?.Carousel;
        if (!Carousel) return;

        const instance =
            typeof Carousel.getInstance === 'function'
                ? Carousel.getInstance(carouselEl) ||
                  (shouldPause && typeof Carousel.getOrCreateInstance === 'function'
                      ? Carousel.getOrCreateInstance(carouselEl)
                      : null)
                : null;

        if (!instance) return;
        if (shouldPause && typeof instance.pause === 'function') {
            instance.pause();
        } else if (!shouldPause && typeof instance.cycle === 'function') {
            instance.cycle();
        }
    } catch {
        // Nunca bloquear la app si Bootstrap aún no está disponible
    }
}

/**
 * Crea una instancia del controlador del widget de accesibilidad.
 * Acepta dependencias inyectables (`doc`, `win`, `storage`) para pruebas unitarias.
 */
export function createAccessibilityController({
    doc = globalThis.document,
    win = globalThis.window,
    storage
} = {}) {
    if (!doc) return null;

    const widgetContainer = doc.getElementById('a11yWidgetContainer');
    const toggleBtn = doc.getElementById('a11yToggleBtn');
    const panel = doc.getElementById('a11yPanel');
    const backdrop = doc.getElementById('a11yBackdrop');
    const closeBtn = doc.getElementById('a11yCloseBtn');
    const panelTitle = doc.getElementById('a11yPanelTitle');
    const activeBadge = doc.getElementById('a11yActiveBadge');
    const liveRegion = doc.getElementById('a11yLiveRegion');

    const fontDecBtn = doc.getElementById('a11yFontDecBtn');
    const fontIncBtn = doc.getElementById('a11yFontIncBtn');
    const fontValue = doc.getElementById('a11yFontValue');
    const fontMeter = doc.getElementById('a11yFontMeter');

    const contrastBtn = doc.getElementById('a11yContrastBtn');
    const dyslexiaBtn = doc.getElementById('a11yDyslexiaBtn');
    const motionBtn = doc.getElementById('a11yMotionBtn');
    const keyboardBtn = doc.getElementById('a11yKeyboardBtn');
    const voiceBtn = doc.getElementById('a11yVoiceBtn');
    const resetBtn = doc.getElementById('a11yResetBtn');

    const colorFilterButtons = Array.from(
        doc.querySelectorAll?.('[data-a11y-filter-option]') || []
    );

    const voiceControls = doc.getElementById('a11yVoiceControls');
    const voiceReadPageBtn = doc.getElementById('a11yVoiceReadPageBtn');
    const voicePauseBtn = doc.getElementById('a11yVoicePauseBtn');
    const voiceStopBtn = doc.getElementById('a11yVoiceStopBtn');
    const voiceRateSelect = doc.getElementById('a11yVoiceRateSelect');
    const voiceStatus = doc.getElementById('a11yVoiceStatus');

    if (!widgetContainer || !toggleBtn || !panel) {
        return null;
    }

    let prefs = loadPreferences(storage);
    let isOpen = false;
    let previouslyFocused = null;
    let activeHighlightEl = null;
    let isSpeaking = false;
    let isPaused = false;
    let speechQueueId = 0;
    let lastSpokenElement = null;
    let lastSpokenAt = 0;

    function announce(message) {
        if (!liveRegion || !message) return;
        liveRegion.textContent = '';
        if (typeof win?.setTimeout === 'function') {
            win.setTimeout(() => {
                liveRegion.textContent = message;
            }, 30);
        } else {
            liveRegion.textContent = message;
        }
    }

    function hasSpeechSupport() {
        return Boolean(
            win &&
            win.speechSynthesis &&
            typeof win.speechSynthesis.speak === 'function' &&
            typeof win.SpeechSynthesisUtterance === 'function'
        );
    }

    function pickSpanishVoice() {
        try {
            const voices = win?.speechSynthesis?.getVoices?.() || [];
            return (
                voices.find((v) => /^es[-_]PE/i.test(v.lang)) ||
                voices.find((v) => /^es[-_](419|ES|MX|CO|AR)/i.test(v.lang)) ||
                voices.find((v) => /^es/i.test(v.lang)) ||
                null
            );
        } catch {
            return null;
        }
    }

    function clearReadingHighlight() {
        if (activeHighlightEl?.classList) {
            activeHighlightEl.classList.remove('a11y-reading-highlight');
        }
        activeHighlightEl = null;
    }

    function updateVoiceUI(statusText) {
        const supported = hasSpeechSupport();

        if (voiceControls) {
            voiceControls.hidden = !prefs.voiceReader;
        }
        if (voiceReadPageBtn) {
            voiceReadPageBtn.disabled = !supported;
        }
        if (voicePauseBtn) {
            voicePauseBtn.disabled = !supported || !isSpeaking;
            voicePauseBtn.textContent = isPaused ? 'Reanudar' : 'Pausar';
        }
        if (voiceStopBtn) {
            voiceStopBtn.disabled = !supported || !isSpeaking;
        }
        if (voiceRateSelect) {
            voiceRateSelect.disabled = !supported;
            voiceRateSelect.value = String(prefs.speechRate);
        }
        if (voiceStatus) {
            if (!supported) {
                voiceStatus.textContent = 'Tu navegador no soporta síntesis de voz (Web Speech API).';
            } else if (statusText) {
                voiceStatus.textContent = statusText;
            } else if (prefs.voiceReader) {
                voiceStatus.textContent =
                    'Activo: haz clic o navega con teclado sobre un texto para escucharlo, o pulsa "Leer vista".';
            } else {
                voiceStatus.textContent = '';
            }
        }
    }

    function stopSpeech({ silent = false } = {}) {
        speechQueueId += 1;
        isSpeaking = false;
        isPaused = false;
        clearReadingHighlight();

        if (hasSpeechSupport()) {
            try {
                win.speechSynthesis.cancel();
            } catch {
                // Ignorar errores del motor de voz
            }
        }

        if (!silent) {
            updateVoiceUI('Lectura detenida.');
        } else {
            updateVoiceUI();
        }
    }

    function speakText(text, targetElement = null) {
        if (!hasSpeechSupport()) {
            updateVoiceUI('Tu navegador no soporta síntesis de voz (Web Speech API).');
            announce('Tu navegador no soporta síntesis de voz.');
            return false;
        }

        const chunks = splitTextForSpeech(text);
        if (chunks.length === 0) {
            updateVoiceUI('No hay texto disponible para leer en esta selección.');
            return false;
        }

        stopSpeech({ silent: true });
        const currentRunId = speechQueueId;
        const voice = pickSpanishVoice();

        if (targetElement?.classList) {
            activeHighlightEl = targetElement;
            activeHighlightEl.classList.add('a11y-reading-highlight');
        }

        isSpeaking = true;
        isPaused = false;
        updateVoiceUI('Leyendo en voz alta…');

        const speakChunkAt = (index) => {
            if (currentRunId !== speechQueueId) return;
            if (index >= chunks.length) {
                isSpeaking = false;
                isPaused = false;
                clearReadingHighlight();
                updateVoiceUI('Lectura finalizada.');
                return;
            }

            const utterance = new win.SpeechSynthesisUtterance(chunks[index]);
            utterance.lang = voice?.lang || 'es-PE';
            utterance.rate = prefs.speechRate;
            if (voice) utterance.voice = voice;

            utterance.onend = () => {
                if (currentRunId === speechQueueId) {
                    speakChunkAt(index + 1);
                }
            };
            utterance.onerror = () => {
                if (currentRunId === speechQueueId) {
                    isSpeaking = false;
                    isPaused = false;
                    clearReadingHighlight();
                    updateVoiceUI('No se pudo completar la lectura en voz alta.');
                }
            };

            try {
                win.speechSynthesis.speak(utterance);
            } catch {
                isSpeaking = false;
                isPaused = false;
                clearReadingHighlight();
                updateVoiceUI('No se pudo iniciar la síntesis de voz.');
            }
        };

        speakChunkAt(0);
        return true;
    }

    function togglePauseSpeech() {
        if (!hasSpeechSupport() || !isSpeaking) return;
        try {
            if (isPaused) {
                win.speechSynthesis.resume?.();
                isPaused = false;
                updateVoiceUI('Lectura reanudada.');
            } else {
                win.speechSynthesis.pause?.();
                isPaused = true;
                updateVoiceUI('Lectura en pausa.');
            }
        } catch {
            // Algunos motores no soportan pause/resume; detener limpiamente
            stopSpeech();
        }
    }

    function getActiveReadingTarget() {
        const activeOverlay = doc.querySelector?.('.modal.show, .offcanvas.show');
        if (activeOverlay) {
            const overlayText = extractReadableText(activeOverlay);
            if (overlayText) return { text: overlayText, target: activeOverlay };
        }

        const main = doc.getElementById('main-content');
        if (!main) return { text: extractReadableText(doc.body), target: doc.body };

        const viewIds = [
            'homeView',
            'orderHistoryView',
            'checkoutView',
            'dashboardView',
            'trackingView'
        ];
        for (const id of viewIds) {
            const view = doc.getElementById(id);
            if (
                view &&
                view.style?.display !== 'none' &&
                !view.hidden &&
                !view.classList?.contains?.('d-none')
            ) {
                const text = extractReadableText(view);
                if (text) return { text, target: view };
            }
        }
        return { text: extractReadableText(main), target: main };
    }

    function syncUI() {
        if (fontValue) fontValue.textContent = `${prefs.fontScale}%`;
        if (fontDecBtn) fontDecBtn.disabled = prefs.fontScale <= FONT_SCALE_MIN;
        if (fontIncBtn) fontIncBtn.disabled = prefs.fontScale >= FONT_SCALE_MAX;
        if (fontMeter?.style) {
            const pct = ((prefs.fontScale - FONT_SCALE_MIN) / (FONT_SCALE_MAX - FONT_SCALE_MIN)) * 100;
            fontMeter.style.width = `${Math.max(0, Math.min(100, pct))}%`;
        }

        setToggleState(contrastBtn, prefs.highContrast);
        setToggleState(dyslexiaBtn, prefs.dyslexiaFont);
        setToggleState(motionBtn, prefs.reducedMotion);
        setToggleState(keyboardBtn, prefs.keyboardFocus);
        setToggleState(voiceBtn, prefs.voiceReader);

        for (const btn of colorFilterButtons) {
            const option = btn.getAttribute('data-a11y-filter-option');
            const selected = option === prefs.colorFilter;
            btn.setAttribute('aria-pressed', String(selected));
            btn.classList?.toggle('is-active', selected);
        }

        const activeCount = countActiveAdjustments(prefs);
        if (activeBadge) {
            activeBadge.textContent = String(activeCount);
            activeBadge.hidden = activeCount === 0;
        }
        toggleBtn.setAttribute(
            'aria-label',
            activeCount > 0
                ? `Opciones de accesibilidad (${activeCount} activas, atajo Alt + A)`
                : 'Opciones de accesibilidad (atajo Alt + A)'
        );

        updateVoiceUI();
    }

    function setToggleState(btn, active) {
        if (!btn) return;
        btn.setAttribute('aria-pressed', String(Boolean(active)));
        btn.classList?.toggle('is-active', Boolean(active));
    }

    function commitPreferences(nextPrefs, announcement) {
        prefs = applyPreferencesToDocument(nextPrefs, doc, win);
        savePreferences(prefs, storage);
        syncUI();
        if (announcement) announce(announcement);
    }

    function getFocusableElements() {
        if (typeof panel.querySelectorAll !== 'function') return [];
        return Array.from(panel.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => {
            if (el.hidden) return false;
            if (el.closest?.('[hidden]')) return false;
            return true;
        });
    }

    function openPanel() {
        if (isOpen) return;
        previouslyFocused = doc.activeElement || toggleBtn;
        isOpen = true;
        panel.hidden = false;
        panel.classList?.add('is-open');
        if (backdrop) {
            backdrop.hidden = false;
            backdrop.classList?.add('is-open');
        }
        toggleBtn.setAttribute('aria-expanded', 'true');

        if (panelTitle && typeof panelTitle.focus === 'function') {
            panelTitle.focus();
        } else if (closeBtn && typeof closeBtn.focus === 'function') {
            closeBtn.focus();
        }
        announce('Panel de accesibilidad abierto. Usa Tab para navegar y Escape para cerrar.');
    }

    function closePanel({ restoreFocus = true } = {}) {
        if (!isOpen) return;
        isOpen = false;
        panel.hidden = true;
        panel.classList?.remove('is-open');
        if (backdrop) {
            backdrop.hidden = true;
            backdrop.classList?.remove('is-open');
        }
        toggleBtn.setAttribute('aria-expanded', 'false');

        if (restoreFocus) {
            const target =
                previouslyFocused &&
                previouslyFocused !== doc.body &&
                previouslyFocused.isConnected !== false &&
                typeof previouslyFocused.focus === 'function'
                    ? previouslyFocused
                    : toggleBtn;
            if (typeof target?.focus === 'function') {
                target.focus();
            }
        }
        announce('Panel de accesibilidad cerrado.');
    }

    function togglePanel() {
        if (isOpen) {
            closePanel();
        } else {
            openPanel();
        }
    }

    function handleGlobalKeydown(event) {
        if (isOpenShortcut(event)) {
            event.preventDefault?.();
            event.stopPropagation?.();
            event.stopImmediatePropagation?.();
            togglePanel();
            return;
        }

        if (event.key === 'Escape' && isOpen) {
            event.preventDefault?.();
            event.stopPropagation?.();
            event.stopImmediatePropagation?.();
            closePanel({ restoreFocus: true });
            return;
        }

        if (event.key === 'Tab' && isOpen) {
            const focusables = getFocusableElements();
            if (focusables.length === 0) return;

            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = doc.activeElement;
            const insidePanel = Boolean(panel.contains?.(active));

            if (event.shiftKey) {
                if (active === first || active === panelTitle || !insidePanel) {
                    event.preventDefault?.();
                    event.stopPropagation?.();
                    last.focus?.();
                }
            } else if (active === last || !insidePanel) {
                event.preventDefault?.();
                event.stopPropagation?.();
                first.focus?.();
            }
        }
    }

    /**
     * En fase de captura protege el foco del diálogo de accesibilidad frente a
     * trampas de foco externas (por ejemplo, modales de Bootstrap abiertos).
     */
    function handlePanelFocusGuard(event) {
        if (!isOpen) return;
        const target = event.target;
        if (!target) return;

        if (widgetContainer.contains?.(target)) {
            event.stopPropagation?.();
            event.stopImmediatePropagation?.();
            return;
        }

        event.stopPropagation?.();
        event.stopImmediatePropagation?.();
        const fallbackTarget = panelTitle || getFocusableElements()[0];
        fallbackTarget?.focus?.();
    }

    function handlePageInteractionForVoice(event) {
        if (!prefs.voiceReader) return;
        const target = event.target;
        if (!target || widgetContainer.contains?.(target)) return;

        const readable =
            typeof target.closest === 'function'
                ? target.closest(READABLE_ELEMENT_SELECTOR)
                : target;
        if (!readable || widgetContainer.contains?.(readable)) return;

        const now = Date.now();
        if (readable === lastSpokenElement && now - lastSpokenAt < VOICE_DEDUP_WINDOW_MS) {
            return;
        }

        const text = extractReadableText(readable);
        if (text) {
            lastSpokenElement = readable;
            lastSpokenAt = now;
            speakText(text, readable);
        }
    }

    // Bindings de controles del panel
    toggleBtn.addEventListener('click', () => togglePanel());
    closeBtn?.addEventListener('click', () => closePanel({ restoreFocus: true }));
    backdrop?.addEventListener('click', () => closePanel({ restoreFocus: true }));

    fontDecBtn?.addEventListener('click', () => {
        const nextScale = stepFontScale(prefs.fontScale, -1);
        commitPreferences({ ...prefs, fontScale: nextScale }, `Tamaño de texto en ${nextScale} por ciento.`);
    });

    fontIncBtn?.addEventListener('click', () => {
        const nextScale = stepFontScale(prefs.fontScale, 1);
        commitPreferences({ ...prefs, fontScale: nextScale }, `Tamaño de texto en ${nextScale} por ciento.`);
    });

    contrastBtn?.addEventListener('click', () => {
        const next = !prefs.highContrast;
        commitPreferences(
            { ...prefs, highContrast: next },
            next ? 'Alto contraste activado.' : 'Alto contraste desactivado.'
        );
    });

    dyslexiaBtn?.addEventListener('click', () => {
        const next = !prefs.dyslexiaFont;
        commitPreferences(
            { ...prefs, dyslexiaFont: next },
            next ? 'Tipografía para dislexia activada.' : 'Tipografía para dislexia desactivada.'
        );
    });

    motionBtn?.addEventListener('click', () => {
        const next = !prefs.reducedMotion;
        commitPreferences(
            { ...prefs, reducedMotion: next },
            next
                ? 'Reducción de animaciones y distracciones activada.'
                : 'Reducción de animaciones desactivada.'
        );
    });

    keyboardBtn?.addEventListener('click', () => {
        const next = !prefs.keyboardFocus;
        commitPreferences(
            { ...prefs, keyboardFocus: next },
            next ? 'Navegación por teclado resaltada activada.' : 'Navegación por teclado resaltada desactivada.'
        );
    });

    for (const btn of colorFilterButtons) {
        btn.addEventListener('click', () => {
            const selected = btn.getAttribute('data-a11y-filter-option') || 'none';
            if (!COLOR_FILTERS.includes(selected)) return;
            const label = COLOR_FILTER_LABELS[selected] || selected;
            commitPreferences(
                { ...prefs, colorFilter: selected },
                selected === 'none'
                    ? 'Filtro de daltonismo desactivado.'
                    : `Filtro de daltonismo ${label} activado.`
            );
        });
    }

    voiceBtn?.addEventListener('click', () => {
        const next = !prefs.voiceReader;
        if (!next) {
            stopSpeech({ silent: true });
        }
        commitPreferences(
            { ...prefs, voiceReader: next },
            next ? 'Lectura asistida por voz activada.' : 'Lectura asistida por voz desactivada.'
        );
        if (next && typeof voiceControls?.scrollIntoView === 'function') {
            voiceControls.scrollIntoView({
                block: 'nearest',
                behavior: prefs.reducedMotion ? 'auto' : 'smooth'
            });
        }
    });

    voiceReadPageBtn?.addEventListener('click', () => {
        const { text, target } = getActiveReadingTarget();
        speakText(text, target);
    });

    voicePauseBtn?.addEventListener('click', () => togglePauseSpeech());
    voiceStopBtn?.addEventListener('click', () => stopSpeech());

    voiceRateSelect?.addEventListener('change', (e) => {
        const rate = Number(e.target?.value);
        if (!SPEECH_RATES.includes(rate)) return;
        commitPreferences({ ...prefs, speechRate: rate }, `Velocidad de lectura ajustada a ${rate}x.`);
    });

    resetBtn?.addEventListener('click', () => {
        stopSpeech({ silent: true });
        const defaults = clearPreferences(storage);
        prefs = applyPreferencesToDocument(defaults, doc, win);
        syncUI();
        announce('Preferencias de accesibilidad restablecidas a los valores predeterminados.');
    });

    const handleBeforeUnload = () => stopSpeech({ silent: true });
    const handleWindowLoad = () => syncHeroCarouselMotion(prefs.reducedMotion, doc, win);

    doc.addEventListener('keydown', handleGlobalKeydown, true);
    doc.addEventListener('focusin', handlePanelFocusGuard, true);
    doc.addEventListener('click', handlePageInteractionForVoice);
    doc.addEventListener('focusin', handlePageInteractionForVoice);
    win?.addEventListener?.('beforeunload', handleBeforeUnload);
    win?.addEventListener?.('load', handleWindowLoad);

    // Aplicar estado inicial restaurado de localStorage
    prefs = applyPreferencesToDocument(prefs, doc, win);
    syncUI();

    return {
        getPreferences: () => ({ ...prefs }),
        isOpen: () => isOpen,
        openPanel,
        closePanel,
        togglePanel,
        speakText,
        stopSpeech,
        reset: () => {
            stopSpeech({ silent: true });
            const defaults = clearPreferences(storage);
            prefs = applyPreferencesToDocument(defaults, doc, win);
            syncUI();
        },
        destroy: () => {
            stopSpeech({ silent: true });
            doc.removeEventListener('keydown', handleGlobalKeydown, true);
            doc.removeEventListener('focusin', handlePanelFocusGuard, true);
            doc.removeEventListener('click', handlePageInteractionForVoice);
            doc.removeEventListener('focusin', handlePageInteractionForVoice);
            win?.removeEventListener?.('beforeunload', handleBeforeUnload);
            win?.removeEventListener?.('load', handleWindowLoad);
        }
    };
}

let singletonController = null;

/**
 * Inicializa el widget de accesibilidad una única vez en el navegador.
 */
export function initAccessibility(options = {}) {
    if (singletonController) return singletonController;
    try {
        singletonController = createAccessibilityController(options);
    } catch {
        // Degradación limpia: nunca impedir que FoodJet funcione
        singletonController = null;
    }
    return singletonController;
}

export { createDefaultPreferences };
