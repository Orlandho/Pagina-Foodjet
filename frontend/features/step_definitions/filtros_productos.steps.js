const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

// Variables para el estado de la prueba
let testProducts = [];
let minPrice = 0;
let maxPrice = 0;
let maxTime = 0;
let selectedCategories = [];
let filteredProductsResult = [];

// ==========================================
// CÓDIGO REFACTORIZADO
// ==========================================

// Función pura auxiliar: Extrae y parsea el tiempo de entrega
function parseDeliveryTime(tiempoStr) {
    if (!tiempoStr) return 999999;
    if (tiempoStr.includes("30")) return 30;
    if (tiempoStr.includes("Más de 1 hora")) return 90;
    if (tiempoStr.includes("1 hora")) return 60;

    return parseInt(tiempoStr) || 0;
}

// Función principal de filtrado más limpia y declarativa
function executeOriginalFilter(products, minPrice, maxPrice, maxTime, selectedCategories) {
    return products.filter(product => {
        const matchesPrice = product.precio >= minPrice && product.precio <= maxPrice;

        // Uso de la función auxiliar y Optional Chaining (?.) para evitar errores si el objeto Restaurant es undefined
        const productTime = parseDeliveryTime(product.Restaurant?.tiempo_entrega);
        const matchesTime = productTime <= maxTime;

        const categoryName = product.categoria?.nombre || product.tipo_comida;
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(categoryName);

        return matchesPrice && matchesTime && matchesCategory;
    });
}

// ==========================================
// PASOS DE CUCUMBER
// ==========================================

Given('una lista con un producto de precio {int}, tiempo {string} y categoria {string}', function (precio, tiempo, categoria) {
    testProducts = [{
        precio: precio,
        Restaurant: { tiempo_entrega: tiempo },
        categoria: { nombre: categoria }
    }];
});

Given('los parametros de filtro son minPrice {int}, maxPrice {int}, maxTime {int} y categoria {string}', function (minP, maxP, maxT, categoria) {
    minPrice = minP;
    maxPrice = maxP;
    maxTime = maxT;
    selectedCategories = [categoria];
});

Given('los parametros de filtro son minPrice {int}, maxPrice {int}, maxTime {int} y sin categoria especifica', function (minP, maxP, maxT) {
    minPrice = minP;
    maxPrice = maxP;
    maxTime = maxT;
    selectedCategories = [];
});

When('ejecuto la funcion de filtrado', function () {
    filteredProductsResult = executeOriginalFilter(
        testProducts, minPrice, maxPrice, maxTime, selectedCategories
    );
});

Then('el producto es incluido de forma correcta en el arreglo', function () {
    expect(filteredProductsResult).to.have.lengthOf.at.least(1);
    expect(filteredProductsResult[0].categoria.nombre).to.equal('Pizza');
});

Then('el producto queda descartado por sobrepasar el tiempo de entrega maximo', function () {
    expect(filteredProductsResult).to.be.an('array').that.is.empty;
});

Then('el sistema omite el producto por discrepancia de categorias', function () {
    expect(filteredProductsResult).to.be.an('array').that.is.empty;
});

Then('la longitud del arreglo resultante es exactamente {int}', function (longitudEsperada) {
    expect(filteredProductsResult.length).to.equal(longitudEsperada);
});