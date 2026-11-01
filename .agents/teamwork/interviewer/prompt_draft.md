Organiza Teamwork con inspección de frames, implementación y revisión visual independiente, asignando un responsable por archivo compartido. Corrige la fidelidad visual de FoodJet WEB en C:\Users\ORLANDO\Desktop\Pagina-Foodjet, rama feat/UI-frontend-update, como continuación de la actualización existente. Conserva el trabajo funcional y las tarjetas de productos actuales que ya aprobó el usuario. Reconstruye la composición de las pantallas para reproducir los diseños WEB de Figma (Home - Desktop, Shopping cart - Desktop, Checkout - Desktop y Order tracking - Desktop); un cambio de colores sobre la estructura anterior no satisface esta solicitud.

Working directory: C:\Users\ORLANDO\Desktop\Pagina-Foodjet
Integrity mode: development

Reference material:
- Figma (autoridad visual obligatoria): https://www.figma.com/design/kmCrgpRVegxmGl1hLsGGIp/FOODJET-BUSS-PROJ?node-id=0-1 (frames Home - Desktop, Shopping cart - Desktop, Checkout - Desktop y Order tracking - Desktop)
- Evidencias de auditoría anterior (solo como orientación): C:\Users\ORLANDO\.codex\visualizations\2026\10\29\01a189af-40f5-7701-8e6a-9addc1171a30\audit-web-oct31

## Requirements

### R1. Reconstrucción de Home y cabecera según diseño Figma
Reconstruir la cabecera del frame web con marca, ubicación con etiqueta secundaria y dirección real o estado neutral (con selector/edición real de dirección usando datos y servicios existentes, sincronizado con checkout sin duplicados y solicitando GPS solo tras acción explícita), búsqueda central, acciones y botón textual naranja "Mi carrito · N", manteniendo acceso a cuenta, favoritos, historial y administración sin que la navegación antigua domine la composición. Colocar el titular "Tu antojo. Sin escalas." y su subtítulo antes de la promoción siguiendo el frame. Reproducir el banner horizontal compacto de dos mitades (texto a la izquierda y foto a la derecha a sangre dentro del contenedor usando el asset del diseño cuando esté disponible, conservando promociones reales sin fotos genéricas ni precios inventados). Retirar la franja de cuatro ventajas del espacio entre promoción y catálogo, reubicando la información útil al final o en una sección secundaria accesible. Sustituir la columna lateral de filtros permanentemente abierta por filas compactas: categorías bajo la promoción y acciones rápidas debajo; el botón Filtros abre un panel/popover accesible con las opciones existentes, filtros combinables, búsqueda y filtro de precio rápido en moneda y lógica actual. Conservar las tarjetas aprobadas y su comportamiento, ajustando solo anchura de rejilla, espaciado y badges cortados sin inventar datos que no existan en el backend.

### R2. Conservación y afinamiento del carrito de compras
Conservar la base funcional del panel lateral del carrito, cantidades, precios de estudiante y acceso a pagar bajo la regla de un restaurante. Ajustar cabecera, densidad, imágenes, resumen y CTA según el frame Shopping cart - Desktop. Indicar claramente en los importes si corresponden al subtotal de productos o total final, evitando que un CTA prometa un total que excluya envío e impuestos.

### R3. Checkout fiel al frame web con lógica existente
Reproducir las proporciones del frame en composición de dos columnas: entrega y pago a la izquierda, resumen compacto a la derecha. Permitir revisar los datos guardados con una ficha compacta y botón Editar, preservando formularios, mapa, GPS, referencias y validaciones al editar. Presentar los métodos de pago como en el frame e integrar el bloque QR dentro de la zona de pago cuando se elija billetera (reutilizando el QR real del restaurante y el flujo simulado existente con semántica de confirmación/cancelación, validación y prevención de duplicados, sin anunciar pago confirmado antes de la acción correcta ni crear pedidos duplicados). Corregir la explicación del desglose del resumen para que cada línea sea reconciliable con los totales reales del backend sin modificar reglas ni importes del backend.

### R4. Seguimiento de pedidos fiel sin pérdida de funcionalidad
Reproducir la disposición de Order tracking - Desktop: mapa interactivo ancho y de altura contenida a la izquierda; ficha compacta con ETA destacado y línea de tiempo a la derecha; resumen del pedido debajo del mapa. Conservar el mapa real interactivo, trazado por calles, posición animada del repartidor, sondeo, estados terminales y momentos reales versus estimados, sin sustituir el mapa por una imagen estática. Ajustar titular, tipografía, espaciados y estados al diseño y al estado real del pedido con etiqueta de conexión veraz y cancelación sujeta al estado del pedido. No inventar datos inexistentes de repartidor (nombre, avatar, valoración, teléfono), chat o soporte, conservando el espacio y jerarquía con la información real disponible y documentando la adaptación.

### R5. Tema, accesibilidad y límites de ejecución
Comparar primero el tema claro con el frame claro de Figma al mismo ancho. Si se conserva el tema oscuro, comprobarlo por separado con la misma estructura, corrigiendo combinaciones ilegibles (texto sobre botones claros en banner y controles de cuenta, textos partidos en línea de tiempo) y geometría de controles. Garantizar foco visible, navegación por teclado, etiquetas, lectores de pantalla, zoom 200 % y reducción de movimiento. Mantener HTML, CSS, Bootstrap y JavaScript vanilla con módulos ES sin frameworks adicionales; conservar contratos DOM e IDs actualizando consistentemente sus consumidores. Conservar el backend PostgreSQL/Express/Prisma, contratos API, reglas contables, seeds, migraciones, credenciales, Docker/Caddy, CI, /api y el entorno http://localhost:8081 intactos. El repositorio móvil y el prototipo son de solo lectura; no ejecutar resets de base de datos, siembras destructivas, cambios de esquema ni datos de producción; sin commits automáticos, push, merge ni despliegues.

## Acceptance Criteria

### Fidelidad Visual y Comparación con Figma
- [ ] Cada uno de los cuatro frames tiene una captura nueva del resultado comparable por ancho (1440 px y 1280 px), estado y tema con la referencia Figma WEB.
- [ ] Se mantiene una tabla de discrepancias con cada diferencia cerrada o técnicamente justificada, sin declarar fidelidad exacta mientras persistan diferencias estructurales sin justificar.
- [ ] Se comprueba la web responsive a 390 px verificando el viewport efectivo sin desbordamiento horizontal y con controles utilizables.
- [ ] Se compara primero el tema claro contra el frame claro de Figma; si se mantiene tema oscuro, se verifica por separado con idéntica estructura y sin textos ilegibles sobre botones ni textos partidos.

### Home y Cabecera
- [ ] La cabecera reproduce búsqueda central, selector/edición de dirección conectado a datos y servicios existentes (o estado neutral si no hay) sincronizado con checkout sin duplicados, solicitud de GPS solo tras acción explícita del usuario, acciones de cuenta/favoritos/historial/admin y botón textual "Mi carrito · N".
- [ ] El orden vertical sigue estrictamente: titular "Tu antojo. Sin escalas." y subtítulo antes de la promoción -> banner compacto horizontal de dos mitades (texto izquierda, foto derecha a sangre sin fotos genéricas ni precios inventados) -> filtros compactos -> catálogo.
- [ ] La franja de cuatro ventajas queda retirada del espacio intermedio y reubicada al final o en sección secundaria accesible.
- [ ] La columna lateral fija de filtros es sustituida por filas compactas (categorías y acciones rápidas) con botón Filtros que despliega panel/popover accesible con filtros combinables, búsqueda y precio en moneda y lógica actual.
- [ ] Las tarjetas de productos aprobadas conservan su diseño y comportamiento funcional íntegro, sin datos inventados que no existan en el backend.

### Carrito y Checkout
- [ ] El carrito ajusta cabecera, densidad, imágenes, resumen y CTA según Shopping cart - Desktop, manteniendo la regla de un solo restaurante e importes rotulados claramente entre subtotal y total final.
- [ ] El checkout reproduce la composición de dos columnas (entrega y pago a la izquierda, resumen compacto a la derecha) con ficha compacta de datos guardados y botón Editar plenamente funcional para mapa, GPS y validaciones.
- [ ] Al seleccionar billetera, el bloque QR se presenta integrado dentro de la zona de pago reutilizando el QR real del restaurante y flujo simulado, con confirmación/cancelación funcional y sin pedidos duplicados ni pagos falsamente confirmados.
- [ ] El desglose del resumen de checkout presenta cada línea (subtotal, descuentos, envío, impuestos) de forma matemáticamente reconciliable con el total del backend.

### Seguimiento de Pedidos
- [ ] El seguimiento ubica el mapa a la izquierda con altura contenida, ficha con ETA destacado y línea de tiempo a la derecha, y resumen del pedido debajo del mapa.
- [ ] El mapa conserva interactividad, trazado por calles y posición animada real del repartidor sin reemplazarse por imagen estática ni inventar datos de repartidor, chat o soporte.
- [ ] La etiqueta de estado de conexión refleja con veracidad el sondeo activo o desconexión, y la cancelación solo se ofrece en estados permitidos.

### Verificación y Entrega
- [ ] `npm test` y `npm run test:unit` se ejecutan con evidencia, comparando contra la línea base sin regresiones atribuibles al rediseño.
- [ ] Se recorren con datos de prueba locales los flujos de búsqueda combinada, selección de dirección, carrito, descuentos, pago QR y efectivo simulado, seguimiento y recuperación de errores.
- [ ] La consola del navegador permanece libre de nuevos errores JavaScript durante la navegación completa.
- [ ] No existen cambios en `backend/`, esquema Prisma, migraciones, seeds, Docker Compose ni archivos de CI.
- [ ] La entrega queda integrada como un diff limpio, acotado y documentado en la rama `feat/UI-frontend-update`, conservando el trabajo previo del usuario, sin commits automáticos, push, merge ni despliegues.
