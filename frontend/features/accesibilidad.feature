Feature: Widget de accesibilidad universal de FoodJet

  Scenario: A11Y-REG-001 El botón flotante azul y su panel existen en la interfaz y están cableados
    Given el código fuente del frontend de FoodJet
    When verifico la presencia estructural del componente de accesibilidad
    Then el botón flotante azul de accesibilidad existe con sus atributos ARIA
    And los filtros SVG para protanopia, deuteranopia y tritanopia están definidos localmente
    And la aplicación inicializa el módulo de accesibilidad sin cuentas ficticias ni CDN de UserWay

  Scenario: A11Y-KEY-002 Apertura mediante atajo Alt + A sin falsos positivos ni repetición
    When evalúo el atajo de teclado con Alt presionado y tecla "a"
    Then el atajo de apertura es reconocido como válido
    When evalúo el atajo de teclado repetido con Alt presionado y tecla "a"
    Then el atajo de apertura es rechazado
    When evalúo el atajo de teclado con Ctrl y Alt presionados y tecla "a"
    Then el atajo de apertura es rechazado
    When evalúo el atajo de teclado con Alt presionado y tecla "b"
    Then el atajo de apertura es rechazado

  Scenario: A11Y-FONT-003 Ampliación tipográfica paso a paso hasta el 200 por ciento
    Given las preferencias de accesibilidad en su estado inicial
    When aumento la escala tipográfica 6 veces consecutivas
    Then la escala tipográfica resultante es 200 por ciento
    When intento aumentar la escala tipográfica nuevamente
    Then la escala tipográfica resultante es 200 por ciento
    When reduzco la escala tipográfica 6 veces consecutivas
    Then la escala tipográfica resultante es 100 por ciento

  Scenario: A11Y-CVD-004 Validación de filtros para protanopia, deuteranopia y tritanopia
    When normalizo preferencias con el filtro de daltonismo "protanopia"
    Then el filtro normalizado es "protanopia"
    When normalizo preferencias con el filtro de daltonismo "deuteranopia"
    Then el filtro normalizado es "deuteranopia"
    When normalizo preferencias con el filtro de daltonismo "tritanopia"
    Then el filtro normalizado es "tritanopia"
    When normalizo preferencias con el filtro de daltonismo "filtro_inexistente"
    Then el filtro normalizado es "none"

  Scenario: A11Y-PERSIST-005 Persistencia y restauración de preferencias en almacenamiento local
    Given un almacenamiento local limpio
    When guardo preferencias con alto contraste, dislexia, sin animaciones, filtro "deuteranopia", lectura por voz y escala 175
    And cargo nuevamente las preferencias desde el almacenamiento local
    Then las preferencias restauradas conservan todos los ajustes activos
    And el contador de ajustes activos es 6
    When restablezco las preferencias guardadas
    Then las preferencias restauradas vuelven a los valores predeterminados

  Scenario: A11Y-RESIL-006 Recuperación segura ante almacenamiento corrupto o bloqueado
    Given un almacenamiento local con JSON corrupto
    When cargo nuevamente las preferencias desde el almacenamiento local
    Then las preferencias restauradas vuelven a los valores predeterminados
    Given un almacenamiento local bloqueado que lanza errores
    When intento guardar preferencias de accesibilidad
    Then el guardado falla de forma controlada sin lanzar excepciones

  Scenario: A11Y-VOICE-007 Extracción segura y segmentación de texto para lectura asistida por voz
    When extraigo texto legible de un botón sin texto visible pero con aria-label "Carrito de compras"
    Then el texto extraído es "Carrito de compras"
    When extraigo texto legible de un campo de contraseña con etiqueta "Contraseña" y valor secreto
    Then el texto extraído es "Contraseña (campo de contraseña)"
    When segmento un párrafo largo de 500 caracteres para síntesis de voz
    Then todos los fragmentos tienen como máximo 220 caracteres
