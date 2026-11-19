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
            for (const fn of docListeners.get(type) || []) {
                fn({
                    preventDefault() { prevented = true; },
                    ...event
                });
            }
            return prevented;
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

    it('debe reconocer Alt + A incluso con teclas internacionales (code KeyA) y rechazar combinaciones ajenas', () => {
        assert.equal(isOpenShortcut({ altKey: true, ctrlKey: false, metaKey: false, key: 'a', code: 'KeyA' }), true);
        assert.equal(isOpenShortcut({ altKey: true, ctrlKey: false, metaKey: false, key: 'A', code: 'KeyA' }), true);
        assert.equal(isOpenShortcut({ altKey: true, ctrlKey: false, metaKey: false, key: 'å', code: 'KeyA' }), true);
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

    it('debe extraer texto legible priorizando texto visible y cayendo a aria-label', () => {
        assert.equal(extractReadableText({ innerText: '  Hola   FoodJet  ' }), 'Hola FoodJet');
        assert.equal(
            extractReadableText({ innerText: '', textContent: '', getAttribute: (k) => (k === 'aria-label' ? 'Cerrar' : null) }),
            'Cerrar'
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
        const prevented = env.doc.dispatch('keydown', { altKey: true, ctrlKey: false, metaKey: false, key: 'a', code: 'KeyA' });
        assert.equal(prevented, true);
        assert.equal(ctrl.isOpen(), true);
        assert.equal(env.elements.get('a11yPanel').hidden, false);
        assert.equal(env.elements.get('a11yToggleBtn').getAttribute('aria-expanded'), 'true');
        assert.equal(env.doc.activeElement, env.elements.get('a11yPanelTitle'));

        // Cerrar con Escape restaura foco al botón flotante
        env.doc.dispatch('keydown', { key: 'Escape' });
        assert.equal(ctrl.isOpen(), false);
        assert.equal(env.elements.get('a11yPanel').hidden, true);
        assert.equal(env.elements.get('a11yToggleBtn').getAttribute('aria-expanded'), 'false');
        assert.equal(env.doc.activeElement, env.elements.get('a11yToggleBtn'));

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
        assert.ok(css.includes('font-family: bootstrap-icons !important'), 'Debe preservar iconos Bootstrap en modo dislexia');
    });

    it('applyPreferencesToDocument debe ser idempotente y nunca lanzar con documento parcial', () => {
        const env = createFakeDOM();
        const res = applyPreferencesToDocument({ fontScale: 200, colorFilter: 'protanopia' }, env.doc, env.win);
        assert.equal(res.fontScale, 200);
        assert.equal(env.doc.documentElement.getAttribute('data-a11y-color-filter'), 'protanopia');
        assert.deepEqual(applyPreferencesToDocument(null, null, null), createDefaultPreferences());
    });
});
