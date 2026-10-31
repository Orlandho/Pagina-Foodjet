# Original User Request

## Approved Task Prompt — 2026-10-29T22:48:56Z

Usa /teamwork con trabajo paralelo real: inspección de referencias/contratos, sistema visual y componentes, pantallas por grupos y verificación independiente. Implementa la actualización integral de la UI del frontend WEB de FoodJet en el proyecto existente sobre la rama `feat/UI-frontend-update`, conservando el backend PostgreSQL/Express/Prisma, sus contratos, reglas de negocio y datos. El prompt original completo de la solicitud sigue plenamente vigente y este documento lo estructura sin omitir requisitos.

Working directory: C:\Users\ORLANDO\Desktop\Pagina-Foodjet
Integrity mode: development

Reference material:
- Prototipo local (referencia de solo lectura): `C:\Users\ORLANDO\Desktop\ciclo 9\frontend para actualizar foodjet para app moviles y adm de proyec de software\proyecto-app-movil-UPN-2026-2-main`
- Figma: https://www.figma.com/design/kmCrgpRVegxmGl1hLsGGIp/FOODJET-BUSS-PROJ?node-id=0-1
- Nodo enlazado Figma: https://www.figma.com/design/kmCrgpRVegxmGl1hLsGGIp/FOODJET-BUSS-PROJ?node-id=3-8347
- Conversación de contexto: https://claude.ai/share/3bf821e8-f566-42fa-ba0a-febccd6bb8dc
- Prioridad de referencias: Intentar obtener los frames de Figma mediante las herramientas disponibles; si el diseño en línea de Figma no puede recuperarse o inspeccionarse con las herramientas disponibles, continuar con el prototipo local Android Kotlin/Compose como referencia visual primaria y documentar la limitación.

## Requirements

### R1. Rediseño visual responsivo del frontend WEB
Actualizar la presentación, composición, navegación y estado de UI en los cuatro flujos principales (Inicio, Carrito, Checkout, Seguimiento) y vistas secundarias (login/registro, cuenta y verificación de estudiante, favoritos, historial, reseñas, notificaciones, modales y panel de operaciones/admin). Adaptar el diseño móvil a escritorio mediante cuadrícula responsiva (ej. checkout de dos columnas) y en móvil a una columna con navegación cómoda, sin que barras fijas tapen contenido, teclado o mensajes. Distinguir la dirección del local de la dirección de entrega del usuario, usando en cabecera y checkout la dirección real disponible o un estado neutral.

### R2. Conservación estricta de arquitectura, contratos DOM y backend
Mantener la arquitectura existente (HTML, CSS, Bootstrap 5.3 y JavaScript vanilla con módulos ES) sin introducir React, Next, Vite, Tailwind, empaquetadores ni nuevas capas de servicios. Conservar contratos de backend PostgreSQL/Express/Prisma, llamadas relativas a `/api` en el mismo origen, módulos `frontend/js/domain/`, contratos DOM (IDs, data attributes, eventos, formularios) y puentes globales (`window.FoodJetSession`, `window.FoodJetMapas`, `window.FoodJetValidation`). No modificar `backend/`, esquemas de Prisma, migraciones, seeds, Docker Compose ni configuración de Caddy; usar el entorno local sin operaciones destructivas ni cambios en producción.

### R3. Sistema de tokens de diseño y accesibilidad WCAG
Extraer e implementar un sistema coherente de tokens CSS para color, tipografía, espaciado, radios de borde, bordes, elevación y estados, basado en la paleta de referencia (naranja #F4511E, énfasis #D94310, durazno #FCF0E4, fondo #F8F8F4, texto #1C1C1C, gris #6B6B66, borde #E6E4DC) ajustada para contraste WCAG. Asegurar navegación por teclado, foco visible, etiquetas de formulario, compatibilidad con lectores de pantalla, zoom 200 %, reducción de movimiento y ausencia total de desbordamiento horizontal.

### R4. Vinculación con datos reales, búsqueda integrada y comportamiento honesto
Conectar los controles visuales a datos reales del backend (nombres de productos, precios, direcciones de tiendas, tiempos estimados de entrega, cupones válidos `PruebaCupon` y `FOODJET20`, descuento de estudiante y flujos simulados de pago). Incluir buscador funcional en Inicio combinado con categorías y filtros, contemplando cero resultados, carga, error y reintento. En Seguimiento, reflejar el estado real de conexión y actualización en "Actualizando en vivo", manteniendo polling, animación, cancelación permitida, estados terminales y reconexión ante fallos. Omitir o adaptar honestamente controles que no tengan soporte en el backend sin inventar calificaciones, repartidores, soporte o chat.

### R5. Línea base, verificación integral, evidencia y entrega
Registrar la línea base antes de modificar archivos. Verificar la solución contra el backend local Docker Compose (http://localhost:8081) en anchos de 360, 390, 768, 1280 y 1440 px para perfiles invitado, cliente regular, estudiante y administrador, comprobando cancelación de QR, cupones inválidos, sesión expirada y fallback sin mapa. Ejecutar `npm test` y `npm run test:unit` asegurando cero regresiones, conservando `reports/cucumber.html` y capturando evidencia visual (screenshots). Entregar los cambios revisables acotados al alcance en la rama `feat/UI-frontend-update`, conservando el trabajo previo del usuario, sin commits automáticos, push, merge ni despliegue.

## Acceptance Criteria

### Sistema Visual y Adaptación Responsiva
- [ ] Sistema de tokens CSS implementado y aplicado consistentemente en Inicio, Carrito, Checkout, Seguimiento y vistas secundarias.
- [ ] En pantallas de escritorio (>= 1280px), las vistas aprovechan el ancho con composición multi-columna sin barras de scroll horizontal.
- [ ] En pantallas móviles (360px y 390px), la composición es de una sola columna y las barras fijas no obstruyen contenido, campos de entrada ni botones.
- [ ] Las combinaciones de color de texto sobre fondo cumplen con los ratios de contraste mínimo de WCAG AA.
- [ ] La interfaz soporta zoom al 200 % y reducción de movimiento sin perder legibilidad ni funcionalidad.
- [ ] Se capturan evidencias visuales (screenshots) en 360, 390, 768, 1280 y 1440 px para los cuatro flujos principales y vistas secundarias modificadas.

### Flujos Principales y Conexión Funcional
- [ ] Inicio: Muestra marca FOODJET, favoritos, contador de carrito reactivo, dirección de entrega real o neutral (sin copiar direcciones fijas del prototipo), titular "Tu antojo. Sin escalas.", categorías, filtros, buscador funcional combinado (con estados de carga, error, reintento y cero resultados) y botón "+" funcional para agregar productos.
- [ ] Carrito: Refleja restaurante seleccionado, restricción de un solo restaurante por pedido, imágenes, controles de cantidad, eliminación de artículos, manejo de productos no disponibles y desglose de totales correcto.
- [ ] Checkout: Presenta titular "A un paso del antojo.", secciones claras de entrega, pago y resumen, dirección de entrega real del cliente o neutral, mapa interactivo con fallback GPS/manual, validación de teléfono/tarjeta, cupones válidos (`PruebaCupon`, `FOODJET20`) y rechazo de inválidos, descuento de estudiante, métodos de pago simulados (tarjeta, efectivo, QR de restaurante con opción de cancelación) y prevención de envíos duplicados.
- [ ] Seguimiento: Titular "¡Tu antojo va volando!", mapa con trazado de ruta interactivo, indicador "Actualizando en vivo" que refleja fielmente la conexión y actualización activa (mostrando estado de desconexión/reconexión ante errores de red), polling, animación del repartidor, cancelación permitida, estados terminales y línea de tiempo que distingue eventos reales de estimaciones.
- [ ] Vistas Secundarias: Login, registro, perfil, verificación de estudiante, favoritos, historial de pedidos, reseñas y panel de operaciones/admin estilizados coherentemente con el sistema de tokens manteniendo sus funciones, permisos y manejo de sesión expirada.

### Conservación de Arquitectura, Pruebas y Entrega
- [ ] Se registra la línea base de pruebas y estado de UI antes de iniciar modificaciones.
- [ ] La arquitectura frontend se mantiene en HTML, CSS, Bootstrap 5.3 y ES modules sin nuevas dependencias, frameworks o herramientas de empaquetado.
- [ ] Todos los contratos DOM (IDs, data-attributes, formularios) y puentes (`window.FoodJetSession`, `window.FoodJetMapas`, `window.FoodJetValidation`) se conservan o actualizan de forma consistente en todos los consumidores.
- [ ] No existen cambios en `backend/`, `prisma/`, migraciones, seeds, Docker Compose ni archivos de entorno en el git diff.
- [ ] Las suites existentes `npm test` y `npm run test:unit` pasan exitosamente sin regresiones atribuibles al rediseño, conservando `reports/cucumber.html`.
- [ ] No se registran nuevos errores en la consola del navegador durante el recorrido completo de los flujos principales.
- [ ] Las verificaciones diferencian claramente fallos previos, regresiones y comprobaciones pendientes, sin auto-certificar validaciones no ejecutadas.
- [ ] La entrega queda integrada como un diff limpio, acotado y revisable en la rama `feat/UI-frontend-update`, conservando el trabajo previo del usuario, sin commits automáticos, push, merge ni despliegues.

## Follow-up — 2026-10-30T22:39:12Z

se acabó el uso y se cortó. continua donde te quedaste
