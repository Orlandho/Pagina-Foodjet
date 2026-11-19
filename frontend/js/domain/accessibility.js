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

/**
 * Normaliza texto para lectura asistida por voz, priorizando etiquetas ARIA
 * cuando el elemento carece de texto visible y soportando controles de formulario
 * sin exponer valores de campos de contraseña.
 */
export function extractReadableText(element) {
    if (!element) return '';

    const tag = typeof element.tagName === 'string' ? element.tagName.toUpperCase() : '';
    const getAttr = (name) =>
        typeof element.getAttribute === 'function' ? element.getAttribute(name) || '' : '';

    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        const inputType = (getAttr('type') || element.type || '').toLowerCase();
        let labelText = getAttr('aria-label');

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
            labelText = getAttr('placeholder') || getAttr('title') || getAttr('name') || '';
        }

        labelText = labelText.replace(/\s+/g, ' ').trim();

        if (tag === 'SELECT') {
            const selectedOption =
                element.options && typeof element.selectedIndex === 'number'
                    ? element.options[element.selectedIndex]
                    : null;
            const selectedText = (selectedOption?.textContent || '').replace(/\s+/g, ' ').trim();
            return [labelText, selectedText].filter(Boolean).join(': ');
        }

        if (inputType === 'password') {
            return labelText ? `${labelText} (campo de contraseña)` : 'Campo de contraseña';
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

    const rawText =
        typeof element.innerText === 'string' && element.innerText.trim()
            ? element.innerText
            : typeof element.textContent === 'string' && element.textContent.trim()
                ? element.textContent
                : '';

    const ariaLabel = getAttr('aria-label') || getAttr('alt');

    const candidate = rawText || ariaLabel;
    return candidate.replace(/\s+/g, ' ').trim();
}
