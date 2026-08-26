const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// Update /api/settings POST
code = code.replace(
    'const { storeName, profilePic, email, phone, password } = req.body;',
    'const { storeName, profilePic, email, phone, password, sandboxMode } = req.body;'
).replace(
    'if (password !== undefined) {\n            values.push(password);\n            setParts.push(`password = $${values.length}`);\n        }',
    'if (password !== undefined) {\n            values.push(password);\n            setParts.push(`password = $${values.length}`);\n        }\n        if (sandboxMode !== undefined) {\n            values.push(sandboxMode);\n            setParts.push(`sandbox_mode = $${values.length}`);\n        }'
).replace(
    'SELECT store_name as "storeName", profile_pic as "profilePic", email, phone, password FROM settings',
    'SELECT store_name as "storeName", profile_pic as "profilePic", email, phone, password, sandbox_mode as "sandboxMode" FROM settings'
);

// Update /api/dashboard GET
code = code.replace(
    'const { rows: trxRows } = await client.query(\'SELECT id, time, nominal, unique_code as "unique", total, status, qris_string FROM transactions ORDER BY created_at DESC\');\n        const { rows: logRows } = await client.query(\'SELECT time, payload FROM logs ORDER BY created_at DESC LIMIT 10\');\n        const { rows: setRows } = await client.query(\'SELECT store_name as "storeName", profile_pic as "profilePic", email, phone, password FROM settings WHERE id = 1\');',
    `const { rows: setRows } = await client.query('SELECT store_name as "storeName", profile_pic as "profilePic", email, phone, password, sandbox_mode as "sandboxMode" FROM settings WHERE id = 1');\n        const isSandbox = setRows[0].sandboxMode === true;\n        const { rows: trxRows } = await client.query('SELECT id, time, nominal, unique_code as "unique", total, status, qris_string FROM transactions WHERE is_sandbox = $1 ORDER BY created_at DESC', [isSandbox]);\n        const { rows: logRows } = await client.query('SELECT time, payload FROM logs WHERE is_sandbox = $1 ORDER BY created_at DESC LIMIT 10', [isSandbox]);`
);

// Update /api/qris/create POST
code = code.replace(
    `await client.query(
            'INSERT INTO transactions (id, time, nominal, unique_code, total, status, qris_string) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [trx.id, trx.time, trx.nominal, trx.unique, trx.total, trx.status, trx.qris_string]
        );`,
    `const { rows: setRows } = await client.query('SELECT sandbox_mode FROM settings WHERE id = 1');
        const isSandbox = setRows[0].sandbox_mode === true;
        await client.query(
            'INSERT INTO transactions (id, time, nominal, unique_code, total, status, qris_string, is_sandbox) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [trx.id, trx.time, trx.nominal, trx.unique, trx.total, trx.status, trx.qris_string, isSandbox]
        );`
);

// Update /api/webhook POST
code = code.replace(
    `await client.query('INSERT INTO logs (time, payload) VALUES ($1, $2)', [timeStr, payload]);`,
    `const { rows: setRows } = await client.query('SELECT sandbox_mode FROM settings WHERE id = 1');
        const isSandbox = setRows[0].sandbox_mode === true;
        await client.query('INSERT INTO logs (time, payload, is_sandbox) VALUES ($1, $2, $3)', [timeStr, payload, isSandbox]);`
).replace(
    `const { rows } = await client.query("SELECT * FROM transactions WHERE status = 'pending'");`,
    `const { rows } = await client.query("SELECT * FROM transactions WHERE status = 'pending' AND is_sandbox = $1", [isSandbox]);`
);

fs.writeFileSync('server.js', code);
