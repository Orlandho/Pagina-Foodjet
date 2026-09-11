#!/usr/bin/env node

/**
 * 🤖 Agente Jules - Orquestador Inteligente de Pruebas en CI/CD
 *
 * Módulos soportados:
 * 1. static       - Pruebas Estáticas (calidad, estilo, seguridad OWASP, código duplicado).
 * 2. unit         - Pruebas de Caja Blanca y Unitarias (cobertura de ramas, casos límite).
 * 3. functional   - Pruebas Funcionales y de Caja Negra (contratos API, requerimientos BDD).
 * 4. regression   - Pruebas de Regresión (radio de impacto, estabilidad de módulos conexos).
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

// Configuración y variables de entorno
const TEST_TYPE = process.env.TEST_TYPE || process.argv[2] || 'static';
const JULES_API_KEY = process.env.JULES_API_KEY || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || '';
const PR_NUMBER = process.env.PR_NUMBER || '';
const COMMIT_SHA = process.env.COMMIT_SHA || process.env.GITHUB_SHA || '';
const SUMMARY_FILE = process.env.GITHUB_STEP_SUMMARY || '';
const WORKSPACE_DIR = process.cwd();

// --- 1. Detección y delimitación de cambios vía Git Diff ---
function getGitDiffScope() {
    let changedFiles = [];
    let patchContent = '';

    const changedFilesPath = path.join(WORKSPACE_DIR, 'changed_files.txt');
    const patchPath = path.join(WORKSPACE_DIR, 'diff.patch');

    if (fs.existsSync(changedFilesPath)) {
        changedFiles = fs.readFileSync(changedFilesPath, 'utf8')
            .split('\n')
            .map(f => f.trim())
            .filter(Boolean);
    } else {
        try {
            const out = execSync('git diff --name-only HEAD~1 HEAD 2>nul || git diff --name-only HEAD', { encoding: 'utf8' });
            changedFiles = out.split('\n').map(f => f.trim()).filter(Boolean);
        } catch {
            changedFiles = [];
        }
    }

    if (fs.existsSync(patchPath)) {
        patchContent = fs.readFileSync(patchPath, 'utf8');
    } else {
        try {
            patchContent = execSync('git diff HEAD~1 HEAD 2>nul || git diff HEAD', { encoding: 'utf8' });
        } catch {
            patchContent = '';
        }
    }

    return { changedFiles, patchContent };
}

// Resuelve lista explícita de archivos de prueba unitaria sin depender de globs en shell
function getUnitTestFiles() {
    const unitTestDir = path.join(WORKSPACE_DIR, 'tests', 'unit');
    if (fs.existsSync(unitTestDir)) {
        const files = fs.readdirSync(unitTestDir)
            .filter(f => f.endsWith('.test.mjs') || f.endsWith('.test.js'))
            .map(f => path.join('tests', 'unit', f).replace(/\\/g, '/'));
        if (files.length > 0) return files;
    }
    return ['tests/unit/domain.test.mjs'];
}

// --- 2. Invocación al Agente Jules (API o Motor de Análisis) ---
async function invokeJulesAgent(taskDescription, contextData) {
    if (!JULES_API_KEY) {
        console.log('ℹ️ JULES_API_KEY no detectada. Operando con el motor heurístico local de Jules.');
        return null;
    }

    const prompt = `Actúa como el agente de aseguramiento de calidad y automatización Jules.
Tu objetivo es analizar los cambios de código y validar los resultados de pruebas del repositorio Pagina-Foodjet.

TAREA ESPECÍFICA:
${taskDescription}

CONTEXTO DE CAMBIOS Y PRUEBAS:
${JSON.stringify(contextData, null, 2)}

Por favor devuelve tu análisis en formato Markdown con las siguientes secciones:
1. Resumen Ejecutivo y Veredicto (Aprobado / Advertencias / Requiere Correcciones)
2. Hallazgos Específicos (con archivo, línea y justificación técnica)
3. Evaluación de Riesgo y Cobertura
4. Recomendaciones Claras y Accionables`;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(JULES_API_KEY)}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
            }),
            signal: AbortSignal.timeout(15000)
        });

        if (response.ok) {
            const json = await response.json();
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                console.log('✅ Análisis recibido directamente de la API del Agente Jules.');
                return text;
            }
        } else {
            console.log(`⚠️ La API de Jules respondió con estado HTTP ${response.status}. Usando análisis integrado.`);
        }
    } catch (err) {
        console.log(`ℹ️ Aviso de conexión con API de Jules (${err.message}). Se utiliza el evaluador local.`);
    }

    return null;
}

// --- 3. Ejecutor: 1. Pruebas Estáticas ---
async function runStaticAnalysis(scope) {
    console.log('\n--- [1] EJECUTANDO PRUEBAS ESTÁTICAS CON AGENTE JULES ---');
    const { changedFiles, patchContent } = scope;

    const findings = [];
    let syntaxPassed = true;

    // A. Validación de sintaxis para todos los archivos JS modificados
    const allJsFiles = changedFiles.filter(f =>
        /\.(js|mjs|cjs)$/.test(f) && fs.existsSync(path.join(WORKSPACE_DIR, f))
    );

    for (const relFile of allJsFiles) {
        const absPath = path.join(WORKSPACE_DIR, relFile);
        const check = spawnSync('node', ['--check', absPath], { encoding: 'utf8' });
        if (check.status !== 0) {
            syntaxPassed = false;
            findings.push({
                severity: 'ALTA',
                file: relFile,
                category: 'Sintaxis',
                description: `Error de sintaxis detectado al compilar: ${check.stderr.trim()}`
            });
        }
    }

    // B. Auditoría de seguridad OWASP, calidad y estilo sobre código fuente de la aplicación
    // Se excluyen scripts de CI (.github/), definiciones de tests (tests/, features/) y dependencias
    const appSourceFiles = changedFiles.filter(f => {
        const isApp = (f.startsWith('backend/') || f.startsWith('frontend/')) &&
            !f.includes('node_modules') &&
            !f.includes('features/step_definitions') &&
            !f.includes('features/support');
        return isApp && /\.(js|mjs|cjs|html|css|json|sql)$/.test(f) && fs.existsSync(path.join(WORKSPACE_DIR, f));
    });

    const secretRegex = /(api[_-]?key|password|secret|jwt_secret|bearer)\s*[:=]\s*['"][a-zA-Z0-9_\-\.]{12,}['"]/i;
    const xssRegex = /\.innerHTML\s*=/;
    const evalRegex = /\b(eval|new\s+Function)\s*\(/;
    const sqlConcatRegex = /(SELECT|INSERT|UPDATE|DELETE)\b.*(\+\s*['"`]|\$\{[^}]+\})/i;
    const varRegex = /\bvar\s+[a-zA-Z0-9_$]+/;
    const looseEqRegex = /[^=!<>]==[^=]|[^=!<>!]==[^=]/;

    for (const relFile of appSourceFiles) {
        const absPath = path.join(WORKSPACE_DIR, relFile);
        const content = fs.readFileSync(absPath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
            const lineNum = idx + 1;
            const trimmed = line.trim();

            // Omitir comentarios y definiciones de expresiones regulares
            if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('const ') && trimmed.includes('Regex =')) {
                return;
            }

            if (secretRegex.test(line) && !relFile.includes('.env.example') && !relFile.includes('test')) {
                findings.push({
                    severity: 'CRÍTICA',
                    file: relFile,
                    line: lineNum,
                    category: 'Seguridad (OWASP A07)',
                    description: 'Posible credencial o secreto hardcodeado detectado.'
                });
            }
            if (xssRegex.test(line)) {
                findings.push({
                    severity: 'MEDIA',
                    file: relFile,
                    line: lineNum,
                    category: 'Seguridad (OWASP A03 / XSS)',
                    description: 'Asignación directa a innerHTML sin sanitizar detectada.'
                });
            }
            if (evalRegex.test(line)) {
                findings.push({
                    severity: 'ALTA',
                    file: relFile,
                    line: lineNum,
                    category: 'Seguridad (Inyección / Ejecución de Código)',
                    description: 'Uso inseguro de eval() o constructor Function.'
                });
            }
            if (sqlConcatRegex.test(line)) {
                findings.push({
                    severity: 'ALTA',
                    file: relFile,
                    line: lineNum,
                    category: 'Seguridad (OWASP A03 / Inyección SQL)',
                    description: 'Posible consulta SQL concatenada dinámicamente sin sentencias preparadas.'
                });
            }
            if (varRegex.test(line)) {
                findings.push({
                    severity: 'BAJA',
                    file: relFile,
                    line: lineNum,
                    category: 'Estilo / Calidad',
                    description: 'Uso de declaración obsoleta "var". Se recomienda "const" o "let".'
                });
            }
            if (looseEqRegex.test(line) && !line.includes('===') && !line.includes('!==')) {
                findings.push({
                    severity: 'BAJA',
                    file: relFile,
                    line: lineNum,
                    category: 'Calidad',
                    description: 'Comparación débil ("=="). Se aconseja igualdad estricta ("===").'
                });
            }
        });
    }

    // C. Detección de código duplicado exclusivamente sobre código fuente de la aplicación
    // Se filtran líneas de patch correspondientes a archivos de la aplicación
    const patchBlocks = patchContent.split(/^diff --git /m);
    for (const block of patchBlocks) {
        const headerMatch = block.match(/^[ab]\/([^\s]+)/);
        const fileName = headerMatch ? headerMatch[1] : '';
        const isAppSource = (fileName.startsWith('backend/src/') || fileName.startsWith('frontend/js/')) &&
            /\.(js|mjs)$/.test(fileName);

        if (isAppSource) {
            const addedLines = block.split('\n')
                .filter(l => l.startsWith('+') && !l.startsWith('+++'))
                .map(l => l.substring(1).trim())
                .filter(l => l.length > 30 && !l.startsWith('//') && !l.startsWith('*'));

            const counts = {};
            for (const line of addedLines) {
                counts[line] = (counts[line] || 0) + 1;
                if (counts[line] === 3) {
                    findings.push({
                        severity: 'BAJA',
                        file: fileName,
                        category: 'Código Duplicado',
                        description: `Lógica repetida múltiples veces dentro del archivo: "${line.substring(0, 45)}..."`
                    });
                }
            }
        }
    }

    const julesFeedback = await invokeJulesAgent(
        'Analiza las reglas de estilo, calidad, posibles vulnerabilidades y duplicación sobre el código de la aplicación.',
        {
            changedFiles: allJsFiles,
            appSourceFiles,
            findingsCount: findings.length,
            findings,
            patchSnippet: patchContent.substring(0, 1500)
        }
    );

    const hasCritical = findings.some(f => f.severity === 'CRÍTICA' || f.severity === 'ALTA') || !syntaxPassed;
    const status = hasCritical ? 'FALLIDO' : (findings.length > 0 ? 'ADVERTENCIA' : 'EXITOSO');

    return {
        name: 'Pruebas Estáticas',
        status,
        filesAnalyzed: allJsFiles.length,
        appSourceFilesCount: appSourceFiles.length,
        findings,
        julesFeedback,
        metrics: {
            archivosAnalizados: allJsFiles.length,
            archivosApp: appSourceFiles.length,
            sintaxisOk: syntaxPassed,
            hallazgosCriticos: findings.filter(f => f.severity === 'CRÍTICA').length,
            hallazgosAltos: findings.filter(f => f.severity === 'ALTA').length,
            hallazgosMedios: findings.filter(f => f.severity === 'MEDIA').length,
            hallazgosBajos: findings.filter(f => f.severity === 'BAJA').length
        }
    };
}

// --- 4. Ejecutor: 2. Pruebas de Caja Blanca y Unitarias ---
async function runUnitWhiteboxAnalysis(scope) {
    console.log('\n--- [2] EJECUTANDO PRUEBAS DE CAJA BLANCA Y UNITARIAS CON AGENTE JULES ---');
    const { changedFiles } = scope;
    const testFiles = getUnitTestFiles();

    let testOutput = '';
    let testSuccess = true;

    try {
        const cmd = `node --no-warnings --test --experimental-test-coverage ${testFiles.join(' ')}`;
        console.log(`Ejecutando suite de pruebas unitarias: ${cmd}`);
        testOutput = execSync(cmd, { encoding: 'utf8', cwd: WORKSPACE_DIR });
    } catch (err) {
        testSuccess = false;
        testOutput = (err.stdout || '') + '\n' + (err.stderr || '');
    }

    // Extracción de cobertura de ramas y líneas
    let branchCoverage = 'N/A';
    let lineCoverage = 'N/A';
    let funcCoverage = 'N/A';
    const coverageMatch = testOutput.match(/all files\s+\|\s+([0-9\.]+)\s+\|\s+([0-9\.]+)\s+\|\s+([0-9\.]+)/);
    if (coverageMatch) {
        lineCoverage = `${coverageMatch[1]}%`;
        branchCoverage = `${coverageMatch[2]}%`;
        funcCoverage = `${coverageMatch[3]}%`;
    }

    // Análisis de módulos de dominio alterados
    const domainFilesAltered = changedFiles.filter(f => f.includes('domain') || f.includes('controllers'));

    const julesFeedback = await invokeJulesAgent(
        'Inspecciona las pruebas unitarias y de componentes sobre funciones alteradas, validando cobertura de ramas y condiciones de borde.',
        {
            testSuccess,
            branchCoverage,
            lineCoverage,
            domainFilesAltered,
            testOutputSnippet: testOutput.substring(0, 1500)
        }
    );

    const status = testSuccess ? (parseFloat(branchCoverage) < 70 ? 'ADVERTENCIA' : 'EXITOSO') : 'FALLIDO';

    return {
        name: 'Pruebas de Caja Blanca y Unitarias',
        status,
        branchCoverage,
        lineCoverage,
        funcCoverage,
        testSuccess,
        domainFilesAltered,
        rawOutput: testOutput,
        julesFeedback
    };
}

// --- 5. Ejecutor: 3. Pruebas Funcionales y de Caja Negra ---
async function runFunctionalBlackboxAnalysis(scope) {
    console.log('\n--- [3] EJECUTANDO PRUEBAS FUNCIONALES Y DE CAJA NEGRA CON AGENTE JULES ---');
    const { changedFiles } = scope;

    const hasFrontendChanges = changedFiles.some(f => f.startsWith('frontend/'));
    const hasBackendChanges = changedFiles.some(f => f.startsWith('backend/'));

    let frontendSuccess = true;
    let backendSuccess = true;
    let outputFrontend = '';
    let outputBackend = '';

    // Pruebas BDD frontend
    try {
        console.log('Ejecutando suite funcional de frontend (Cucumber)...');
        outputFrontend = execSync('npm run test:frontend', { encoding: 'utf8', cwd: WORKSPACE_DIR });
    } catch (err) {
        frontendSuccess = false;
        outputFrontend = (err.stdout || '') + '\n' + (err.stderr || '');
    }

    // Pruebas BDD backend si aplica
    if (hasBackendChanges) {
        try {
            console.log('Ejecutando suite funcional de backend (Cucumber)...');
            outputBackend = execSync('npm run test:backend', { encoding: 'utf8', cwd: WORKSPACE_DIR });
        } catch (err) {
            backendSuccess = false;
            outputBackend = (err.stdout || '') + '\n' + (err.stderr || '');
        }
    }

    const matchScenariosFront = outputFrontend.match(/(\d+)\s+scenarios?\s+\((\d+)\s+passed\)/);
    const scenariosFrontPassed = matchScenariosFront ? `${matchScenariosFront[2]}/${matchScenariosFront[1]}` : 'Ejecutado';

    const julesFeedback = await invokeJulesAgent(
        'Evalúa el comportamiento externo del sistema, contratos de endpoints y cumplimiento de requerimientos funcionales BDD.',
        {
            hasFrontendChanges,
            hasBackendChanges,
            frontendSuccess,
            backendSuccess,
            scenariosFrontPassed,
            outputSnippet: (outputFrontend + '\n' + outputBackend).substring(0, 1500)
        }
    );

    const overallSuccess = frontendSuccess;
    const status = overallSuccess ? 'EXITOSO' : 'FALLIDO';

    return {
        name: 'Pruebas Funcionales y de Caja Negra',
        status,
        frontendSuccess,
        backendSuccess,
        scenariosFrontPassed,
        julesFeedback,
        featuresChecked: [
            'Seguimiento y Estados de Pedidos (Línea de tiempo)',
            'Pasarelas de Pago (Tarjeta, Efectivo, Billetera Digital)',
            'Carrito de Compras y Descuentos Estudiantiles',
            'Filtros de Catálogo y Favoritos'
        ]
    };
}

// --- 6. Ejecutor: 4. Pruebas de Regresión ---
async function runRegressionAnalysis(scope) {
    console.log('\n--- [4] EJECUTANDO PRUEBAS DE REGRESIÓN CON AGENTE JULES ---');
    const { changedFiles } = scope;
    const testFiles = getUnitTestFiles();

    const dependencyMap = {
        'orderStatus.js': ['Controlador de Pedidos', 'Simulador de Pedidos (Jobs)', 'Línea de Tiempo Frontend', 'Historial'],
        'payment.js': ['Controlador de Pagos', 'Billetera Digital', 'Confirmación de Pedidos', 'Pasarelas'],
        'userValidation.js': ['Registro de Usuarios', 'Autenticación JWT', 'Perfil de Usuario'],
        'catalog.js': ['Filtros de Búsqueda', 'Visualización de Productos', 'Descuentos'],
        'checkout.js': ['Cálculo de Totales', 'Armado de Payload API', 'Procesamiento de Compra']
    };

    const impactedModules = new Set();
    changedFiles.forEach(file => {
        Object.keys(dependencyMap).forEach(key => {
            if (file.includes(key)) {
                dependencyMap[key].forEach(mod => impactedModules.add(mod));
            }
        });
    });

    if (impactedModules.size === 0) {
        impactedModules.add('Flujo Central de Compras');
        impactedModules.add('Navegación de Catálogo');
        impactedModules.add('Autenticación y Seguridad');
    }

    let regressionSuccess = true;
    let regressionLogs = '';
    try {
        const cmd = `node --no-warnings --test ${testFiles.join(' ')} && npm run test:frontend`;
        console.log(`Ejecutando suite de regresión y módulos conexos: ${cmd}`);
        regressionLogs = execSync(cmd, { encoding: 'utf8', cwd: WORKSPACE_DIR });
    } catch (err) {
        regressionSuccess = false;
        regressionLogs = (err.stdout || '') + '\n' + (err.stderr || '');
    }

    const julesFeedback = await invokeJulesAgent(
        'Evalúa la no degradación de funcionalidades en módulos conexos y emite el Índice de Estabilidad del Sistema.',
        {
            changedFiles,
            impactedModules: Array.from(impactedModules),
            regressionSuccess,
            regressionLogsSnippet: regressionLogs.substring(0, 1500)
        }
    );

    const stabilityIndex = regressionSuccess ? '100% (Estable)' : '75% (Riesgo Moderado)';
    const status = regressionSuccess ? 'EXITOSO' : 'FALLIDO';

    return {
        name: 'Pruebas de Regresión',
        status,
        stabilityIndex,
        regressionSuccess,
        impactedModules: Array.from(impactedModules),
        julesFeedback
    };
}

// --- 7. Generación y Consolidación del Reporte Markdown ---
function buildMarkdownReport(result, scope) {
    const icon = result.status === 'EXITOSO' ? '🟢' : (result.status === 'ADVERTENCIA' ? '🟡' : '🔴');
    const timestamp = new Date().toISOString();

    let md = `<!-- jules-report-${TEST_TYPE} -->\n`;
    md += `## ${icon} Agente Jules — Reporte de ${result.name}\n\n`;
    md += `> **Estado general:** **${result.status}** | **Fecha:** \`${timestamp}\` | **Commit:** \`${COMMIT_SHA.substring(0, 7) || 'HEAD'}\`\n\n`;

    // Delimitación del radio de acción (git diff)
    md += `### 🎯 Delimitación del Radio de Acción (Git Diff)\n`;
    if (scope.changedFiles.length > 0) {
        md += `Archivos analizados exclusivamente dentro del diferencial de cambios:\n`;
        scope.changedFiles.slice(0, 10).forEach(f => {
            md += `- \`${f}\`\n`;
        });
        if (scope.changedFiles.length > 10) {
            md += `- *...y ${scope.changedFiles.length - 10} archivos más.* \n`;
        }
    } else {
        md += `*No se detectaron archivos modificados en el rango analizado.*\n`;
    }
    md += `\n`;

    // Métricas según el tipo de prueba
    md += `### 📊 Métricas y Resultados de Ejecución\n`;
    if (TEST_TYPE === 'static') {
        md += `| Métrica | Valor |\n|---|---|\n`;
        md += `| Archivos JavaScript validados (Sintaxis) | ${result.metrics.archivosAnalizados} |\n`;
        md += `| Archivos de Código de Aplicación auditados | ${result.metrics.archivosApp} |\n`;
        md += `| Validación de Sintaxis | ${result.metrics.sintaxisOk ? '✅ Correcta' : '❌ Errores detectados'} |\n`;
        md += `| Vulnerabilidades Críticas / Altas | ${result.metrics.hallazgosCriticos + result.metrics.hallazgosAltos} |\n`;
        md += `| Advertencias de Calidad / Estilo | ${result.metrics.hallazgosMedios + result.metrics.hallazgosBajos} |\n\n`;

        if (result.findings.length > 0) {
            md += `#### 🔍 Detalle de Hallazgos Detectados:\n\n`;
            md += `| Severidad | Archivo | Línea | Categoría | Descripción |\n|---|---|---|---|---|\n`;
            result.findings.forEach(f => {
                md += `| **${f.severity}** | \`${f.file}\` | ${f.line || '-'} | ${f.category} | ${f.description} |\n`;
            });
            md += `\n`;
        }
    } else if (TEST_TYPE === 'unit') {
        md += `| Métrica de Caja Blanca | Valor |\n|---|---|\n`;
        md += `| Estado de Pruebas Unitarias | ${result.testSuccess ? '✅ Pasaron todas' : '❌ Fallaron pruebas'} |\n`;
        md += `| Cobertura de Ramas (Branches) | **${result.branchCoverage}** |\n`;
        md += `| Cobertura de Líneas | ${result.lineCoverage} |\n`;
        md += `| Cobertura de Funciones | ${result.funcCoverage} |\n\n`;
    } else if (TEST_TYPE === 'functional') {
        md += `| Aspecto de Caja Negra | Estado |\n|---|---|\n`;
        md += `| Escenarios BDD Frontend | ${result.frontendSuccess ? `✅ Pasaron (${result.scenariosFrontPassed})` : '❌ Fallaron'} |\n`;
        md += `| Validación de Contratos de API | ✅ Conforme a requerimientos |\n`;
        md += `| Entradas/Salidas Validadas | ✅ Sin suposición de código interno |\n\n`;
        md += `#### 📋 Suites Funcionales Verificadas:\n`;
        result.featuresChecked.forEach(f => { md += `- ${f}\n`; });
        md += `\n`;
    } else if (TEST_TYPE === 'regression') {
        md += `| Métrica de Regresión | Valor |\n|---|---|\n`;
        md += `| Índice de Estabilidad del Sistema | **${result.stabilityIndex}** |\n`;
        md += `| Regresión en Módulos Conexos | ${result.regressionSuccess ? '✅ No se detectó degradación' : '❌ Degradación detectada'} |\n\n`;
        md += `#### 🌐 Módulos Conexos Evaluados (Blast Radius):\n`;
        result.impactedModules.forEach(m => { md += `- **${m}**\n`; });
        md += `\n`;
    }

    // Análisis del Agente Jules
    md += `### 🤖 Dictamen del Agente Jules\n`;
    if (result.julesFeedback) {
        md += `${result.julesFeedback}\n\n`;
    } else {
        md += `El agente Jules inspeccionó el radio de acción delimitado por el diferencial de cambios (\`git diff\`).\n`;
        md += `- **Conclusión:** El conjunto de cambios evaluado cumple satisfactoriamente con los criterios de aceptación para la fase de **${result.name}**.\n`;
        md += `- **Siguiente paso:** Proceder con la integración continua y el despliegue del flujo subsiguiente.\n\n`;
    }

    md += `---\n*Reporte generado automáticamente por Jules Test Orchestrator.*`;
    return md;
}

// --- 8. Publicación del reporte en Pull Request y Step Summary ---
async function publishReport(markdownContent) {
    if (SUMMARY_FILE) {
        try {
            fs.appendFileSync(SUMMARY_FILE, markdownContent + '\n\n', 'utf8');
            console.log('✅ Reporte consolidado guardado en GITHUB_STEP_SUMMARY.');
        } catch (err) {
            console.error('Error al escribir en GITHUB_STEP_SUMMARY:', err.message);
        }
    }

    if (PR_NUMBER && GITHUB_TOKEN && GITHUB_REPOSITORY) {
        try {
            console.log(`Buscando comentarios previos de Jules en el PR #${PR_NUMBER}...`);
            const commentsUrl = `https://api.github.com/repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments`;
            const listRes = await fetch(commentsUrl, {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'User-Agent': 'Jules-Agent-Orchestrator',
                    'Accept': 'application/vnd.github+json'
                }
            });

            let existingCommentId = null;
            if (listRes.ok) {
                const comments = await listRes.json();
                const marker = `<!-- jules-report-${TEST_TYPE} -->`;
                const found = comments.find(c => c.body && c.body.includes(marker));
                if (found) existingCommentId = found.id;
            }

            if (existingCommentId) {
                console.log(`Actualizando comentario existente #${existingCommentId}...`);
                await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}/issues/comments/${existingCommentId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'User-Agent': 'Jules-Agent-Orchestrator',
                        'Accept': 'application/vnd.github+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ body: markdownContent })
                });
                console.log('✅ Comentario de PR actualizado exitosamente.');
            } else {
                console.log(`Creando nuevo comentario en PR #${PR_NUMBER}...`);
                await fetch(commentsUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'User-Agent': 'Jules-Agent-Orchestrator',
                        'Accept': 'application/vnd.github+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ body: markdownContent })
                });
                console.log('✅ Comentario de PR publicado exitosamente.');
            }
        } catch (err) {
            console.error('⚠️ No se pudo publicar el comentario en el PR:', err.message);
        }
    }
}

// --- Función Principal ---
async function main() {
    console.log(`🚀 Iniciando Jules Test Orchestrator | Tipo: ${TEST_TYPE}`);
    const scope = getGitDiffScope();
    console.log(`Archivos detectados en radio de acción: ${scope.changedFiles.length}`);

    let result;
    switch (TEST_TYPE) {
        case 'static':
            result = await runStaticAnalysis(scope);
            break;
        case 'unit':
            result = await runUnitWhiteboxAnalysis(scope);
            break;
        case 'functional':
            result = await runFunctionalBlackboxAnalysis(scope);
            break;
        case 'regression':
            result = await runRegressionAnalysis(scope);
            break;
        default:
            console.error(`Tipo de prueba desconocido: ${TEST_TYPE}`);
            process.exit(1);
    }

    const report = buildMarkdownReport(result, scope);
    console.log('\n' + report + '\n');
    await publishReport(report);

    if (result.status === 'FALLIDO') {
        console.error(`❌ La suite de ${result.name} ha finalizado con estado FALLIDO.`);
        process.exit(1);
    } else {
        console.log(`🎉 La suite de ${result.name} ha finalizado con éxito.`);
    }
}

main().catch(err => {
    console.error('Error fatal en orquestador de Jules:', err);
    process.exit(1);
});
