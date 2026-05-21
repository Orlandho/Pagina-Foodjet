Feature: CP-03 Integración de Billeteras Digitales

  Scenario: UT-WALLET-001 Intento de pago con billetera digital en restaurante sin QR
    Given el carrito contiene un producto disponible
    And el usuario ha iniciado sesion con un token valido
    And el metodo de pago seleccionado es "wallet"
    And el restaurante "KFC" del producto no tiene configurado un QR de pago
    When se procesa el checkout con handleCheckoutSubmit
    Then el flujo de pago es abortado
    And el modal de QR no se abre
    And se muestra una alerta toast con el mensaje "No se encontró el QR de pago para este restaurante"

  Scenario: UT-WALLET-002 Apertura exitosa del modal de pago Yape/QR
    Given el carrito contiene un producto disponible
    And el usuario ha iniciado sesion con un token valido
    And el metodo de pago seleccionado es "wallet"
    And el restaurante "Bembos" del producto tiene el QR "url_qr.png"
    When se procesa el checkout con handleCheckoutSubmit
    Then el elemento "#qrRestaurantName" muestra el texto "Bembos"
    And el elemento "#qrPaymentImage" recibe la ruta "url_qr.png"
    And el modal de QR se abre exitosamente llamando a qrModal.show()

  Scenario: UT-WALLET-003 Finalización del temporizador y envío de orden
    Given el carrito contiene un producto disponible
    And el usuario ha iniciado sesion con un token valido
    And el metodo de pago seleccionado es "wallet"
    And el restaurante "Bembos" del producto tiene el QR "url_qr.png"
    When se procesa el checkout con handleCheckoutSubmit
    And transcurren los 5 segundos completos del temporizador de pago
    Then el modal de QR se oculta llamando a qrModal.hide()
    And se ejecuta automaticamente la funcion submitOrder con los datos del pedido cargados