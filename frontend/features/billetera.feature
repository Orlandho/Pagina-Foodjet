Feature: CP-03 Integración de Billeteras Digitales

  Scenario: UT-WALLET-001 Intento de pago con billetera digital en restaurante sin QR
    Given el carrito contiene un producto disponible
    And el usuario ha iniciado sesion con un token valido
    And el metodo de pago seleccionado es "wallet"
    And el restaurante "KFC" del producto no tiene configurado un QR de pago
    When se procesa el checkout con billetera digital
    Then el flujo de pago es abortado
    And se informa al usuario con el mensaje "No se encontró el QR de pago para este restaurante"

  Scenario: UT-WALLET-002 Resolución del QR del restaurante para el cobro
    Given el carrito contiene un producto disponible
    And el usuario ha iniciado sesion con un token valido
    And el metodo de pago seleccionado es "wallet"
    And el restaurante "Bembos" del producto tiene el QR "url_qr.png"
    When se procesa el checkout con billetera digital
    Then el restaurante resuelto para el cobro es "Bembos" con el QR "url_qr.png"

  Scenario: UT-WALLET-003 Construcción del pedido que se envía tras confirmar el pago
    Given el carrito contiene un producto disponible
    And el usuario ha iniciado sesion con un token valido
    And el metodo de pago seleccionado es "wallet"
    And el restaurante "Bembos" del producto tiene el QR "url_qr.png"
    When se procesa el checkout con billetera digital
    Then el pedido enviado lleva el metodo de pago "wallet" y el restaurante 5
    And el pedido enviado contiene 1 articulo
