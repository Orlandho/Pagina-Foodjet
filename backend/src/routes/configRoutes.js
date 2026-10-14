const express = require('express');
const router = express.Router();

/**
 * Configuración pública que necesita el navegador.
 *
 * La key de Google Maps vive en .env y no en el código: así cada entorno usa
 * la suya y no queda en el historial del repositorio. Entregarla aquí no la
 * expone más de lo que ya está: Google exige cargarla en el navegador, y lo
 * que la protege es la restricción por dominio configurada en Google Cloud.
 */
router.get('/', (req, res) => {
    res.json({
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || null
    });
});

module.exports = router;
