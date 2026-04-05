const bcrypt = require('bcrypt');

let poolPromise = Promise.resolve({
    request: function() {
        let inputs = {};
        return {
            input: function(name, type, value) {
                inputs[name] = value;
                return this;
            },
            query: async function(sqlStr) {
                if (sqlStr.includes('SELECT 1 AS ok')) {
                    return { recordset: [{ ok: 1 }] };
                }
                if (sqlStr.includes('FROM dbo.products')) {
                    return {
                        recordset: [
                            {id: 1, name: 'Hamburguesa', description: 'desc', price: 10.0, image: 'https://images.unsplash.com/photo-1651843465180-5965076f7368?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500', category: 'Hamburguesas'}
                        ]
                    };
                }
                if (sqlStr.includes('WHERE email = @email')) {
                    if (sqlStr.includes('SELECT id, name, email, password')) {
                        const hash = await bcrypt.hash('123456', 10);
                        return { recordset: [{ id: 1, name: 'Juan Perez', email: 'juan@example.com', password: hash }] };
                    }
                    return { recordset: [] }; // check email
                }
                if (sqlStr.includes('INSERT INTO dbo.users')) {
                    return { recordset: [{ id: 1, name: inputs['name'], email: inputs['email'], created_at: new Date() }] };
                }
                if (sqlStr.includes('INSERT INTO dbo.orders')) {
                    return { recordset: [{ id: 1 }] };
                }
                if (sqlStr.includes('INSERT INTO dbo.order_items')) {
                    return { recordset: [] };
                }
                return { recordset: [] };
            }
        };
    },
    transaction: function() {
        return {
            begin: async () => {},
            commit: async () => {},
            rollback: async () => {},
            request: function() {
                return poolPromise.then(p => p.request());
            }
        };
    }
});

function getPool() {
    return poolPromise;
}

module.exports = {
    sql: {
        NVarChar: () => {},
        VarChar: () => {},
        Int: () => {},
        Decimal: () => {},
        Request: function() {
            return poolPromise.then(p => p.request()); // wait, new sql.Request(pool) is used
        },
        Transaction: function() {
            return poolPromise.then(p => p.transaction());
        }
    },
    getPool
};
