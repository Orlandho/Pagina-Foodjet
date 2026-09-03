/**
 * Configuración del frontend.
 *
 * Se carga como script clásico ANTES que legacy.js y app.js, de modo que
 * ambos leen la misma URL de la API. Antes la constante estaba duplicada en
 * js/api.js y js/legacy.js, y cambiar de puerto obligaba a editar las dos.
 *
 * Para apuntar a otro backend basta con definir window.FOODJET_API_URL antes
 * de este script, o editar el valor por defecto.
 */
window.FOODJET_API_URL = window.FOODJET_API_URL || 'http://localhost:3000/api';
