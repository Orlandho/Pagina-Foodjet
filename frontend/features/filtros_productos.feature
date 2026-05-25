Feature: Filtrado avanzado de productos

  Scenario: UT-REST-001 Validar filtrado exitoso
    Given una lista con un producto de precio 15, tiempo "30 min" y categoria "Pizza"
    And los parametros de filtro son minPrice 10, maxPrice 20, maxTime 45 y categoria "Pizza"
    When ejecuto la funcion de filtrado
    Then el producto es incluido de forma correcta en el arreglo
    And la longitud del arreglo resultante es exactamente 1

  Scenario: UT-REST-002 Bloqueo por exceder tiempo máximo
    Given una lista con un producto de precio 15, tiempo "Más de 1 hora" y categoria "Pizza"
    And los parametros de filtro son minPrice 10, maxPrice 20, maxTime 45 y sin categoria especifica
    When ejecuto la funcion de filtrado
    Then el producto queda descartado por sobrepasar el tiempo de entrega maximo
    And la longitud del arreglo resultante es exactamente 0

  Scenario: UT-REST-003 Exclusión por categoría no coincidente
    Given una lista con un producto de precio 15, tiempo "30 min" y categoria "Hamburguesa"
    And los parametros de filtro son minPrice 10, maxPrice 20, maxTime 45 y categoria "Pizza"
    When ejecuto la funcion de filtrado
    Then el sistema omite el producto por discrepancia de categorias
    And la longitud del arreglo resultante es exactamente 0