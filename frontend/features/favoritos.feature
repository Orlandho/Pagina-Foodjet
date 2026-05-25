Feature: CP-06 Integración de guardado de favoritos

  Scenario: UT-FAVO-001 El usuario tiene un token de autenticación válido
    Given el usuario tiene un token "mockAuthToken"
    And la API responde con la lista de favoritos
    When ejecuto loadFavorites
    Then la funcion fetchFavoritesAPI es llamada con el token
    And los favoritos son almacenados en el estado con setFavorites
    And se renderizan los productos y el panel de favoritos

  Scenario: UT-FAVO-002 El usuario no tiene un token de autenticación
    Given el usuario no tiene un token de autenticacion
    When ejecuto loadFavorites
    Then la funcion fetchFavoritesAPI no es llamada
    And no se actualiza el estado ni se renderizan los favoritos

  Scenario: UT-FAVO-003 La API devuelve un error al intentar obtener los favoritos
    Given el usuario tiene un token "mockAuthToken"
    And la API lanza un error
    When ejecuto loadFavorites
    Then se captura el error y se muestra un mensaje en la consola
    And no se actualiza el estado ni se renderizan los favoritos