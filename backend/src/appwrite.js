const { once } = require('node:events');
const path = require('node:path');

if (process.env.DATABASE_URL) {
    const databaseUrl = new URL(process.env.DATABASE_URL);
    const certificate = databaseUrl.searchParams.get('sslcert');
    if (certificate && !path.isAbsolute(certificate)) {
        databaseUrl.searchParams.set('sslcert', path.resolve(__dirname, '../prisma', certificate));
        process.env.DATABASE_URL = databaseUrl.href;
    }
}

const app = require('./index');
const { simularPaso } = require('./jobs/simuladorPedidos');

const requestHeaders = ['authorization', 'content-type', 'if-modified-since', 'if-none-match'];
const transportHeaders = ['connection', 'content-encoding', 'content-length', 'keep-alive', 'transfer-encoding'];
let listener;

async function startExpress() {
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    server.unref();
    return `http://127.0.0.1:${server.address().port}`;
}

module.exports = async ({ req, res, error }) => {
    if (req.headers['x-appwrite-trigger'] === 'schedule') {
        await simularPaso();
        return res.json({ ok: true });
    }

    try {
        listener ??= startExpress();
        const url = new URL(await listener);
        url.pathname = req.path;
        url.search = req.queryString;

        const headers = new Headers();
        for (const name of requestHeaders) {
            if (req.headers[name] !== undefined) headers.set(name, req.headers[name]);
        }

        const body = ['GET', 'HEAD'].includes(req.method) ? undefined : req.bodyText;
        const result = await fetch(url, {
            method: req.method,
            headers,
            body,
            redirect: 'manual',
            signal: AbortSignal.timeout(25000)
        });

        const outgoing = Object.fromEntries(result.headers);
        for (const name of transportHeaders) delete outgoing[name];

        return res.binary(Buffer.from(await result.arrayBuffer()), result.status, outgoing);
    } catch (cause) {
        error(`Error al atender la solicitud: ${cause.message}`);
        return res.json({ error: 'FoodJet no pudo completar la solicitud.' }, 502);
    }
};
