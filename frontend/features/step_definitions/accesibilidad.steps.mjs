import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import fs from 'node:fs';
import path from 'node:path';
import {
    STORAGE_KEY,
    classifyVoiceAvailability,
    clearPreferences,
    countActiveAdjustments,
    createDefaultPreferences,
    extractReadableText,
    isOpenShortcut,
    loadPreferences,
    sanitizePreferences,
    savePreferences,
    stepFontScale
} from '../../js/domain/accessibility.js';
import { splitTextForSpeech } from '../../js/accessibility.js';

function createMemoryStorage() {
    const map = new Map();
    return {
        getItem: (k) => (map.has(k) ? map.get(k) : null),
        setItem: (k, v) => { map.set(k, String(v)); },
        removeItem: (k) => { map.delete(k); }
    };
}

Given('el código fuente del frontend de FoodJet', function () {
    this.indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
    this.stylesCss = fs.readFileSync(path.resolve('frontend/styles.css'), 'utf8');
    this.appJs = fs.readFileSync(path.resolve('frontend/js/app.js'), 'utf8');
});

When('verifico la presencia estructural del componente de accesibilidad', function () {
    this.a11yChecked = true;
});

Then('el botón flotante azul de accesibilidad existe con sus atributos ARIA', function () {
    expect(this.indexHtml).to.include('id="a11yWidgetContainer"');
    expect(this.indexHtml).to.include('id="a11yToggleBtn"');
    expect(this.indexHtml).to.include('id="a11yPanel"');
    expect(this.indexHtml).to.include('aria-haspopup="dialog"');
    expect(this.indexHtml).to.include('aria-controls="a11yPanel"');
    expect(this.indexHtml).to.include('role="dialog"');
    expect(this.indexHtml).to.include('id="a11yLiveRegion"');
    expect(this.stylesCss).to.include('.a11y-fab');
    expect(this.stylesCss).to.include('#0052CC');
});

Then('los filtros SVG para protanopia, deuteranopia y tritanopia están definidos localmente', function () {
    expect(this.indexHtml).to.include('id="a11y-filter-protanopia"');
    expect(this.indexHtml).to.include('id="a11y-filter-deuteranopia"');
    expect(this.indexHtml).to.include('id="a11y-filter-tritanopia"');
    expect(this.stylesCss).to.include('url(#a11y-filter-protanopia)');
    expect(this.stylesCss).to.include('url(#a11y-filter-deuteranopia)');
    expect(this.stylesCss).to.include('url(#a11y-filter-tritanopia)');
});

Then('la aplicación inicializa el módulo de accesibilidad sin cuentas ficticias ni CDN de UserWay', function () {
    expect(this.appJs).to.include('initAccessibility');
    expect(this.indexHtml).to.not.include('REPLACE_WITH_YOUR_ACCOUNT_ID');
    expect(this.indexHtml).to.not.include('cdn.userway.org');
});

When('evalúo el atajo de teclado con Alt presionado y tecla {string}', function (key) {
    this.shortcutValid = isOpenShortcut({ altKey: true, ctrlKey: false, metaKey: false, shiftKey: false, repeat: false, key, code: `Key${key.toUpperCase()}` });
});

When('evalúo el atajo de teclado repetido con Alt presionado y tecla {string}', function (key) {
    this.shortcutValid = isOpenShortcut({ altKey: true, ctrlKey: false, metaKey: false, shiftKey: false, repeat: true, key, code: `Key${key.toUpperCase()}` });
});

When('evalúo el atajo de teclado con Ctrl y Alt presionados y tecla {string}', function (key) {
    this.shortcutValid = isOpenShortcut({ altKey: true, ctrlKey: true, metaKey: false, key, code: `Key${key.toUpperCase()}` });
});

Then('el atajo de apertura es reconocido como válido', function () {
    expect(this.shortcutValid).to.equal(true);
});

Then('el atajo de apertura es rechazado', function () {
    expect(this.shortcutValid).to.equal(false);
});

Given('las preferencias de accesibilidad en su estado inicial', function () {
    this.prefs = createDefaultPreferences();
});

When('aumento la escala tipográfica {int} veces consecutivas', function (veces) {
    for (let i = 0; i < veces; i += 1) {
        this.prefs.fontScale = stepFontScale(this.prefs.fontScale, 1);
    }
});

When('intento aumentar la escala tipográfica nuevamente', function () {
    this.prefs.fontScale = stepFontScale(this.prefs.fontScale, 1);
});

When('reduzco la escala tipográfica {int} veces consecutivas', function (veces) {
    for (let i = 0; i < veces; i += 1) {
        this.prefs.fontScale = stepFontScale(this.prefs.fontScale, -1);
    }
});

Then('la escala tipográfica resultante es {int} por ciento', function (esperado) {
    expect(this.prefs.fontScale).to.equal(esperado);
});

When('normalizo preferencias con el filtro de daltonismo {string}', function (filtro) {
    this.prefs = sanitizePreferences({ colorFilter: filtro });
});

Then('el filtro normalizado es {string}', function (esperado) {
    expect(this.prefs.colorFilter).to.equal(esperado);
});

Given('un almacenamiento local limpio', function () {
    this.storage = createMemoryStorage();
});

When(
    'guardo preferencias con alto contraste, dislexia, sin animaciones, filtro {string}, lectura por voz y escala {int}',
    function (filtro, escala) {
        this.savedResult = savePreferences(
            {
                highContrast: true,
                dyslexiaFont: true,
                reducedMotion: true,
                colorFilter: filtro,
                voiceReader: true,
                fontScale: escala,
                keyboardFocus: false,
                speechRate: 1.25
            },
            this.storage
        );
        expect(this.savedResult.ok).to.equal(true);
    }
);

When('cargo nuevamente las preferencias desde el almacenamiento local', function () {
    this.loadedPrefs = loadPreferences(this.storage);
});

Then('las preferencias restauradas conservan todos los ajustes activos', function () {
    expect(this.loadedPrefs.highContrast).to.equal(true);
    expect(this.loadedPrefs.dyslexiaFont).to.equal(true);
    expect(this.loadedPrefs.reducedMotion).to.equal(true);
    expect(this.loadedPrefs.colorFilter).to.equal('deuteranopia');
    expect(this.loadedPrefs.voiceReader).to.equal(true);
    expect(this.loadedPrefs.fontScale).to.equal(175);
    expect(this.loadedPrefs.speechRate).to.equal(1.25);
});

Then('el contador de ajustes activos es {int}', function (cantidad) {
    expect(countActiveAdjustments(this.loadedPrefs)).to.equal(cantidad);
});

When('restablezco las preferencias guardadas', function () {
    clearPreferences(this.storage);
    this.loadedPrefs = loadPreferences(this.storage);
});

Then('las preferencias restauradas vuelven a los valores predeterminados', function () {
    expect(this.loadedPrefs).to.deep.equal(createDefaultPreferences());
});

Given('un almacenamiento local con JSON corrupto', function () {
    this.storage = createMemoryStorage();
    this.storage.setItem(STORAGE_KEY, '{corrupto!!!');
});

Given('un almacenamiento local bloqueado que lanza errores', function () {
    this.storage = {
        getItem() { throw new Error('SecurityError'); },
        setItem() { throw new Error('QuotaExceededError'); },
        removeItem() { throw new Error('SecurityError'); }
    };
});

When('intento guardar preferencias de accesibilidad', function () {
    this.saveOutcome = savePreferences({ highContrast: true }, this.storage);
});

Then('el guardado falla de forma controlada sin lanzar excepciones', function () {
    expect(this.saveOutcome.ok).to.equal(false);
    expect(this.saveOutcome.prefs.highContrast).to.equal(true);
});

When('extraigo texto legible de un botón sin texto visible pero con aria-label {string}', function (label) {
    const fakeEl = {
        innerText: '   ',
        textContent: '',
        getAttribute: (name) => (name === 'aria-label' ? label : null)
    };
    this.extractedText = extractReadableText(fakeEl);
});

When('extraigo texto legible de un campo de contraseña con etiqueta {string} y valor secreto', function (label) {
    const fakePwd = {
        tagName: 'INPUT',
        type: 'password',
        value: 'MiClavePrivada123!',
        getAttribute: (name) => (name === 'aria-label' ? label : name === 'type' ? 'password' : null)
    };
    this.extractedText = extractReadableText(fakePwd);
});

Then('el texto extraído es {string}', function (esperado) {
    expect(this.extractedText).to.equal(esperado);
});

When('segmento un párrafo largo de 500 caracteres para síntesis de voz', function () {
    const sentence = 'FoodJet entrega tus platos favoritos rápido y caliente hasta tu puerta. ';
    const longText = sentence.repeat(8);
    expect(longText.length).to.be.greaterThan(500);
    this.speechChunks = splitTextForSpeech(longText, 220);
});

Then('todos los fragmentos tienen como máximo {int} caracteres', function (maxLen) {
    expect(this.speechChunks.length).to.be.greaterThan(1);
    for (const chunk of this.speechChunks) {
        expect(chunk.length).to.be.at.most(maxLen);
    }
});

When('extraigo texto legible de una contraseña mostrada temporalmente como texto con etiqueta {string}', function (label) {
    this.secretSample = 'ClaveFicticia#2026';
    const fakeVisiblePwd = {
        tagName: 'INPUT',
        id: 'loginPassword',
        type: 'text',
        value: this.secretSample,
        getAttribute: (name) =>
            name === 'aria-label'
                ? label
                : name === 'type'
                    ? 'text'
                    : name === 'autocomplete'
                        ? 'current-password'
                        : name === 'data-a11y-sensitive'
                            ? 'password'
                            : null
    };
    this.extractedText = extractReadableText(fakeVisiblePwd);
});

Then('el texto extraído no expone datos confidenciales y conserva {string}', function (expectedKind) {
    expect(this.extractedText).to.not.include(this.secretSample);
    expect(this.extractedText).to.include(expectedKind);
});

When('extraigo texto legible de un campo de número de tarjeta con dato ficticio', function () {
    this.cardSecret = '4111 1111 1111 1111';
    this.extractedText = extractReadableText({
        tagName: 'INPUT',
        id: 'cardNumber',
        type: 'text',
        value: this.cardSecret,
        getAttribute: (name) =>
            name === 'aria-label'
                ? 'Número de tarjeta'
                : name === 'autocomplete'
                    ? 'cc-number'
                    : name === 'data-a11y-sensitive'
                        ? 'payment-card'
                        : null
    });
});

Then('el texto extraído no expone el número de tarjeta y anuncia {string}', function (expectedKind) {
    expect(this.extractedText).to.not.include('4111');
    expect(this.extractedText).to.include(expectedKind);
});

When('extraigo texto legible de un campo de vencimiento con dato ficticio', function () {
    this.expSecret = '12/29';
    this.extractedText = extractReadableText({
        tagName: 'INPUT',
        id: 'cardExpiry',
        type: 'text',
        value: this.expSecret,
        getAttribute: (name) =>
            name === 'aria-label'
                ? 'Vencimiento'
                : name === 'autocomplete'
                    ? 'cc-exp'
                    : name === 'data-a11y-sensitive'
                        ? 'payment-expiry'
                        : null
    });
});

Then('el texto extraído no expone la fecha y anuncia {string}', function (expectedKind) {
    expect(this.extractedText).to.not.include(this.expSecret);
    expect(this.extractedText).to.include(expectedKind);
});

When('extraigo texto legible de un campo CVC con dato ficticio', function () {
    this.cvcSecret = '999';
    this.extractedText = extractReadableText({
        tagName: 'INPUT',
        id: 'cardCvc',
        type: 'text',
        value: this.cvcSecret,
        getAttribute: (name) =>
            name === 'aria-label'
                ? 'CVC / CVV'
                : name === 'autocomplete'
                    ? 'cc-csc'
                    : name === 'data-a11y-sensitive'
                        ? 'payment-cvc'
                        : null
    });
});

Then('el texto extraído no expone el CVC y anuncia {string}', function (expectedKind) {
    expect(this.extractedText).to.not.include(this.cvcSecret);
    expect(this.extractedText).to.include(expectedKind);
});

When('evalúo voces donde todas son remotas', function () {
    this.voiceResult = classifyVoiceAvailability([
        { lang: 'es-PE', name: 'Google Español Remota', localService: false },
        { lang: 'es-ES', name: 'Cloud Voice', localService: false }
    ]);
});

When('evalúo una lista vacía de voces', function () {
    this.voiceResult = classifyVoiceAvailability([]);
});

When('evalúo voces mixtas con una voz remota en español y una voz local en español', function () {
    this.voiceResult = classifyVoiceAvailability([
        { lang: 'es-PE', name: 'Google Remota', localService: false },
        { lang: 'es-PE', name: 'Microsoft Raúl Local', localService: true }
    ]);
});

Then('ninguna voz es seleccionada y el motivo es {string}', function (motivo) {
    expect(this.voiceResult.available).to.equal(false);
    expect(this.voiceResult.voice).to.equal(null);
    expect(this.voiceResult.reason).to.equal(motivo);
});

Then('se selecciona únicamente la voz local en español', function () {
    expect(this.voiceResult.available).to.equal(true);
    expect(this.voiceResult.voice.localService).to.equal(true);
    expect(this.voiceResult.voice.name).to.equal('Microsoft Raúl Local');
});
