Feature: CP-14 Ubicación exacta de la dirección de entrega

  El cliente marca en el mapa el punto exacto de entrega. Ese punto se guarda
  con la dirección y es el destino del recorrido del repartidor.

  Background:
    Given el cliente tiene guardada "Av. Alfredo Mendiola 6062, Los Olivos" en -11.9965, -77.0611

  Scenario: UT-UBI-001 Misma dirección y mismo punto reutiliza la guardada
    When confirma "av. alfredo mendiola 6062,  Los Olivos" con el pin en -11.99655, -77.06112
    Then se reutiliza la dirección guardada

  Scenario: UT-UBI-002 Mover el pin a otra puerta crea una dirección nueva
    When confirma "Av. Alfredo Mendiola 6062, Los Olivos" con el pin en -11.9990, -77.0611
    Then se crea una dirección nueva

  Scenario: UT-UBI-003 Otro texto crea una dirección nueva aunque el punto coincida
    When confirma "Av. Alfredo Mendiola 6062, Dpto 302, Los Olivos" con el pin en -11.9965, -77.0611
    Then se crea una dirección nueva

  Scenario: UT-UBI-004 Sin mapa basta con que coincida el texto
    When confirma "Av. Alfredo Mendiola 6062, Los Olivos" sin marcar punto
    Then se reutiliza la dirección guardada

  Scenario: UT-UBI-005 Con mapa no se confirma sin punto marcado
    Given el mapa está disponible
    And el cliente no ha marcado ningún punto
    Then falta marcar la ubicación: true

  Scenario: UT-UBI-006 Sin mapa no se bloquea el pedido
    Given el mapa no está disponible
    And el cliente no ha marcado ningún punto
    Then falta marcar la ubicación: false

  Scenario: UT-UBI-007 Con el punto marcado se puede confirmar
    Given el mapa está disponible
    And el cliente marcó el punto -12.0464, -77.0428
    Then falta marcar la ubicación: false

  Scenario: UT-UBI-008 El mapa abre en la dirección predeterminada ubicada
    Given el cliente también tiene guardada "Jr. de la Unión 300, Lima" sin ubicar y predeterminada
    And el cliente también tiene guardada "Av. Larco 1150, Miraflores" en -12.1300, -77.0300 y predeterminada
    Then el mapa abre en "Av. Larco 1150, Miraflores"

  Scenario: UT-UBI-009 Una dirección sin coordenadas no sirve para abrir el mapa
    Given el cliente solo tiene guardada "Jr. de la Unión 300, Lima" sin ubicar
    Then el mapa no abre en ninguna dirección guardada

  Scenario Outline: UT-UBI-010 Coordenadas válidas e inválidas
    Then las coordenadas <lat>, <lng> son válidas: <validas>

    Examples:
      | lat    | lng     | validas |
      | -12.05 | -77.04  | true    |
      | 90     | 180     | true    |
      | 91     | -77.04  | false   |
      | -12.05 | -181    | false   |
