/**
 * Validaciones de formulario compartidas.
 *
 * Funciones puras, sin DOM: se importan tal cual desde las pruebas.
 */

/** El backend exige exactamente 9 dígitos (authController). */
export const LONGITUD_TELEFONO = 9;

/**
 * Deja solo lo que puede formar parte de un teléfono válido.
 *
 * Se aplica mientras el usuario escribe: descarta cualquier carácter que no
 * sea un dígito y recorta lo que sobre. Antes el campo aceptaba letras y
 * cualquier longitud, y el registro fallaba después en el servidor sin que la
 * interfaz hubiera advertido nada.
 */
export function sanitizePhone(valor) {
    return String(valor ?? '').replace(/\D/g, '').slice(0, LONGITUD_TELEFONO);
}

/** @returns {{valid: boolean, error?: string}} */
export function validatePhone(valor) {
    const limpio = String(valor ?? '').trim();

    if (!limpio) {
        return { valid: false, error: 'Ingresa tu número de teléfono.' };
    }

    if (/\D/.test(limpio)) {
        return { valid: false, error: 'El teléfono solo puede contener números.' };
    }

    if (limpio.length !== LONGITUD_TELEFONO) {
        return { valid: false, error: `El teléfono debe tener exactamente ${LONGITUD_TELEFONO} dígitos.` };
    }

    return { valid: true };
}
