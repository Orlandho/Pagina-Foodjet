Feature: CP-02 Adición de Productos al Carrito

  Scenario: UT-CART-001 Agregar producto valido y disponible al carrito vacio
    Given el estado inicial del carrito es vacio
    And la funcion getProductById retorna para el producto 1: disponibilidad true y restaurante_id 10
    When ejecuto addToCart con el producto 1
    Then el objeto cart se actualiza a contener el id 1 con cantidad 1
    And la funcion retorna success true

  Scenario: UT-CART-002 Intento de agregar un producto no disponible
    Given el estado inicial del carrito es vacio
    And la funcion getProductById retorna para el producto 2: disponibilidad false
    When ejecuto addToCart con el producto 2
    Then el objeto cart no sufre modificaciones y queda vacio
    And la funcion retorna success false y error "UNAVAILABLE"

  Scenario: UT-CART-003 Conflicto por mezcla de productos de distintos restaurantes
    Given el estado inicial del carrito tiene el producto 1 con cantidad 1 del restaurante_id 10
    And la funcion getProductById retorna para el producto 3: disponibilidad true y restaurante_id 20
    When ejecuto addToCart con el producto 3
    Then el objeto cart no sufre modificaciones y mantiene solo el producto 1
    And la funcion retorna success false y error "DIFFERENT_RESTAURANT"