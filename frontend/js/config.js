/**
 * Configuración del frontend.
 *
 * Se carga como script clásico ANTES que legacy.js y app.js, de modo que
 * ambos leen la misma URL de la API.
 *
 * La ruta es RELATIVA a propósito: el proxy sirve el frontend y la API bajo el
 * mismo origen, así que "/api" funciona igual en local (localhost:8081) que
 * publicado (https://foodjet.asen.pe). Antes esto era un
 * "http://localhost:3000/api" fijo, que en el navegador de un visitante
 * apuntaría a su propia máquina y no al servidor.
 *
 * Para apuntar a otro backend basta con definir window.FOODJET_API_URL antes
 * de este script.
 */
window.FOODJET_API_URL = window.FOODJET_API_URL || '/api';
