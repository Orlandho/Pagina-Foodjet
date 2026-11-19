import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
    COLOR_FILTERS,
    FONT_SCALE_MAX,
    FONT_SCALE_MIN,
    STORAGE_KEY,
    clampFontScale,
    clearPreferences,
    countActiveAdjustments,
    createDefaultPreferences,
    extractReadableText,
    isOpenShortcut,
    loadPreferences,
    sanitizePreferences,
    savePreferences,
    stepFontScale
} from '../../frontend/js/domain/accessibility.js';

import {
    applyPreferencesToDocument,
    createAccessibilityController,
    splitTextForSpeech
} from '../../frontend/js/accessibility.js';

function createFakeElement(id = '', attrs = {}) {
    const listeners = new Map();
    const classes = new Set();
    const attributes = new Map(Object.entries(attrs));
    const styles = new Map();
    const el = {
        id,
        hidden: false,
        disabled: false,
        textContent: '',
        innerText: '',
        value: '1',
        focused: false,
        isConnected: true,
        classList: {
            add: (c) => classes.add(c),
            remove: (c) => classes.delete(c),
            toggle: (c, force) => {
                if (force === undefined) {
                    if (classes.has(c)) classes.delete(c);
                    else classes.add(c);
                } else if (force) {
                    classes.add(c);
                } else {
                    classes.delete(c);
                }
            },
            contains: (c) => classes.has(c)
        },
        style: {
            display: '',
            width: '',
            setProperty: (k, v) => styles.set(k, v),
            removeProperty: (k) => styles.delete(k),
            getPropertyValue: (k) => styles.get(k) || ''
        },
        setAttribute: (k, v) => attributes.set(k, String(v)),
        getAttribute: (k) => (attributes.has(k) ? attributes.get(k) : null),
        removeAttribute: (k) => attributes.delete(k),
        addEventListener: (type, fn) => {
            if (!listeners.has(type)) listeners.set(type, []);
            listeners.get(type).push(fn);
        },
        removeEventListener: (type, fn) => {
            const arr = listeners.get(type) || [];
            listeners.set(type, arr.filter((item) => item !== fn));
        },
        dispatch: (type, event = {}) => {
            for (const fn of listeners.get(type) || []) {
                fn({ target: el, preventDefault() {}, ...event });
            }
        },
        click() {
            this.dispatch('click');
        },
        focus() {
            this.focused = true;
            if (el._ownerDoc) el._ownerDoc.activeElement = el;
        },
        contains: () => false,
        closest: () => null,
        querySelectorAll: () => []
    };
    return el;
}

function createFakeDOM({ speechSupported = true, initialStorage = null } = {}) {
    const docListeners = new Map();
    const elements = new Map();
    const root = createFakeElement('html');
    const body = createFakeElement('body');

    const ids = [
        'a11yWidgetContainer',
        'a11yToggleBtn',
        'a11yPanel',
        'a11yBackdrop',
        'a11yCloseBtn',
        'a11yPanelTitle',
        'a11yActiveBadge',
        'a11yLiveRegion',
        'a11yFontDecBtn',
        'a11yFontIncBtn',
        'a11yFontValue',
        'a11yFontMeter',
        'a11yContrastBtn',
        'a11yDyslexiaBtn',
        'a11yMotionBtn',
        'a11yKeyboardBtn',
        'a11yVoiceBtn',
        'a11yResetBtn',
        'a11yVoiceControls',
        'a11yVoiceReadPageBtn',
        'a11yVoicePauseBtn',
        'a11yVoiceStopBtn',
        'a11yVoiceRateSelect',
        'a11yVoiceStatus',
        'headerAddressBar',
        'heroCarousel',
        'main-content',
        'homeView'
    ];

    const doc = {
        documentElement: root,
        body,
        activeElement: body,
        getElementById: (id) => elements.get(id) || null,
        querySelector: (selector) => {
            if (selector === '.modal.show, .offcanvas.show') {
                return doc._activeOverlay || null;
            }
            return null;
        },
        querySelectorAll: (selector) => {
            if (selector === '[data-a11y-filter-option]') {
                return colorButtons;
            }
            return [];
        },
        addEventListener: (type, fn) => {
            if (!docListeners.has(type)) docListeners.set(type, []);
            docListeners.get(type).push(fn);
        },
        removeEventListener: (type, fn) => {
            const arr = docListeners.get(type) || [];
            docListeners.set(type, arr.filter((item) => item !== fn));
        },
        dispatch: (type, event = {}) => {
            let prevented = false;
            let stopped = false;
            let immediateStopped = false;
            for (const fn of docListeners.get(type) || []) {
                fn({
                    preventDefault() { prevented = true; },
                    stopPropagation() { stopped = true; },
                    stopImmediatePropagation() { immediateStopped = true; },
                    ...event
                });
                if (immediateStopped) break;
            }
            return { prevented, stopped, immediateStopped };
        }
    };

    for (const id of ids) {
        const el = createFakeElement(id);
        el._ownerDoc = doc;
        elements.set(id, el);
    }

    elements.get('a11yPanel').hidden = true;
    elements.get('a11yBackdrop').hidden = true;
    elements.get('homeView').innerText = 'Tu antojo. Sin escalas. Hamburguesa clásica S/ 18.00.';

    const colorButtons = COLOR_FILTERS.map((filter) => {
        const btn = createFakeElement(`a11yFilter_${filter}`, { 'data-a11y-filter-option': filter });
        btn._ownerDoc = doc;
        return btn;
    });

    const focusables = [
        elements.get('a11yCloseBtn'),
        elements.get('a11yFontIncBtn'),
        elements.get('a11yContrastBtn'),
        elements.get('a11yResetBtn')
    ];
    elements.get('a11yPanel').querySelectorAll = () => focusables;
    elements.get('a11yPanel').contains = (node) => focusables.includes(node) || node === elements.get('a11yPanelTitle');
    elements.get('a11yWidgetContainer').contains = (node) =>
        Array.from(elements.values()).includes(node) && node.id.startsWith('a11y');

    const carouselCalls = [];
    const carouselInstance = {
        pause: () => carouselCalls.push('pause'),
        cycle: () => carouselCalls.push('cycle')
    };

    const spokenUtterances = [];
    const speechCalls = [];

    class FakeUtterance {
        constructor(text) {
            this.text = text;
            this.lang = '';
            this.rate = 1;
            this.voice = null;
            this.onend = null;
            this.onerror = null;
        }
    }

    const win = {
        setTimeout: (fn) => fn(),
        addEventListener: () => {},
        removeEventListener: () => {},
        matchMedia: () => ({ matches: false }),
        bootstrap: {
            Carousel: {
                getInstance: () => carouselInstance,
                getOrCreateInstance: () => carouselInstance
            }
        },
        ...(speechSupported
            ? {
                  SpeechSynthesisUtterance: FakeUtterance,
                  speechSynthesis: {
                      getVoices: () => [{ lang: 'es-PE', name: 'Español Perú' }],
                      speak: (u) => {
                          spokenUtterances.push(u);
                          speechCalls.push('speak');
                      },
                      pause: () => speechCalls.push('pause'),
                      resume: () => speechCalls.push('resume'),
                      cancel: () => speechCalls.push('cancel')
                  }
              }
            : {})
    };

    const backing = new Map();
    if (initialStorage) {
        backing.set(STORAGE_KEY, initialStorage);
    }
    const storage = {
        getItem: (k) => (backing.has(k) ? backing.get(k) : null),
        setItem: (k, v) => backing.set(k, String(v)),
        removeItem: (k) => backing.delete(k)
    };

    return { doc, win, storage, elements, colorButtons, carouselCalls, spokenUtterances, speechCalls };
}

describe('Regression & White-Box Tests — Accessibility Domain', () => {
    it('debe acotar correctamente la escala tipográfica entre 100 % y 200 %', () => {
        assert.equal(clampFontScale(50), FONT_SCALE_MIN);
        assert.equal(clampFontScale(100), 100);
        assert.equal(clampFontScale(150.4), 150);
        assert.equal(clampFontScale(200), FONT_SCALE_MAX);
        assert.equal(clampFontScale(350), FONT_SCALE_MAX);
        assert.equal(clampFontScale('no-es-numero'), FONT_SCALE_MIN);
        assert.equal(clampFontScale(null), FONT_SCALE_MIN);
    });

    it('debe avanzar y retroceder por pasos discretos hasta exactamente 200 % y volver a 100 %', () => {
        let scale = 100;
        const visited = [scale];
        for (let i = 0; i < 6; i += 1) {
            scale = stepFontScale(scale, 1);
            visited.push(scale);
        }
        assert.deepEqual(visited, [100, 115, 130, 150, 175, 200, 200]);

        for (let i = 0; i < 6; i += 1) {
            scale = stepFontScale(scale, -1);
        }
        assert.equal(scale, 100);
    });

    it('debe reconocer Alt + A incluso con teclas internacionales (code KeyA) y rechazar combinaciones ajenas, Shift y repeat', () => {
        assert.equal(isOpenShortcut({ altKey: true, ctrlKey: false, metaKey: false, shiftKey: false, repeat: false, key: 'a', code: 'KeyA' }), true);
        assert.equal(isOpenShortcut({ altKey: true, ctrlKey: false, metaKey: false, shiftKey: false, repeat: false, key: 'A', code: 'KeyA' }), true);
        assert.equal(isOpenShortcut({ altKey: true, ctrlKey: false, metaKey: false, shiftKey: false, repeat: false, key: 'å', code: 'KeyA' }), true);
        assert.equal(isOpenShortcut({ altKey: true, ctrlKey: false, metaKey: false, shiftKey: false, repeat: true, key: 'a', code: 'KeyA' }), false);
        assert.equal(isOpenShortcut({ altKey: true, ctrlKey: false, metaKey: false, shiftKey: true, repeat: false, key: 'A', code: 'KeyA' }), false);
        assert.equal(isOpenShortcut({ altKey: true, ctrlKey: true, metaKey: false, key: 'a', code: 'KeyA' }), false);
        assert.equal(isOpenShortcut({ altKey: true, ctrlKey: false, metaKey: true, key: 'a', code: 'KeyA' }), false);
        assert.equal(isOpenShortcut({ altKey: false, ctrlKey: false, metaKey: false, key: 'a', code: 'KeyA' }), false);
        assert.equal(isOpenShortcut(null), false);
    });

    it('debe sanear objetos corruptos o inválidos sin lanzar excepciones', () => {
        assert.deepEqual(sanitizePreferences(null), createDefaultPreferences());
        assert.deepEqual(sanitizePreferences([]), createDefaultPreferences());
        assert.deepEqual(sanitizePreferences('corrupt'), createDefaultPreferences());

        const sanitized = sanitizePreferences({
            highContrast: 1,
            colorFilter: 'monochrome_invalid',
            fontScale: 999,
            dyslexiaFont: 'yes',
            reducedMotion: true,
            keyboardFocus: true,
            voiceReader: true,
            speechRate: 99
        });
        assert.equal(sanitized.highContrast, true);
        assert.equal(sanitized.colorFilter, 'none');
        assert.equal(sanitized.fontScale, 200);
        assert.equal(sanitized.speechRate, 1.0);
        assert.equal(countActiveAdjustments(sanitized), 6);
    });

    it('debe manejar errores de localStorage y JSON corrupto con degradación segura', () => {
        const brokenStorage = {
            getItem() { throw new Error('Blocked'); },
            setItem() { throw new Error('QuotaExceeded'); },
            removeItem() { throw new Error('Blocked'); }
        };
        assert.deepEqual(loadPreferences(brokenStorage), createDefaultPreferences());
        const saved = savePreferences({ highContrast: true }, brokenStorage);
        assert.equal(saved.ok, false);
        assert.deepEqual(clearPreferences(brokenStorage), createDefaultPreferences());
    });

    it('debe extraer texto legible priorizando texto visible, cayendo a aria-label y protegiendo contraseñas en inputs', () => {
        assert.equal(extractReadableText({ innerText: '  Hola   FoodJet  ' }), 'Hola FoodJet');
        assert.equal(
            extractReadableText({ innerText: '', textContent: '', getAttribute: (k) => (k === 'aria-label' ? 'Cerrar' : null) }),
            'Cerrar'
        );
        assert.equal(
            extractReadableText({
                tagName: 'INPUT',
                type: 'search',
                value: 'ceviche',
                getAttribute: (k) => (k === 'placeholder' ? 'Buscar comida' : null)
            }),
            'Buscar comida: ceviche'
        );
        assert.equal(
            extractReadableText({
                tagName: 'INPUT',
                type: 'password',
                value: 'Secreto123!',
                getAttribute: (k) => (k === 'aria-label' ? 'Contraseña' : k === 'type' ? 'password' : null)
            }),
            'Contraseña (campo de contraseña)'
        );
        assert.equal(
            extractReadableText({
                tagName: 'SELECT',
                selectedIndex: 1,
                options: [{ textContent: 'Recomendados' }, { textContent: 'Menor precio' }],
                getAttribute: (k) => (k === 'aria-label' ? 'Ordenar por' : null)
            }),
            'Ordenar por: Menor precio'
        );
        assert.equal(extractReadableText(null), '');
    });

    it('debe dividir textos largos en fragmentos menores al límite para Web Speech API', () => {
        const chunks = splitTextForSpeech('Primera oración de prueba. '.repeat(20), 120);
        assert.ok(chunks.length > 1);
        for (const chunk of chunks) {
            assert.ok(chunk.length <= 120);
        }
        assert.deepEqual(splitTextForSpeech('   '), []);
    });
});

describe('Regression Tests — Accessibility DOM Controller', () => {
    it('debe abrir y cerrar el panel con Alt + A y Escape devolviendo el foco', () => {
        const env = createFakeDOM();
        const ctrl = createAccessibilityController(env);
        assert.ok(ctrl);
        assert.equal(ctrl.isOpen(), false);

        // Abrir mediante Alt + A
        const openEvt = env.doc.dispatch('keydown', { altKey: true, ctrlKey: false, metaKey: false, key: 'a', code: 'KeyA' });
        assert.equal(openEvt.prevented, true);
        assert.equal(openEvt.immediateStopped, true);
        assert.equal(ctrl.isOpen(), true);
        assert.equal(env.elements.get('a11yPanel').hidden, false);
        assert.equal(env.elements.get('a11yToggleBtn').getAttribute('aria-expanded'), 'true');
        assert.equal(env.doc.activeElement, env.elements.get('a11yPanelTitle'));

        // Forward Tab desde fuera del panel debe devolver foco al primer elemento enfocable
        const externalBtn = createFakeElement('externalBtn');
        externalBtn._ownerDoc = env.doc;
        env.doc.activeElement = externalBtn;
        const tabEvt = env.doc.dispatch('keydown', { key: 'Tab', shiftKey: false });
        assert.equal(tabEvt.prevented, true);
        assert.equal(env.doc.activeElement, env.elements.get('a11yCloseBtn'));

        // Guardia de foco en fase de captura impide que otro modal robe el foco del panel
        const focusInPanelEvt = env.doc.dispatch('focusin', { target: env.elements.get('a11yCloseBtn') });
        assert.equal(focusInPanelEvt.immediateStopped, true);

        // Cerrar con Escape detiene propagación inmediata para no cerrar modales subyacentes
        const escEvt = env.doc.dispatch('keydown', { key: 'Escape' });
        assert.equal(escEvt.prevented, true);
        assert.equal(escEvt.immediateStopped, true);
        assert.equal(ctrl.isOpen(), false);
        assert.equal(env.elements.get('a11yPanel').hidden, true);
        assert.equal(env.elements.get('a11yToggleBtn').getAttribute('aria-expanded'), 'false');
        assert.equal(env.doc.activeElement, env.elements.get('a11yToggleBtn'));

        ctrl.destroy();
    });

    it('debe deduplicar focusin+click en lectura por voz y priorizar modal/offcanvas abierto en Leer vista', () => {
        const env = createFakeDOM({ speechSupported: true });
        const ctrl = createAccessibilityController(env);

        env.elements.get('a11yVoiceBtn').click();

        const externalBtn = createFakeElement('catBtn');
        externalBtn.innerText = 'Pizzas';
        externalBtn.closest = () => externalBtn;

        // Simular focusin seguido inmediatamente de click al pulsar un botón
        env.doc.dispatch('focusin', { target: externalBtn });
        env.doc.dispatch('click', { target: externalBtn });
        assert.equal(env.spokenUtterances.length, 1, 'No debe tartamudear repitiendo la lectura en focusin + click');
        assert.equal(env.spokenUtterances[0].text, 'Pizzas');

        // Con un offcanvas abierto, "Leer vista" debe leer el offcanvas y no homeView detrás
        const openCart = createFakeElement('cartOffcanvas');
        openCart.innerText = 'Tu carrito tiene 2 productos por S/ 37.00.';
        env.doc._activeOverlay = openCart;
        env.elements.get('a11yVoiceReadPageBtn').click();
        assert.equal(env.spokenUtterances.length, 2);
        assert.ok(env.spokenUtterances[1].text.includes('Tu carrito tiene 2 productos'));

        ctrl.destroy();
    });

    it('debe aplicar todos los ajustes, pausar el carrusel y persistir al recargar', () => {
        const env = createFakeDOM();
        const ctrl = createAccessibilityController(env);

        env.elements.get('a11yContrastBtn').click();
        env.elements.get('a11yDyslexiaBtn').click();
        env.elements.get('a11yMotionBtn').click();
        env.elements.get('a11yKeyboardBtn').click();
        env.colorButtons.find((b) => b.getAttribute('data-a11y-filter-option') === 'tritanopia').click();

        // Escalar hasta 200 %
        for (let i = 0; i < 6; i += 1) {
            env.elements.get('a11yFontIncBtn').click();
        }

        const root = env.doc.documentElement;
        assert.equal(root.getAttribute('data-a11y-contrast'), 'high');
        assert.equal(root.getAttribute('data-a11y-dyslexia'), 'true');
        assert.equal(root.getAttribute('data-a11y-reduced-motion'), 'true');
        assert.equal(root.getAttribute('data-a11y-keyboard-nav'), 'true');
        assert.equal(root.getAttribute('data-a11y-color-filter'), 'tritanopia');
        assert.equal(root.getAttribute('data-a11y-font-scale'), '200');
        assert.equal(root.style.getPropertyValue('--a11y-font-scale'), '2');
        assert.ok(env.carouselCalls.includes('pause'), 'Debe pausar el carrusel hero cuando reducedMotion está activo');

        // Simular recarga: nueva instancia sobre el mismo storage
        ctrl.destroy();
        const envReload = createFakeDOM({ initialStorage: env.storage.getItem(STORAGE_KEY) });
        const ctrlReload = createAccessibilityController(envReload);
        assert.deepEqual(ctrlReload.getPreferences(), {
            highContrast: true,
            colorFilter: 'tritanopia',
            fontScale: 200,
            dyslexiaFont: true,
            reducedMotion: true,
            keyboardFocus: true,
            voiceReader: false,
            speechRate: 1.0
        });
        assert.equal(envReload.doc.documentElement.getAttribute('data-a11y-font-scale'), '200');

        // Restablecer preferencias limpia DOM y storage
        envReload.elements.get('a11yResetBtn').click();
        assert.equal(envReload.doc.documentElement.getAttribute('data-a11y-contrast'), null);
        assert.equal(envReload.doc.documentElement.getAttribute('data-a11y-color-filter'), null);
        assert.equal(envReload.doc.documentElement.getAttribute('data-a11y-font-scale'), null);
        assert.equal(envReload.storage.getItem(STORAGE_KEY), null);

        ctrlReload.destroy();
    });

    it('debe activar lectura asistida por voz con Web Speech API y degradar si no es soportada', () => {
        const env = createFakeDOM({ speechSupported: true });
        const ctrl = createAccessibilityController(env);

        env.elements.get('a11yVoiceBtn').click();
        assert.equal(env.elements.get('a11yVoiceControls').hidden, false);

        env.elements.get('a11yVoiceReadPageBtn').click();
        assert.equal(env.spokenUtterances.length, 1);
        assert.equal(env.spokenUtterances[0].lang, 'es-PE');
        assert.ok(env.spokenUtterances[0].text.includes('Tu antojo'));

        env.elements.get('a11yVoicePauseBtn').click();
        assert.ok(env.speechCalls.includes('pause'));
        env.elements.get('a11yVoiceStopBtn').click();
        assert.ok(env.speechCalls.includes('cancel'));
        ctrl.destroy();

        // Navegador sin Web Speech API
        const noSpeechEnv = createFakeDOM({ speechSupported: false });
        const noSpeechCtrl = createAccessibilityController(noSpeechEnv);
        noSpeechEnv.elements.get('a11yVoiceBtn').click();
        assert.equal(noSpeechEnv.elements.get('a11yVoiceReadPageBtn').disabled, true);
        assert.ok(noSpeechEnv.elements.get('a11yVoiceStatus').textContent.includes('no soporta síntesis de voz'));
        noSpeechCtrl.destroy();
    });

    it('no debe registrar un listener keydown duplicado sobre #headerAddressBar (gestionado por ui.js)', () => {
        const env = createFakeDOM();
        const headerAddressBar = env.elements.get('headerAddressBar');
        let clickCount = 0;
        headerAddressBar.addEventListener('click', () => {
            clickCount += 1;
        });

        const ctrl = createAccessibilityController(env);
        headerAddressBar.dispatch('keydown', { key: 'Enter' });
        headerAddressBar.dispatch('keydown', { key: ' ' });
        assert.equal(clickCount, 0, 'accessibility.js no debe duplicar el handler keydown de ui.js en #headerAddressBar');

        const uiJs = fs.readFileSync(path.resolve('frontend/js/ui.js'), 'utf8');
        assert.ok(
            /function initHeaderAddress[\s\S]*?addEventListener\('keydown'/.test(uiJs),
            'ui.js debe conservar el soporte de teclado (Enter/Espacio) para #headerAddressBar'
        );

        ctrl.destroy();
    });
});

describe('Structural Regression Guards — Anti-Deletion Protection', () => {
    it('debe conservar activos locales de OpenDyslexic y su licencia SIL OFL 1.1', () => {
        const regularPath = path.resolve('frontend/fonts/OpenDyslexic-Regular.woff2');
        const boldPath = path.resolve('frontend/fonts/OpenDyslexic-Bold.woff2');
        const licensePath = path.resolve('frontend/fonts/OFL-OpenDyslexic.txt');

        assert.ok(fs.existsSync(regularPath), 'Debe existir OpenDyslexic-Regular.woff2');
        assert.ok(fs.existsSync(boldPath), 'Debe existir OpenDyslexic-Bold.woff2');
        assert.ok(fs.existsSync(licensePath), 'Debe existir licencia SIL OFL 1.1');
        assert.equal(fs.readFileSync(regularPath).subarray(0, 4).toString('ascii'), 'wOF2');
        assert.equal(fs.readFileSync(boldPath).subarray(0, 4).toString('ascii'), 'wOF2');
    });

    it('debe mantener el widget azul en index.html y estilos para claro, oscuro, móvil y alto contraste', () => {
        const html = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
        const css = fs.readFileSync(path.resolve('frontend/styles.css'), 'utf8');

        assert.ok(html.includes('id="a11yToggleBtn"'));
        assert.ok(html.includes('id="a11yPanel"'));
        assert.ok(html.includes('id="a11y-filter-protanopia"'));
        assert.ok(html.includes('id="a11y-filter-deuteranopia"'));
        assert.ok(html.includes('id="a11y-filter-tritanopia"'));
        assert.ok(!html.includes('REPLACE_WITH_YOUR_ACCOUNT_ID'), 'Nunca debe volver a existir un ID ficticio');
        assert.ok(!html.includes('cdn.userway.org'), 'No debe depender del CDN externo de UserWay');

        assert.ok(css.includes('.a11y-fab'));
        assert.ok(css.includes('html[data-a11y-contrast="high"]'));
        assert.ok(css.includes('html[data-a11y-dyslexia="true"]'));
        assert.ok(css.includes('html[data-a11y-reduced-motion="true"]'));
        assert.ok(css.includes('html[data-a11y-keyboard-nav="true"]'));
        assert.ok(css.includes('html[data-a11y-font-scale]'));
        assert.ok(css.includes('font-size: calc(100% * var(--a11y-font-scale, 1))'), 'La escala tipográfica debe respetar el tamaño base del navegador');
        assert.ok(css.includes('font-family: bootstrap-icons !important'), 'Debe preservar iconos Bootstrap en modo dislexia');
        assert.ok(css.includes('body > footer p.text-muted'), 'Debe evitar texto 1:1 invisible en copyright del footer en alto contraste');
        assert.ok(css.includes('.foodjet-quick-login-btn'), 'Debe estilizar botones de acceso rápido en alto contraste');
        assert.ok(css.includes('.foodjet-badge--soldout'), 'Debe estilizar badge AGOTADO en alto contraste');
        assert.ok(css.includes('.btn-check:checked + .foodjet-payment-tile'), 'Debe estilizar método de pago seleccionado en alto contraste');
    });

    it('debe definir matrices de daltonización que preserven neutros y contraste de colores de marca', () => {
        const html = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
        const srgbToLin = (c) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        const linToSrgb = (c) => Math.round((Math.max(0, Math.min(1, c)) <= 0.0031308 ? 12.92 * Math.max(0, Math.min(1, c)) : 1.055 * (Math.max(0, Math.min(1, c)) ** (1 / 2.4)) - 0.055) * 255);
        const lum = (rgb) => { const [r, g, b] = rgb.map(srgbToLin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
        const cr = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

        for (const id of ['a11y-filter-protanopia', 'a11y-filter-deuteranopia', 'a11y-filter-tritanopia']) {
            const match = html.match(new RegExp(`id="${id}"[\\s\\S]*?values="([^"]+)"`));
            assert.ok(match, `Debe existir feColorMatrix para ${id}`);
            const nums = match[1].trim().split(/\s+/).map(Number);
            assert.equal(nums.length, 20);
            const m = [nums.slice(0, 3), nums.slice(5, 8), nums.slice(10, 13)];
            for (const row of m) {
                assert.ok(Math.abs(row[0] + row[1] + row[2] - 1) < 1e-4, `${id} debe preservar blanco/grises neutros`);
            }
            const apply = (rgb) => {
                const lin = rgb.map(srgbToLin);
                return m.map((row) => linToSrgb(row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2]));
            };
            assert.ok(cr(apply([244, 81, 30]), [255, 255, 255]) >= 3.2, `${id} no debe lavar el naranja FoodJet contra blanco`);
            assert.ok(cr(apply([13, 110, 253]), [255, 255, 255]) >= 4.0, `${id} no debe lavar el azul primario contra blanco`);
        }
    });

    it('debe garantizar contraste WCAG 2.1 AA en estados hover e indicador de escala del widget en modo oscuro', () => {
        const css = fs.readFileSync(path.resolve('frontend/styles.css'), 'utf8');
        const darkBlockMatch = css.match(
            /\/\* Adaptación del widget a modo oscuro del sistema \*\/[\s\S]*?@media \(prefers-color-scheme: dark\) \{([\s\S]*?)\r?\n\}\r?\n\r?\n\/\* Adaptación responsiva/
        );
        assert.ok(darkBlockMatch, 'Debe existir el bloque @media (prefers-color-scheme: dark) del widget de accesibilidad');
        const darkBlock = darkBlockMatch[1];

        const hexToRgb = (hex) => {
            const clean = hex.replace('#', '');
            return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16));
        };
        const srgbToLin = (c) => {
            const v = c / 255;
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        };
        const lum = (hex) => {
            const [r, g, b] = hexToRgb(hex).map(srgbToLin);
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const contrastRatio = (hexA, hexB) => {
            const l1 = lum(hexA);
            const l2 = lum(hexB);
            return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        };
        const readVar = (name) => {
            const m = darkBlock.match(new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`));
            assert.ok(m, `Debe definirse ${name} en modo oscuro`);
            return m[1];
        };

        const blueSoft = readVar('--a11y-blue-soft');
        const surface = readVar('--a11y-surface');
        const surfaceSubtle = readVar('--a11y-surface-subtle');

        const stepHoverRule = darkBlock.match(/\.a11y-step-btn:hover:not\(:disabled\)\s*\{([^}]*)\}/);
        assert.ok(stepHoverRule, 'Debe existir override de .a11y-step-btn:hover:not(:disabled) en modo oscuro');
        const stepHoverColor = stepHoverRule[1].match(/(?:^|[;\s])color:\s*(#[0-9A-Fa-f]{6})/);
        const stepHoverBorder = stepHoverRule[1].match(/border-color:\s*(#[0-9A-Fa-f]{6})/);
        assert.ok(stepHoverColor, '.a11y-step-btn:hover:not(:disabled) debe definir color explícito en modo oscuro');
        assert.ok(stepHoverBorder, '.a11y-step-btn:hover:not(:disabled) debe definir border-color explícito en modo oscuro');

        assert.ok(
            contrastRatio(stepHoverColor[1], blueSoft) >= 4.5,
            `Contraste texto hover de .a11y-step-btn en modo oscuro debe ser >= 4.5:1 (actual: ${contrastRatio(stepHoverColor[1], blueSoft).toFixed(2)}:1)`
        );
        assert.ok(
            contrastRatio(stepHoverBorder[1], blueSoft) >= 3.0,
            'Contraste de borde hover de .a11y-step-btn sobre --a11y-blue-soft debe ser >= 3:1'
        );
        assert.ok(
            contrastRatio(stepHoverBorder[1], surface) >= 3.0,
            'Contraste de borde hover de .a11y-step-btn sobre --a11y-surface debe ser >= 3:1'
        );

        const tileChipHoverRule = darkBlock.match(
            /\.a11y-tile:hover,\s*\.a11y-chip:hover\s*\{([^}]*)\}/
        );
        assert.ok(tileChipHoverRule, 'Debe existir override de .a11y-tile:hover y .a11y-chip:hover en modo oscuro');
        const tileChipBorder = tileChipHoverRule[1].match(/border-color:\s*(#[0-9A-Fa-f]{6})/);
        assert.ok(tileChipBorder, '.a11y-tile:hover y .a11y-chip:hover deben definir border-color en modo oscuro');
        assert.ok(
            contrastRatio(tileChipBorder[1], surfaceSubtle) >= 3.0,
            'Contraste de borde hover en .a11y-tile/.a11y-chip sobre --a11y-surface-subtle debe ser >= 3:1'
        );
        assert.ok(
            contrastRatio(tileChipBorder[1], surface) >= 3.0,
            'Contraste de borde hover en .a11y-tile/.a11y-chip sobre --a11y-surface debe ser >= 3:1'
        );

        const trackFillRule = darkBlock.match(/\.a11y-font-track__fill\s*\{([^}]*)\}/);
        assert.ok(trackFillRule, 'Debe existir override de .a11y-font-track__fill en modo oscuro');
        const trackFillBg = trackFillRule[1].match(/background-color:\s*(#[0-9A-Fa-f]{6})/);
        assert.ok(trackFillBg, '.a11y-font-track__fill debe definir background-color explícito en modo oscuro');
        assert.ok(
            contrastRatio(trackFillBg[1], surfaceSubtle) >= 3.0,
            'Contraste del indicador de escala .a11y-font-track__fill en modo oscuro debe ser >= 3:1'
        );
    });

    it('applyPreferencesToDocument debe ser idempotente y nunca lanzar con documento parcial', () => {
        const env = createFakeDOM();
        const res = applyPreferencesToDocument({ fontScale: 200, colorFilter: 'protanopia' }, env.doc, env.win);
        assert.equal(res.fontScale, 200);
        assert.equal(env.doc.documentElement.getAttribute('data-a11y-color-filter'), 'protanopia');
        assert.deepEqual(applyPreferencesToDocument(null, null, null), createDefaultPreferences());
    });
});
