Feature: CP-12 Vigencia de la sesión

  Scenario: UT-SESS-001 Un token vigente se acepta
    Given un token que caduca dentro de 3600 segundos
    When se comprueba si la sesion caduco
    Then el resultado es false

  Scenario: UT-SESS-002 Un token caducado se descarta
    Given un token que caduco hace 60 segundos
    When se comprueba si la sesion caduco
    Then el resultado es true

  Scenario: UT-SESS-003 Un token ilegible se trata como caducado
    Given un token con el valor "esto-no-es-un-jwt"
    When se comprueba si la sesion caduco
    Then el resultado es true

  Scenario: UT-SESS-004 La ausencia de token se trata como caducado
    Given un token con el valor ""
    When se comprueba si la sesion caduco
    Then el resultado es true

  Scenario Outline: UT-SESS-005 Que respuestas del servidor indican sesion invalida
    Given una respuesta del servidor con codigo <codigo>
    Then se considera fallo de sesion: <esFallo>

    Examples:
      | codigo | esFallo |
      | 401    | true    |
      | 403    | true    |
      | 400    | false   |
      | 409    | false   |
      | 201    | false   |
