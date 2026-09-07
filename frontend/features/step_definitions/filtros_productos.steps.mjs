import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { filterProducts } from '../../js/domain/catalog.js';

// Se prueba la filterProducts real de js/domain/catalog.js.

Given(
    'una lista con un producto de precio {int}, tiempo {string} y categoria {string}',
    function (precio, tiempo, categoria) {
        this.products = [{
            id: 1,
            precio,
            tipo_comida: categoria,
            Restaurant: { tiempo_entrega: tiempo }
        }];
    }
);

Given(
    'los parametros de filtro son minPrice {int}, maxPrice {int}, maxTime {int} y categoria {string}',
    function (minPrice, maxPrice, maxTime, categoria) {
        this.filtros = { minPrice, maxPrice, maxTime, categorias: [categoria] };
    }
);

Given(
    'los parametros de filtro son minPrice {int}, maxPrice {int}, maxTime {int} y sin categoria especifica',
    function (minPrice, maxPrice, maxTime) {
        this.filtros = { minPrice, maxPrice, maxTime, categorias: [] };
    }
);

When('ejecuto la funcion de filtrado', function () {
    const { minPrice, maxPrice, maxTime, categorias } = this.filtros;
    this.resultado = filterProducts(this.products, minPrice, maxPrice, maxTime, categorias);
});

Then('el producto es incluido de forma correcta en el arreglo', function () {
    expect(this.resultado[0].id).to.equal(1);
});

Then('el producto queda descartado por sobrepasar el tiempo de entrega maximo', function () {
    expect(this.resultado).to.have.lengthOf(0);
});

Then('el sistema omite el producto por discrepancia de categorias', function () {
    expect(this.resultado).to.have.lengthOf(0);
});

Then('la longitud del arreglo resultante es exactamente {int}', function (longitud) {
    expect(this.resultado).to.have.lengthOf(longitud);
});
