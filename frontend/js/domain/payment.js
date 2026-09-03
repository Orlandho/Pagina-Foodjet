/**
 * Validación de datos de tarjeta.
 *
 * Todo son funciones puras, sin DOM: se importan tal cual desde las pruebas.
 *
 * Importante: el número de tarjeta NUNCA sale del navegador. Se valida aquí
 * para dar retroalimentación inmediata y el pedido viaja al backend solo con
 * metodo_pago: 'card'. La autorización bancaria está simulada; cumplir
 * PCI-DSS queda fuera del alcance del proyecto.
 */

/** Algoritmo de Luhn: descarta números mal tecleados antes de enviarlos. */
export function luhnCheck(numero) {
    const digitos = String(numero || '').replace(/\D/g, '');
    if (digitos.length < 12) return false;

    let suma = 0;
    let duplicar = false;

    for (let i = digitos.length - 1; i >= 0; i--) {
        let d = Number(digitos[i]);

        if (duplicar) {
            d *= 2;
            if (d > 9) d -= 9;
        }

        suma += d;
        duplicar = !duplicar;
    }

    return suma % 10 === 0;
}

export function detectBrand(numero) {
    const d = String(numero || '').replace(/\D/g, '');

    if (/^4/.test(d)) return 'visa';
    if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(d)) return 'mastercard';
    if (/^3[47]/.test(d)) return 'amex';

    return 'desconocida';
}

export function validateNumber(numero) {
    const d = String(numero || '').replace(/\D/g, '');
    const marca = detectBrand(d);
    const largoEsperado = marca === 'amex' ? 15 : 16;

    if (!d) return { valid: false, error: 'Ingresa el número de tarjeta.' };
    if (d.length !== largoEsperado) {
        return { valid: false, error: `El número debe tener ${largoEsperado} dígitos.` };
    }
    if (!luhnCheck(d)) return { valid: false, error: 'El número de tarjeta no es válido.' };

    return { valid: true, marca };
}

/** Acepta MM/AA. El mes de vencimiento cuenta completo. */
export function validateExpiry(valor, ahora = new Date()) {
    const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(String(valor || '').trim());
    if (!match) return { valid: false, error: 'Usa el formato MM/AA.' };

    const mes = Number(match[1]);
    const anio = 2000 + Number(match[2]);

    if (mes < 1 || mes > 12) return { valid: false, error: 'El mes debe estar entre 01 y 12.' };

    // Primer instante del mes siguiente: la tarjeta sirve todo su mes de vencimiento.
    const vence = new Date(anio, mes, 1);
    if (vence <= ahora) return { valid: false, error: 'La tarjeta está vencida.' };

    return { valid: true };
}

export function validateCvc(cvc, marca = 'desconocida') {
    const d = String(cvc || '').replace(/\D/g, '');
    const largo = marca === 'amex' ? 4 : 3;

    if (d.length !== largo) return { valid: false, error: `El CVC debe tener ${largo} dígitos.` };
    return { valid: true };
}

/** Valida la tarjeta completa y devuelve los errores por campo. */
export function validateCard({ numero, expiracion, cvc } = {}, ahora = new Date()) {
    const errors = {};

    const resNumero = validateNumber(numero);
    if (!resNumero.valid) errors.numero = resNumero.error;

    const resExpiracion = validateExpiry(expiracion, ahora);
    if (!resExpiracion.valid) errors.expiracion = resExpiracion.error;

    const resCvc = validateCvc(cvc, resNumero.marca || detectBrand(numero));
    if (!resCvc.valid) errors.cvc = resCvc.error;

    return { valid: Object.keys(errors).length === 0, errors, marca: detectBrand(numero) };
}

/** Máscara: agrupa el número en bloques de 4 mientras se escribe. */
export function formatCardNumber(valor) {
    const d = String(valor || '').replace(/\D/g, '').slice(0, 16);
    return d.replace(/(.{4})/g, '$1 ').trim();
}

/** Máscara: inserta la barra de MM/AA. */
export function formatExpiry(valor) {
    const d = String(valor || '').replace(/\D/g, '').slice(0, 4);
    if (d.length <= 2) return d;
    return `${d.slice(0, 2)}/${d.slice(2)}`;
}
