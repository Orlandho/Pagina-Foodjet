Feature: CP-15 Seguimiento con horas por etapa y reparto en el mapa

  La línea de tiempo enseña la hora real de cada etapa ya ocurrida y estima
  las que faltan con el plan de tiempos del pedido.

  Background:
    Given un pedido en efectivo creado a las 20:00:00 con plan pendiente 12 s, confirmado 6 s, preparación 66 s y reparto 90 s

  Scenario: UT-SEG-001 Recién creado, todas las etapas tienen hora estimada
    Given el pedido sigue "pendiente" y son las 20:00:05
    When se calcula la línea de tiempo
    Then la etapa "Confirmación" está "en_curso" con hora estimada 20:00:12
    And la etapa "Preparación" está "pendiente" con hora estimada 20:00:18
    And la etapa "En camino" está "pendiente" con hora estimada 20:01:24
    And la etapa "Entregado" está "pendiente" con hora estimada 20:02:54

  Scenario: UT-SEG-002 Las etapas ocurridas muestran su hora real
    Given el pedido pasó a "confirmado" a las 20:00:13
    And el pedido pasó a "en_preparacion" a las 20:00:20
    And el pedido pasó a "en_camino" a las 20:01:30
    And son las 20:02:00
    When se calcula la línea de tiempo
    Then la etapa "Confirmación" está "hecha" con hora real 20:00:13
    And la etapa "Preparación" está "hecha" con hora real 20:00:20
    And la etapa "En camino" está "en_curso" con hora real 20:01:30
    And la etapa "Entregado" está "pendiente" con hora estimada 20:03:00

  Scenario: UT-SEG-003 Si una etapa se retrasa, lo siguiente se estima desde ahora
    Given el pedido sigue "pendiente" y son las 20:00:40
    When se calcula la línea de tiempo
    Then la etapa "Confirmación" está "en_curso" con hora estimada 20:00:40
    And la etapa "Preparación" está "pendiente" con hora estimada 20:00:46

  Scenario: UT-SEG-004 Un pedido anterior a la simulación no inventa horas
    Given un pedido "en_preparacion" sin plan ni historial
    When se calcula la línea de tiempo
    Then la etapa "Preparación" está "en_curso" sin hora
    And la etapa "Entregado" está "pendiente" sin hora

  Scenario: UT-SEG-005 Un pedido cancelado no estima nada
    Given el pedido pasó a "cancelado" a las 20:00:08
    And son las 20:00:10
    When se calcula la línea de tiempo
    Then la etapa "Confirmación" está "cancelada" sin hora
    And la etapa "Entregado" está "cancelada" sin hora

  Scenario: UT-SEG-006 El repartidor parte la ruta por donde va
    Given una ruta recta hacia el norte de 1000 metros
    When el repartidor lleva el 25 por ciento
    Then le quedan 750 metros
    And la parte recorrida empieza en el local y la pendiente acaba en la casa

  Scenario Outline: UT-SEG-007 Distancias y tiempos dichos para el cliente
    Then <metros> metros se leen "<distancia>"

    Examples:
      | metros | distancia |
      | 845    | 850 m     |
      | 6443   | 6,4 km    |
      | 312400 | 312 km    |

  Scenario Outline: UT-SEG-008 Cuánto falta para la llegada
    Then faltar <segundos> segundos se lee "<texto>"

    Examples:
      | segundos | texto    |
      | 20       | Llegando |
      | 61       | 2 min    |
      | 3600     | 1 h      |
      | 4500     | 1 h 15 min |
