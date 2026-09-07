Feature: CP-09 Pago con tarjeta de credito y debito

  Scenario Outline: UT-CARD-001 Validacion del numero de tarjeta
    Given los datos de tarjeta numero "<numero>", expiracion "12/29" y cvc "<cvc>"
    When se valida la tarjeta
    Then el resultado de la validacion es <valida>
    And la marca detectada es "<marca>"

    Examples:
      | numero              | cvc  | valida | marca       |
      | 4111 1111 1111 1111 | 123  | true   | visa        |
      | 5500 0000 0000 0004 | 123  | true   | mastercard  |
      | 3782 822463 10005   | 1234 | true   | amex        |
      | 4111 1111 1111 1112 | 123  | false  | visa        |

  Scenario: UT-CARD-002 Rechazo de tarjeta vencida
    Given los datos de tarjeta numero "4111 1111 1111 1111", expiracion "01/20" y cvc "123"
    When se valida la tarjeta
    Then el resultado de la validacion es false
    And el campo "expiracion" reporta el error "La tarjeta está vencida."

  Scenario: UT-CARD-003 Rechazo de CVC con longitud incorrecta
    Given los datos de tarjeta numero "4111 1111 1111 1111", expiracion "12/29" y cvc "12"
    When se valida la tarjeta
    Then el resultado de la validacion es false
    And el campo "cvc" reporta el error "El CVC debe tener 3 dígitos."
