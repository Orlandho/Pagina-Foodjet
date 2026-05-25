Feature: CP-07 Promociones estudiantiles

  Scenario: UT-USER-001 Validar aplicacion de descuento
    Given el usuario actual tiene la condicion de estudiante en true
    And un producto con precio de 20.00 y un descuento de 20 por ciento
    When se calcula y genera el HTML del precio
    Then el HTML resultante debe contener el precio rebajado "S/ 16.00"
    And el HTML debe incluir la clase visual "text-success"

  Scenario: UT-USER-002 Bloqueo de descuento a no estudiantes
    Given el usuario actual tiene la condicion de estudiante en false
    And un producto con precio de 20.00 y un descuento de 20 por ciento
    When se calcula y genera el HTML del precio
    Then el HTML resultante debe mostrar exactamente "S/ 20.00"
    And no debe incluir etiquetas span de descuento

  Scenario: UT-USER-003 Omision por producto sin descuento
    Given el usuario actual tiene la condicion de estudiante en true
    And un producto con precio de 20.00 y un descuento de 0 por ciento
    When se calcula y genera el HTML del precio
    Then el HTML resultante debe mostrar exactamente "S/ 20.00"
    And no debe incluir etiquetas span de descuento