/**
 * Dos perfiles porque las dos mitades del proyecto usan sistemas de módulos
 * distintos: el frontend se sirve como módulos ES y el backend es CommonJS.
 * Cucumber 12 carga ESM de forma nativa con `import`, sin transpilación.
 *
 *   npm run test:frontend
 *   npm run test:backend
 *   npm test              (ambos)
 */
const common = {
    format: ['progress-bar', 'html:reports/cucumber.html'],
    formatOptions: { snippetInterface: 'async-await' }
};

module.exports = {
    frontend: {
        ...common,
        paths: ['frontend/features/**/*.feature'],
        import: ['frontend/features/step_definitions/**/*.mjs', 'frontend/features/support/**/*.mjs']
    },
    backend: {
        ...common,
        paths: ['backend/features/**/*.feature'],
        require: ['backend/features/step_definitions/**/*.js', 'backend/features/support/**/*.js']
    }
};
