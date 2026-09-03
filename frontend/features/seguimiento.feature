Feature: CP-08 Monitoreo en tiempo real del estado de la orden

  Scenario Outline: UT-TRACK-001 Cada estado se refleja en la etapa correcta de la linea de tiempo
    Given un pedido cuyo estado en la base de datos es "<estado>"
    When se calcula la vista de seguimiento
    Then la etapa activa es la numero <etapa>
    And el titulo mostrado es "<titulo>"

    Examples:
      | estado         | etapa | titulo                |
      | pendiente      | 1     | Confirmando tu pedido |
      | confirmado     | 2     | Pedido confirmado     |
      | en_preparacion | 2     | Preparando tu pedido  |
      | en_camino      | 3     | Pedido en camino      |

  Scenario: UT-TRACK-002 Normalizacion de los estados heredados de la base de datos
    Given un pedido cuyo estado en la base de datos es "En preparación"
    When se calcula la vista de seguimiento
    Then el estado normalizado es "en_preparacion"
    And la etapa activa es la numero 2

  Scenario: UT-TRACK-003 El pedido entregado completa la linea de tiempo y detiene el sondeo
    Given un pedido cuyo estado en la base de datos es "entregado"
    When se calcula la vista de seguimiento
    Then las 4 etapas quedan completadas
    And la vista se marca como terminal

  Scenario: UT-TRACK-004 El pedido cancelado se muestra como terminal sin avanzar etapas
    Given un pedido cuyo estado en la base de datos es "cancelado"
    When se calcula la vista de seguimiento
    Then no hay ninguna etapa activa
    And la vista se marca como terminal

  Scenario: UT-TRACK-005 El subtotal se deriva del total porque el modelo no lo guarda
    Given un pedido con total 23.29, impuestos 2.79 y envio 5.00
    When se calcula el subtotal del pedido
    Then el subtotal resultante es 15.50
