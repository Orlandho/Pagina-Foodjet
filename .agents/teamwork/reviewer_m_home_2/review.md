# Independent Code Review Report — Milestone M-Home
**Fecha:** 2026-10-31  
**Módulo:** R1. Reconstrucción de Home y cabecera según diseño Figma  
**Agente Revisor:** `teamwork_reviewer` (`reviewer_m_home_2`)  
**Directorio:** `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\reviewer_m_home_2\`  
**Orquestador:** `58c3ffd8-dc5b-402f-bd35-e8433b2f19cb`

---

## 1. Review Summary

**Verdict**: **REQUEST_CHANGES**

### Justificación del Veredicto:
Aunque la implementación de `worker_m_home` demuestra un avance sólido en la reestructuración DOM (247 IDs con 0 duplicados y preservación íntegra de los 165 baseline IDs), la salvaguarda estricta de GPS a demanda y la contención responsive en móvil (390px), la revisión visual y de contraste temático detectó una **violación directa del criterio 4 de la lista de verificación y del requerimiento R5 de `ORIGINAL_REQUEST.md`**:
- En modo oscuro (`prefers-color-scheme: dark`), el botón CTA principal del banner promocional (`.foodjet-hero-cta-btn`) presenta **texto blanco (`#E8E8E8`) sobre fondo blanco (`#FFFFFF`)**, arrojando un ratio de contraste de **1.22:1** (severamente por debajo del umbral mínimo WCAG 2.1 AA de **4.5:1** e ilegible para el usuario).
- Asimismo, se detectaron dos deficiencias menores de accesibilidad y consistencia temática (ausencia de `role="region"` y `aria-label` en el contenedor colapsable `#filtersPanel`, y clase utilitaria `bg-white` hardcodeada en el divisor del modal `#addressSelectorModal`).

Debido a que la consigna de revisión especifica expresamente: *"Clean theme rendering: Verify absence of white text on white buttons or clipped labels"*, no es admisible aprobar la entrega hasta que este defecto de contraste en el tema sea resuelto quirúrgicamente.

---

## 2. Findings (Hallazgos Detallados)

### [Major] Finding 1: Texto blanco sobre botón blanco en `.foodjet-hero-cta-btn` bajo modo oscuro (WCAG 2.1 AA SC 1.4.3)
- **Qué:** El botón CTA del banner promocional en el carrusel Hero ("Pedir ahora" / "Aprovechar oferta") se vuelve prácticamente invisible en modo oscuro debido a que su texto se renderiza en `#E8E8E8` sobre fondo `#FFFFFF`.
- **Dónde:** `frontend/styles.css`, líneas 3053–3066 y bloque dark mode líneas 1285–1300.
- **Por qué es un problema:**
  1. En `frontend/styles.css` (línea 3056–3057), `.foodjet-hero-cta-btn` tiene:
     ```css
     background-color: #ffffff !important;
     color: var(--color-text-primary) !important;
     ```
  2. En modo claro, `--color-text-primary` es `#1C1C1C`, logrando un contraste excelente (~17:1).
  3. Sin embargo, bajo `@media (prefers-color-scheme: dark)`, la variable `:root` redefine `--color-text-primary: #E8E8E8;`. Al mantener el botón su fondo blanco forzado (`#ffffff !important`), el texto toma el valor `#E8E8E8`.
  4. El ratio de contraste resultante es:
     $$\text{Luminancia}(\#FFFFFF) = 1.0000,\quad \text{Luminancia}(\#E8E8E8) = 0.8070$$
     $$\text{Contraste} = \frac{1.0000 + 0.05}{0.8070 + 0.05} = \frac{1.05}{0.8570} \approx \mathbf{1.22:1}$$
  5. Esto incumple frontalmente WCAG 2.1 AA (mínimo 4.5:1) y la instrucción explícita del hito R5 en `ORIGINAL_REQUEST.md`: *"corrigiendo combinaciones ilegibles (texto sobre botones claros en banner y controles de cuenta)"*.
- **Sugerencia de corrección:**
  En `frontend/styles.css`, fijar el color del texto de `.foodjet-hero-cta-btn` permanentemente en `#1C1C1C !important;` (al igual que se hizo correctamente con `.foodjet-badge--student`):
  ```css
  .foodjet-hero-cta-btn {
      display: inline-flex;
      align-items: center;
      background-color: #ffffff !important;
      color: #1C1C1C !important; /* Garantiza contraste 17:1 tanto en modo claro como en modo oscuro */
      ...
  }
  ```

---

### [Minor] Finding 2: Ausencia de `role="region"` y etiqueta accesible en `#filtersPanel`
- **Qué:** El panel colapsable de filtros avanzados `#filtersPanel` no declara semántica de región WAI-ARIA ni etiqueta accesible para tecnologías asistivas.
- **Dónde:** `frontend/index.html`, línea 285.
- **Por qué es un problema:**
  El botón disparador `#btn-toggle-filters-popover` incluye correctamente `aria-expanded="false"` y `aria-controls="filtersPanel"`. Sin embargo, el elemento colapsado destino es un simple `div`:
  ```html
  <div class="collapse mb-4" id="filtersPanel">
  ```
  De acuerdo con el patrón de diseño WAI-ARIA 1.2 para paneles de revelado/filtros (WCAG 2.1 SC 4.1.2), una sección interactiva colapsable debe exponer `role="region"` y `aria-labelledby="btn-toggle-filters-popover"` (o `aria-label="Filtros avanzados"`) para que los lectores de pantalla puedan identificar su propósito al expandirse.
- **Sugerencia de corrección:**
  Actualizar `frontend/index.html` en la línea 285:
  ```html
  <div class="collapse mb-4" id="filtersPanel" role="region" aria-labelledby="btn-toggle-filters-popover">
  ```

---

### [Minor] Finding 3: Divisor con clase utilitaria `bg-white` en `#addressSelectorModal` bajo modo oscuro
- **Qué:** El texto separador del modal ("o elige una guardada") utiliza la clase utilitaria `bg-white` de Bootstrap, generando un parche blanco brillante sobre el fondo oscuro del modal.
- **Dónde:** `frontend/index.html`, línea 1454:
  ```html
  <span class="position-absolute top-50 start-50 translate-middle bg-white px-2 small text-muted">o elige una guardada</span>
  ```
- **Por qué es un problema:**
  En modo oscuro, `.foodjet-modal .modal-content` tiene fondo `#1E1E1E !important;`. La clase `bg-white` impone `background-color: #fff !important;` directamente, rompiendo la armonía estética y provocando un bloque blanco desfasado.
- **Sugerencia de corrección:**
  Reemplazar `bg-white` por una clase semántica o estilo que herede el color de superficie del modal:
  ```html
  <span class="position-absolute top-50 start-50 translate-middle px-2 small text-muted foodjet-modal-divider-text">o elige una guardada</span>
  ```
  Y en `frontend/styles.css`:
  ```css
  .foodjet-modal-divider-text {
      background-color: var(--color-surface);
  }
  ```

---

## 3. Verified Claims (Evidencias y Verificación Independiente)

| Afirmación / Requerimiento | Método de Verificación | Resultado | Evidencia |
|---|---|---|---|
| **Salvaguarda de Privacidad GPS** | Inspección de AST y eventos en `frontend/js/ui.js` | **PASS** | `navigator.geolocation.getCurrentPosition` se invoca única y exclusivamente en el listener `click` de `#btnHeaderLocateGps` (línea 254). Cero llamadas en carga de página, `initHeaderAddress()` o apertura de `#addressSelectorModal`. |
| **Responsividad en Viewport 390px** | Análisis de CSS, flexbox wraps y contención en `frontend/styles.css` y `frontend/index.html` | **PASS** | `html, body` tienen `overflow-x: hidden`. La barra de navegación se reordena en 3 filas fluidas (`order: 1` marca/toggler, `order: 3` dirección 100%, `order-last` buscador 100%). Píldoras con `overflow-x: auto`. Cuadrícula de productos usa `col-sm-6` (1 columna al 100% en `<576px`). Cero desbordamiento horizontal. |
| **Preservación de DOM IDs Baseline (165/165)** | Ejecución de `node tests/empirical_m2_1_audit.mjs` contra commit `515e3ad` | **PASS** | 247 IDs encontrados, 0 duplicados, 165/165 baseline IDs estrictamente preservados, sintaxis HTML5 válida. |
| **Pruebas Unitarias de Dominio** | Ejecución de `npm run test:unit` | **PASS** | 25/25 pruebas unitarias aprobadas (0 fallos, 6 suites). |
| **Pruebas Funcionales BDD Frontend** | Ejecución de `npm run test:frontend` | **PASS** | 86/86 escenarios BDD aprobados (327 steps). |
| **Pruebas BDD Backend** | Ejecución de `npm run test:backend` | **PASS** | 45/45 escenarios BDD aprobados (150 steps). |
| **Challenger M2-2 (State & UX)** | Ejecución de `node tests/unit/challenger_m2_2_empirical.test.mjs` | **PASS** | 20/20 pruebas aprobadas (carrusel, búsqueda reactiva, conflicto restaurante, contención móvil). |
| **Integridad del Código y Ausencia de Trampas** | Auditoría de diferencias (`git diff`) y búsqueda de facades/hardcoded results | **PASS** | No se encontraron resultados hardcodeados para burlar tests ni facades falsos. |

---

## 4. Coverage Gaps & Adversarial Stress Tests

### Stress Test 1: Comportamiento en Modo Oscuro (`prefers-color-scheme: dark`)
- **Escenario:** Usuario con tema oscuro a nivel de sistema operativo accede al Home.
- **Comportamiento Esperado:** Todos los textos, botones y tarjetas deben mantener contraste legible (>= 4.5:1).
- **Comportamiento Observado:** El botón CTA del banner promocional (`.foodjet-hero-cta-btn`) presenta contraste de **1.22:1** (blanco sobre blanco), resultando ilegible.
- **Resultado:** **FAIL** (Ver Finding 1).

### Stress Test 2: Toggle del Panel de Filtros con Teclado y Lectores de Pantalla
- **Escenario:** Usuario ciego o de baja visión navega con Tabulador hasta `#btn-toggle-filters-popover` y presiona Enter o Espacio.
- **Comportamiento Esperado:** Se anuncia que una región de filtros se ha expandido (`aria-expanded="true"` en botón y contenedor asociado con `role="region"`).
- **Comportamiento Observado:** El botón conmuta `aria-expanded` pero `#filtersPanel` no tiene `role="region"`.
- **Resultado:** **FAIL PARCIAL** (Ver Finding 2).

### Stress Test 3: Reducción de Viewport a 320px – 390px
- **Escenario:** Reducción drástica del ancho del viewport en dispositivo móvil pequeño (iPhone SE / 390px).
- **Comportamiento Esperado:** Cero scroll horizontal no intencionado, tap targets táctiles >= 44px, scroll suave en píldoras.
- **Comportamiento Observado:** Las píldoras de comida scrollean horizontalmente de forma limpia vía `-webkit-overflow-scrolling: touch;`. Las tarjetas de producto ocupan el 100% del ancho sin romper márgenes.
- **Resultado:** **PASS**.

---

## 5. Recomendación y Próximos Pasos

Se solicita formalmente al orquestador ordenar a `worker_m_home` (o al agente correspondiente) aplicar las siguientes correcciones acotadas:

1. **En `frontend/styles.css` (línea 3057):**
   Cambiar `color: var(--color-text-primary) !important;` por `color: #1C1C1C !important;` en `.foodjet-hero-cta-btn`.
2. **En `frontend/index.html` (línea 285):**
   Agregar `role="region" aria-labelledby="btn-toggle-filters-popover"` al `div#filtersPanel`.
3. **En `frontend/index.html` (línea 1454):**
   Reemplazar la clase `bg-white` en el divisor del modal por una clase/estilo compatible con modo oscuro.

Una vez aplicados estos tres ajustes quirúrgicos, el hito M-Home estará listo para aprobación incondicional (`APPROVE`).
