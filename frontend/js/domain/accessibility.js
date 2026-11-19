/**
 * Módulo de dominio puro para las preferencias de accesibilidad de FoodJet.
 *
 * Sin dependencias del DOM ni de proveedores externos: toda validación,
 * normalización, cálculo de escala tipográfica, atajo de teclado y
 * persistencia en almacenamiento local vive aquí para poder probarse en Node
 * (Cucumber y node:test) y reutilizarse desde el controlador de interfaz.
 */

export const STORAGE_KEY = 'foodjet_a11y_prefs_v1';

export const FONT_SCALE_MIN = 100;
export const FONT_SCALE_MAX = 200;
export const FONT_SCALE_STEPS = Object.freeze([100, 115, 130, 150, 175, 200]);

export const COLOR_FILTERS = Object.freeze([
    'none',
    'protanopia',
    'deuteranopia',
    'tritanopia'
]);

export const SPEECH_RATES = Object.freeze([0.8, 1.0, 1.25, 1.5]);

export const DEFAULT_PREFERENCES = Object.freeze({
    highContrast: false,
    colorFilter: 'none',
    fontScale: FONT_SCALE_MIN,
    dyslexiaFont: false,
    reducedMotion: false,
    keyboardFocus: false,
    voiceReader: false,
    speechRate: 1.0
});

/**
 * Devuelve una copia mutable de las preferencias por defecto.
 */
export function createDefaultPreferences() {
    return { ...DEFAULT_PREFERENCES };
}

/**
 * Restringe un porcentaje de escala tipográfica al rango [100, 200].
 * Valores no numéricos o inválidos vuelven a 100 %.
 */
export function clampFontScale(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return FONT_SCALE_MIN;
    const rounded = Math.round(num);
    if (rounded < FONT_SCALE_MIN) return FONT_SCALE_MIN;
    if (rounded > FONT_SCALE_MAX) return FONT_SCALE_MAX;
    return rounded;
}

/**
 * Avanza (+1) o retrocede (-1) un paso en la escala tipográfica discreta
 * [100, 115, 130, 150, 175, 200] sin salirse de los límites.
 */
export function stepFontScale(current, direction) {
    const clamped = clampFontScale(current);
    const dir = Number(direction);
    if (!dir) return clamped;

    if (dir > 0) {
        const next = FONT_SCALE_STEPS.find((step) => step > clamped);
        return next !== undefined ? next : FONT_SCALE_MAX;
    }

    for (let i = FONT_SCALE_STEPS.length - 1; i >= 0; i -= 1) {
        if (FONT_SCALE_STEPS[i] < clamped) {
            return FONT_SCALE_STEPS[i];
        }
    }
    return FONT_SCALE_MIN;
}

/**
 * Valida la velocidad de síntesis de voz.
 */
export function sanitizeSpeechRate(rate) {
    const num = Number(rate);
    if (SPEECH_RATES.includes(num)) return num;
    return DEFAULT_PREFERENCES.speechRate;
}

/**
 * Valida y normaliza un objeto arbitrario de preferencias.
 * Nunca lanza excepciones aunque reciba datos corruptos o tipos incorrectos.
 */
export function sanitizePreferences(raw) {
    const defaults = createDefaultPreferences();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return defaults;
    }

    const colorFilter =
        typeof raw.colorFilter === 'string' && COLOR_FILTERS.includes(raw.colorFilter)
            ? raw.colorFilter
            : defaults.colorFilter;

    return {
        highContrast: Boolean(raw.highContrast),
        colorFilter,
        fontScale: clampFontScale(raw.fontScale ?? defaults.fontScale),
        dyslexiaFont: Boolean(raw.dyslexiaFont),
        reducedMotion: Boolean(raw.reducedMotion),
        keyboardFocus: Boolean(raw.keyboardFocus),
        voiceReader: Boolean(raw.voiceReader),
        speechRate: sanitizeSpeechRate(raw.speechRate)
    };
}

function resolveStorage(storage) {
    if (storage !== undefined) return storage;
    try {
        return globalThis.localStorage ?? null;
    } catch {
        return null;
    }
}

/**
 * Lee y valida las preferencias guardadas en localStorage.
 * Devuelve valores por defecto si el almacenamiento está bloqueado o corrupto.
 */
export function loadPreferences(storage) {
    const store = resolveStorage(storage);
    if (!store || typeof store.getItem !== 'function') {
        return createDefaultPreferences();
    }

    try {
        const serialized = store.getItem(STORAGE_KEY);
        if (!serialized) return createDefaultPreferences();
        const parsed = JSON.parse(serialized);
        return sanitizePreferences(parsed);
    } catch {
        return createDefaultPreferences();
    }
}

/**
 * Persiste las preferencias saneadas en localStorage sin propagar errores de
 * cuota o modo privado.
 */
export function savePreferences(prefs, storage) {
    const sanitized = sanitizePreferences(prefs);
    const store = resolveStorage(storage);
    if (!store || typeof store.setItem !== 'function') {
        return { ok: false, prefs: sanitized };
    }

    try {
        store.setItem(STORAGE_KEY, JSON.stringify(sanitized));
        return { ok: true, prefs: sanitized };
    } catch {
        return { ok: false, prefs: sanitized };
    }
}

/**
 * Borra las preferencias persistidas y devuelve el estado inicial limpio.
 */
export function clearPreferences(storage) {
    const store = resolveStorage(storage);
    if (store && typeof store.removeItem === 'function') {
        try {
            store.removeItem(STORAGE_KEY);
        } catch {
            // Ignorar bloqueo de almacenamiento en modo privado
        }
    }
    return createDefaultPreferences();
}

/**
 * Cuenta cuántos ajustes activos difieren de la configuración predeterminada.
 * Permite mostrar una insignia discreta sobre el botón flotante azul.
 */
export function countActiveAdjustments(prefs) {
    const p = sanitizePreferences(prefs);
    let count = 0;
    if (p.highContrast) count += 1;
    if (p.colorFilter !== 'none') count += 1;
    if (p.fontScale > FONT_SCALE_MIN) count += 1;
    if (p.dyslexiaFont) count += 1;
    if (p.reducedMotion) count += 1;
    if (p.keyboardFocus) count += 1;
    if (p.voiceReader) count += 1;
    return count;
}

/**
 * Determina si un evento KeyboardEvent corresponde al atajo global Alt + A.
 *
 * Comprueba tanto `event.key` (case-insensitive) como `event.code === 'KeyA'`
 * para funcionar de forma fiable en teclados internacionales donde Alt+A
 * puede generar caracteres compuestos, evitando falsos positivos con Ctrl/Meta.
 */
export function isOpenShortcut(event) {
    if (!event || event.repeat || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return false;
    }
    const key = typeof event.key === 'string' ? event.key.toLowerCase() : '';
    const code = typeof event.code === 'string' ? event.code : '';
    return key === 'a' || code === 'KeyA';
}

const SENSITIVE_CATEGORIES = new Set([
    'password',
    'payment-card',
    'payment-expiry',
    'payment-cvc',
    'sensitive'
]);

const SENSITIVE_AUTOCOMPLETE_MAP = Object.freeze({
    'current-password': 'password',
    'new-password': 'password',
    'cc-number': 'payment-card',
    'cc-exp': 'payment-expiry',
    'cc-exp-month': 'payment-expiry',
    'cc-exp-year': 'payment-expiry',
    'cc-csc': 'payment-cvc',
    'one-time-code': 'sensitive',
    'cc-name': 'sensitive',
    'cc-given-name': 'sensitive',
    'cc-additional-name': 'sensitive',
    'cc-family-name': 'sensitive',
    'cc-type': 'sensitive'
});

const SENSITIVE_METADATA_RULES = Object.freeze([
    {
        category: 'payment-cvc',
        pattern: /(card[-_\s]?cv[cv]|card[-_\s]?csc|cardcv[cv]|\bcv[cv]\b|\bcsc\b|codigo[-_\s]?de[-_\s]?seguridad)/i
    },
    {
        category: 'payment-expiry',
        pattern: /(card[-_\s]?exp(?:ir(?:y|ation))?|cardexpiry|vencimiento|fecha[-_\s]?exp|exp[-_\s]?date)/i
    },
    {
        category: 'payment-card',
        pattern: /(card[-_\s]?num(?:ber)?|cardnumber|numero[-_\s]?de[-_\s]?tarjeta|credit[-_\s]?card|debit[-_\s]?card|\bpan\b)/i
    },
    {
        category: 'password',
        pattern: /(password|passwd|passcode|contrasena|\bpwd\b|\bclave\b)/i
    },
    {
        category: 'sensitive',
        pattern: /(secret|token|api[-_\s]?key|auth[-_\s]?code|security[-_\s]?code|\botp\b|\bmfa\b|\b2fa\b|\bpin[-_\s]?code\b|\bpin\b)/i
    }
]);

const SKIP_CONTAINER_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG']);

function getAttr(element, name) {
    return typeof element?.getAttribute === 'function' ? element.getAttribute(name) || '' : '';
}

function normalizeMetadataText(raw) {
    return String(raw || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();
}

function classifyExplicitAttribute(element) {
    if (!element) return null;
    const explicit = getAttr(element, 'data-a11y-sensitive').trim().toLowerCase();
    if (explicit && explicit !== 'false' && explicit !== '0') {
        return SENSITIVE_CATEGORIES.has(explicit) ? explicit : 'sensitive';
    }
    const legacySensitive = getAttr(element, 'data-sensitive').trim().toLowerCase();
    const legacyPrivate = getAttr(element, 'data-private').trim().toLowerCase();
    if (
        legacySensitive === 'true' ||
        legacySensitive === '1' ||
        legacyPrivate === 'true' ||
        legacyPrivate === '1'
    ) {
        return 'sensitive';
    }
    return null;
}

/**
 * Clasifica si un elemento o control contiene información confidencial
 * (contraseñas visibles u ocultas, tarjetas, vencimientos, CVC, códigos OTP, tokens).
 * Evalúa múltiples capas independientes y nunca depende únicamente de `type`.
 */
export function classifySensitiveField(element) {
    if (!element) return null;

    // Capa A: atributo explícito en el propio elemento o en un contenedor ancestro
    const selfExplicit = classifyExplicitAttribute(element);
    if (selfExplicit) return selfExplicit;

    if (typeof element.closest === 'function') {
        try {
            const sensitiveAncestor = element.closest(
                '[data-a11y-sensitive]:not([data-a11y-sensitive="false"]):not([data-a11y-sensitive="0"]), [data-sensitive="true"], [data-sensitive="1"], [data-private="true"], [data-private="1"]'
            );
            if (sensitiveAncestor && sensitiveAncestor !== element) {
                return classifyExplicitAttribute(sensitiveAncestor) || 'sensitive';
            }
        } catch {
            // Ignorar selectores no soportados en mocks mínimos
        }
    }

    // Capa B: tipo password (actual o declarado en atributo)
    const tag = typeof element.tagName === 'string' ? element.tagName.toUpperCase() : '';
    const inputType = (getAttr(element, 'type') || element.type || '').toLowerCase();
    if (inputType === 'password') {
        return 'password';
    }

    // Capa C: tokens estándar WHATWG de autocomplete
    const autocompleteRaw =
        getAttr(element, 'autocomplete') ||
        (typeof element.autocomplete === 'string' ? element.autocomplete : '');
    if (autocompleteRaw) {
        const tokens = autocompleteRaw.toLowerCase().trim().split(/\s+/);
        for (const token of tokens) {
            if (Object.prototype.hasOwnProperty.call(SENSITIVE_AUTOCOMPLETE_MAP, token)) {
                return SENSITIVE_AUTOCOMPLETE_MAP[token];
            }
        }
    }

    // Capa D: botón asociado "Mostrar contraseña" aunque el input haya cambiado a type="text"
    if (element.id && typeof element.ownerDocument?.querySelector === 'function') {
        try {
            const escapedId = String(element.id).replace(/["\\]/g, '\\$&');
            const toggleMatch = element.ownerDocument.querySelector(
                `[data-target="${escapedId}"].foodjet-password-toggle`
            );
            if (toggleMatch) {
                return 'password';
            }
        } catch {
            // Ignorar selectores inválidos
        }
    }

    // Capa E: identificadores y metadatos en controles de entrada o elementos editables
    const isInputControl = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    const isEditable =
        Boolean(element.isContentEditable) ||
        getAttr(element, 'contenteditable').trim().toLowerCase() === 'true';

    if (isInputControl || isEditable) {
        const metadata = normalizeMetadataText(
            [
                element.id,
                getAttr(element, 'id'),
                element.name,
                getAttr(element, 'name'),
                getAttr(element, 'aria-label'),
                getAttr(element, 'placeholder')
            ]
                .filter(Boolean)
                .join(' ')
        );
        if (metadata) {
            for (const rule of SENSITIVE_METADATA_RULES) {
                if (rule.pattern.test(metadata)) {
                    return rule.category;
                }
            }
        }
    }

    return null;
}

/**
 * Devuelve true cuando el elemento o su contenedor clasifica como confidencial.
 */
export function isSensitiveField(element) {
    return Boolean(classifySensitiveField(element));
}

function resolveFieldLabel(element) {
    let labelText = getAttr(element, 'aria-label');

    if (!labelText && element.id && typeof element.ownerDocument?.querySelector === 'function') {
        try {
            const escapedId = String(element.id).replace(/["\\]/g, '\\$&');
            const associatedLabel = element.ownerDocument.querySelector(`label[for="${escapedId}"]`);
            labelText = associatedLabel?.innerText || associatedLabel?.textContent || '';
        } catch {
            // Ignorar selectores inválidos
        }
    }

    if (!labelText) {
        labelText = getAttr(element, 'placeholder') || getAttr(element, 'title') || getAttr(element, 'name') || '';
    }

    return labelText.replace(/\s+/g, ' ').trim();
}

function formatSensitiveAnnouncement(category, labelText, { isContainer = false } = {}) {
    if (isContainer) {
        return labelText ? `${labelText} (contenido confidencial)` : 'Contenido confidencial';
    }
    switch (category) {
        case 'password':
            return labelText ? `${labelText} (campo de contraseña)` : 'Campo de contraseña';
        case 'payment-card':
            return labelText ? `${labelText} (campo confidencial de tarjeta)` : 'Campo confidencial de tarjeta';
        case 'payment-expiry':
            return labelText ? `${labelText} (campo confidencial de vencimiento)` : 'Campo confidencial de vencimiento';
        case 'payment-cvc':
            return labelText
                ? `${labelText} (campo confidencial de código de seguridad)`
                : 'Campo confidencial de código de seguridad';
        default:
            return labelText ? `${labelText} (campo confidencial)` : 'Campo confidencial';
    }
}

function isHiddenElement(element, win) {
    if (!element) return true;
    const tag = typeof element.tagName === 'string' ? element.tagName.toUpperCase() : '';
    if (SKIP_CONTAINER_TAGS.has(tag)) return true;
    if (element.id === 'a11yWidgetContainer') return true;
    if (element.hidden === true) return true;
    if (typeof element.hasAttribute === 'function' && element.hasAttribute('hidden')) return true;
    if (getAttr(element, 'aria-hidden').trim().toLowerCase() === 'true') return true;
    if (element.style?.display === 'none' || element.style?.visibility === 'hidden') return true;
    if (element.classList?.contains?.('d-none')) return true;

    if (typeof win?.getComputedStyle === 'function') {
        try {
            const computed = win.getComputedStyle(element);
            if (computed && (computed.display === 'none' || computed.visibility === 'hidden')) {
                return true;
            }
        } catch {
            // Ignorar nodos sin estilo computado
        }
    }
    return false;
}

function collectSafeContainerText(root, win) {
    const parts = [];

    const walk = (node) => {
        if (!node) return;
        if (node.nodeType === 3) {
            const text = String(node.nodeValue || '').replace(/\s+/g, ' ').trim();
            if (text) parts.push(text);
            return;
        }
        if (node.nodeType !== 1 && typeof node.tagName !== 'string') return;
        if (isHiddenElement(node, win)) return;

        const tag = typeof node.tagName === 'string' ? node.tagName.toUpperCase() : '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
            const inputType = (getAttr(node, 'type') || node.type || '').toLowerCase();
            if (inputType === 'hidden') return;
            const text = extractReadableText(node, win);
            if (text) parts.push(text);
            return;
        }

        const sensitiveKind = classifySensitiveField(node);
        if (sensitiveKind) {
            parts.push(
                formatSensitiveAnnouncement(sensitiveKind, getAttr(node, 'aria-label').trim(), {
                    isContainer: true
                })
            );
            return;
        }

        const children = node.childNodes || [];
        for (let i = 0; i < children.length; i += 1) {
            walk(children[i]);
        }
    };

    if (isHiddenElement(root, win)) return '';
    const children = root.childNodes || [];
    for (let i = 0; i < children.length; i += 1) {
        walk(children[i]);
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Normaliza texto para lectura asistida por voz, priorizando etiquetas ARIA
 * cuando el elemento carece de texto visible y protegiendo campos y contenedores
 * confidenciales para no exponer contraseñas, tarjetas, vencimientos ni CVC.
 */
export function extractReadableText(element, win = globalThis.window) {
    if (!element) return '';

    const tag = typeof element.tagName === 'string' ? element.tagName.toUpperCase() : '';

    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        const inputType = (getAttr(element, 'type') || element.type || '').toLowerCase();
        const labelText = resolveFieldLabel(element);
        const sensitiveKind = classifySensitiveField(element);

        if (sensitiveKind) {
            return formatSensitiveAnnouncement(sensitiveKind, labelText);
        }

        if (tag === 'SELECT') {
            const selectedOption =
                element.options && typeof element.selectedIndex === 'number'
                    ? element.options[element.selectedIndex]
                    : null;
            const selectedText = (selectedOption?.textContent || '').replace(/\s+/g, ' ').trim();
            return [labelText, selectedText].filter(Boolean).join(': ');
        }

        if (inputType === 'file') {
            return labelText ? `${labelText} (selector de archivo)` : 'Selector de archivo';
        }

        if (inputType === 'checkbox' || inputType === 'radio') {
            const stateLabel = element.checked ? 'seleccionado' : 'no seleccionado';
            return labelText ? `${labelText}, ${stateLabel}` : stateLabel;
        }

        const valueText =
            typeof element.value === 'string' ? element.value.replace(/\s+/g, ' ').trim() : '';
        if (inputType === 'submit' || inputType === 'button' || inputType === 'reset') {
            return labelText || valueText;
        }

        return [labelText, valueText].filter(Boolean).join(': ');
    }

    const sensitiveKind = classifySensitiveField(element);
    if (sensitiveKind) {
        const labelText = getAttr(element, 'aria-label').replace(/\s+/g, ' ').trim();
        return formatSensitiveAnnouncement(sensitiveKind, labelText, { isContainer: true });
    }

    if (element.childNodes && element.childNodes.length > 0) {
        const safeText = collectSafeContainerText(element, win);
        if (safeText) return safeText;
        const fallbackAria = getAttr(element, 'aria-label') || getAttr(element, 'alt');
        return fallbackAria.replace(/\s+/g, ' ').trim();
    }

    const rawText =
        typeof element.innerText === 'string' && element.innerText.trim()
            ? element.innerText
            : typeof element.textContent === 'string' && element.textContent.trim()
                ? element.textContent
                : '';

    const ariaLabel = getAttr(element, 'aria-label') || getAttr(element, 'alt');

    const candidate = rawText || ariaLabel;
    return candidate.replace(/\s+/g, ' ').trim();
}

/**
 * Selecciona exclusivamente una voz local (`localService === true`) con prioridad
 * para español (es-PE, variantes es-419/ES/MX/CO/AR/CL/US, cualquier es-*).
 * Nunca devuelve voces remotas ni permite selección implícita sin localService === true.
 */
export function selectLocalVoice(voices) {
    if (!Array.isArray(voices) || voices.length === 0) return null;
    const localVoices = voices.filter((v) => Boolean(v) && v.localService === true);
    if (localVoices.length === 0) return null;

    return (
        localVoices.find((v) => /^es[-_]PE/i.test(v.lang || '')) ||
        localVoices.find((v) => /^es[-_](419|ES|MX|CO|AR|CL|US)/i.test(v.lang || '')) ||
        localVoices.find((v) => /^es(?:[-_]|$)/i.test(v.lang || '')) ||
        localVoices.find((v) => v.default === true) ||
        localVoices[0]
    );
}

/**
 * Evalúa disponibilidad de síntesis local distinguiendo ausencia total de voces
 * frente a entornos donde solo existen voces remotas.
 */
export function classifyVoiceAvailability(voices) {
    if (!Array.isArray(voices) || voices.length === 0) {
        return { available: false, voice: null, reason: 'none' };
    }
    const voice = selectLocalVoice(voices);
    if (voice) {
        return { available: true, voice, reason: 'ok' };
    }
    return { available: false, voice: null, reason: 'remote-only' };
}
