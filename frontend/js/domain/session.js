/**
 * Estado de la sesión del usuario.
 *
 * Funciones puras, sin DOM ni red: se importan tal cual desde las pruebas.
 */

/**
 * Devuelve el contenido de un JWT sin verificar la firma.
 *
 * Verificar la firma es cosa del backend, que es quien tiene el secreto. Aquí
 * solo se lee la carga útil para saber si el token ya caducó y evitar así
 * mandar una petición que sabemos que va a fallar.
 */
export function decodeJwtPayload(token) {
    if (typeof token !== 'string') return null;

    const partes = token.split('.');
    if (partes.length !== 3) return null;

    try {
        const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
        const relleno = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
        return JSON.parse(atob(relleno));
    } catch {
        return null;
    }
}

/**
 * ¿El token ya no sirve?
 *
 * Un token ilegible cuenta como caducado: si no se puede leer, tampoco se
 * puede confiar en él.
 */
export function isTokenExpired(token, nowMs = Date.now()) {
    const payload = decodeJwtPayload(token);

    if (!payload || typeof payload.exp !== 'number') return true;

    return payload.exp * 1000 <= nowMs;
}

/** ¿La respuesta del servidor indica que la sesión ya no vale? */
export function isAuthFailure(status) {
    return status === 401 || status === 403;
}
