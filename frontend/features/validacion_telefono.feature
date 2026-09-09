Feature: CP-13 Validación del teléfono

  Scenario Outline: UT-TEL-001 El campo descarta lo que no sea un digito
    Given el usuario escribe "<escrito>" en el telefono
    When se filtra el valor mientras escribe
    Then el campo queda con "<resultado>"

    Examples:
      | escrito                                          | resultado |
      | 987654321                                        | 987654321 |
      | 1234567891232132121322131231rtghbszxrhbsrhbsrhb  | 123456789 |
      | 987-654-321                                      | 987654321 |
      | abc                                              |           |
      | 12345678901234                                   | 123456789 |

  Scenario: UT-TEL-002 Un telefono de 9 digitos es valido
    Given el usuario escribe "987654321" en el telefono
    When se valida el telefono
    Then el telefono es valido

  Scenario: UT-TEL-003 Se rechaza el telefono con letras
    Given el usuario escribe "98765432a" en el telefono
    When se valida el telefono
    Then el telefono es invalido con el mensaje "El teléfono solo puede contener números."

  Scenario: UT-TEL-004 Se rechaza el telefono demasiado largo
    Given el usuario escribe "9876543210" en el telefono
    When se valida el telefono
    Then el telefono es invalido con el mensaje "El teléfono debe tener exactamente 9 dígitos."

  Scenario: UT-TEL-005 Se rechaza el telefono vacio
    Given el usuario escribe "" en el telefono
    When se valida el telefono
    Then el telefono es invalido con el mensaje "Ingresa tu número de teléfono."
