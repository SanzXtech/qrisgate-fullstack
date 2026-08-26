const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const JWT_SECRET = 'qrisgate_saas_super_secret_key';

// Postgres Connection
const client = new Client({
  connectionString: 'postgresql://postgres:_9%40R%26j4PKd%26MZ%23f@db.qnvfliejokwwmofwraoa.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(() => console.log('Connected to Supabase Postgres!')).catch(console.error);

// Middleware
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid Token' });
    }
};

function crc16(str) {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
        crc ^= str.charCodeAt(c) << 8;
        for (let i = 0; i < 8; i++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function generateDynamicQris(staticQris, nominal) {
    if (!staticQris) return "";
    let qris = staticQris.replace("010211", "010212");
    let amountStr = nominal.toString();
    let tag54 = "54" + amountStr.length.toString().padStart(2, '0') + amountStr;
    if (qris.includes("5303360")) {
        qris = qris.replace("5303360", "5303360" + tag54);
    } else {
        let tag58Index = qris.indexOf("5802ID");
        if (tag58Index !== -1) {
            qris = qris.slice(0, tag58Index) + tag54 + qris.slice(tag58Index);
        }
    }
    qris = qris.substring(0, qris.length - 4);
    return qris + crc16(qris);
}

// ---------------------------------------------------------
// AUTH ENDPOINTS
// ---------------------------------------------------------
app.post('/api/register', async (req, res) => {
    try {
        const { storeName, email, password, phone } = req.body;
        const { rows } = await client.query('SELECT id FROM settings WHERE email = $1', [email]);
        if (rows.length > 0) return res.status(400).json({ error: 'Email sudah terdaftar' });
        
        const result = await client.query(
            "INSERT INTO settings (store_name, email, password, phone, role) VALUES ($1, $2, $3, $4, 'user') RETURNING id, role",
            [storeName, email, password, phone]
        );
        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
        res.json({ success: true, token, user });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { rows } = await client.query('SELECT id, role FROM settings WHERE email = $1 AND password = $2', [email, password]);
        if (rows.length === 0) return res.status(401).json({ error: 'Email atau password salah' });
        
        const user = rows[0];
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
        res.json({ success: true, token, user });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ---------------------------------------------------------
// PROTECTED ENDPOINTS
// ---------------------------------------------------------
app.post('/api/settings', authenticate, async (req, res) => {
    try {
        const { storeName, profilePic, phone, password, sandboxMode, qrisString, acceptedSources } = req.body;
        let updateQuery = "UPDATE settings SET ";
        let values = [];
        const setParts = [];
        
        if (storeName !== undefined) { values.push(storeName); setParts.push(`store_name = $${values.length}`); }
        if (profilePic !== undefined) { values.push(profilePic); setParts.push(`profile_pic = $${values.length}`); }
        if (phone !== undefined) { values.push(phone); setParts.push(`phone = $${values.length}`); }
        if (password !== undefined) { values.push(password); setParts.push(`password = $${values.length}`); }
        if (sandboxMode !== undefined) { values.push(sandboxMode); setParts.push(`sandbox_mode = $${values.length}`); }
        if (qrisString !== undefined) { values.push(qrisString); setParts.push(`qris_string = $${values.length}`); }
        if (acceptedSources !== undefined) { values.push(acceptedSources); setParts.push(`accepted_sources = $${values.length}`); }
        
        if (values.length > 0) {
            updateQuery += setParts.join(", ") + " WHERE id = $" + (values.length + 1);
            values.push(req.user.id);
            await client.query(updateQuery, values);
        }
        const { rows } = await client.query('SELECT * FROM settings WHERE id = $1', [req.user.id]);
        res.json({ success: true, settings: rows[0] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/qris/create', authenticate, async (req, res) => {
    try {
        const { nominal } = req.body;
        const { rows: setRows } = await client.query('SELECT qris_string, sandbox_mode FROM settings WHERE id = $1', [req.user.id]);
        if (!setRows[0] || !setRows[0].qris_string) return res.status(400).json({ error: 'QRIS Toko belum diatur' });
        
        const uniqueCode = Math.floor(Math.random() * 999) + 1;
        const totalPay = nominal + uniqueCode;
        const dynamicQrisString = generateDynamicQris(setRows[0].qris_string, totalPay);
        
        const trx = {
            id: 'TRX-' + Math.floor(Math.random() * 1000000),
            time: new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }),
            nominal: nominal,
            unique: uniqueCode,
            total: totalPay,
            status: 'pending',
            qris_string: dynamicQrisString
        };
        
        await client.query("UPDATE transactions SET status = 'failed' WHERE status = 'pending' AND created_at < NOW() - INTERVAL '15 minutes' AND user_id = $1", [req.user.id]);
        const isSandbox = setRows[0].sandbox_mode === true;
        
        await client.query(
            'INSERT INTO transactions (id, time, nominal, unique_code, total, status, qris_string, is_sandbox, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [trx.id, trx.time, trx.nominal, trx.unique, trx.total, trx.status, trx.qris_string, isSandbox, req.user.id]
        );
        
        res.json({ success: true, message: 'Tagihan dibuat', data: trx });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/dashboard', authenticate, async (req, res) => {
    try {
        const { rows: setRows } = await client.query('SELECT * FROM settings WHERE id = $1', [req.user.id]);
        await client.query("UPDATE transactions SET status = 'failed' WHERE status = 'pending' AND created_at < NOW() - INTERVAL '15 minutes' AND user_id = $1", [req.user.id]);
        
        const isSandbox = setRows[0]?.sandbox_mode === true;
        const { rows: trxRows } = await client.query('SELECT * FROM transactions WHERE is_sandbox = $1 AND user_id = $2 ORDER BY created_at DESC', [isSandbox, req.user.id]);
        const { rows: logRows } = await client.query('SELECT * FROM logs WHERE is_sandbox = $1 ORDER BY created_at DESC LIMIT 10', [isSandbox]);
        
        const successCount = trxRows.filter(t => t.status === 'success').length;
        const pendingCount = trxRows.filter(t => t.status === 'pending').length;
        const failedCount = trxRows.filter(t => t.status === 'failed').length;
        const totalIncome = trxRows.filter(t => t.status === 'success').reduce((sum, t) => sum + parseFloat(t.nominal), 0);

        res.json({
            stats: { income: totalIncome, success: successCount, pending: pendingCount, failed: failedCount },
            transactions: trxRows,
            logs: logRows,
            settings: setRows[0] || {}
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ---------------------------------------------------------
// WEBHOOK ENDPOINT
// ---------------------------------------------------------
app.post('/api/webhook', async (req, res) => {
    try {
        // user_id can be passed as query param ?user_id=1
        const userId = req.query.user_id;
        if (!userId) return res.status(400).json({ error: 'Missing user_id in webhook URL' });

        const payload = req.body;
        const timeStr = new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' });
        
        const { rows: setRows } = await client.query('SELECT sandbox_mode, accepted_sources FROM settings WHERE id = $1', [userId]);
        if (setRows.length === 0) return res.status(404).json({ error: 'User not found' });
        
        const isSandbox = setRows[0].sandbox_mode === true;
        const accepted = (setRows[0].accepted_sources) ? setRows[0].accepted_sources.toLowerCase() : "gopay merchant,dana,ovo";
        const source = (payload.source || "unknown").toLowerCase();
        
        if (source !== "unknown" && !accepted.includes(source)) {
            return res.json({ success: false, message: 'Sumber notifikasi tidak diaktifkan di pengaturan' });
        }

        await client.query("UPDATE transactions SET status = 'failed' WHERE status = 'pending' AND created_at < NOW() - INTERVAL '15 minutes' AND user_id = $1", [userId]);
        await client.query('INSERT INTO logs (time, payload, is_sandbox) VALUES ($1, $2, $3)', [timeStr, payload, isSandbox]); // Note: logs might need user_id later
        
        let receivedAmount = parseInt(payload.nominal || '0');
        const { rows } = await client.query("SELECT * FROM transactions WHERE status = 'pending' AND is_sandbox = $1 AND user_id = $2", [isSandbox, userId]);
        
        let pendingTrx = null;
        if (receivedAmount > 0) {
            pendingTrx = rows.find(t => parseFloat(t.total) === receivedAmount);
        } else {
            const textPayload = JSON.stringify(payload);
            pendingTrx = rows.find(t => {
                const numStr = t.total.toString();
                const dotStr = t.total.toLocaleString('id-ID');
                return textPayload.includes(numStr) || textPayload.includes(dotStr);
            });
        }
        
        if (pendingTrx) {
            await client.query("UPDATE transactions SET status = 'success' WHERE id = $1", [pendingTrx.id]);
            // If this was an upgrade invoice, activate premium!
            const { rows: invRows } = await client.query("SELECT * FROM upgrade_invoices WHERE trx_id = $1", [pendingTrx.id]);
            if (invRows.length > 0) {
                await client.query("UPDATE settings SET premium_until = NOW() + INTERVAL '30 days' WHERE id = $1", [userId]);
                await client.query("UPDATE upgrade_invoices SET status = 'success' WHERE id = $1", [invRows[0].id]);
                // Automatically log to owner (Admin ID 1)
                await client.query("INSERT INTO logs (time, payload, is_sandbox) VALUES ($1, $2, false)", [timeStr, { info: "User upgrade premium success", userId: userId }]);
            }

            return res.json({ success: true, message: 'Transaksi berhasil diupdate (Lunas).' });
        } else {
            return res.json({ success: false, message: 'Tidak ada transaksi pending yang cocok.' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ---------------------------------------------------------
// UPGRADE TO PREMIUM ENDPOINT
// ---------------------------------------------------------
app.post('/api/upgrade', authenticate, async (req, res) => {
    try {
        // Hit the Admin's QRIS string
        const { rows: adminRows } = await client.query('SELECT qris_string FROM settings WHERE id = 1');
        if (!adminRows[0] || !adminRows[0].qris_string) return res.status(500).json({ error: 'Admin QRIS not set' });
        
        const nominal = 10000;
        const uniqueCode = Math.floor(Math.random() * 999) + 1;
        const totalPay = nominal + uniqueCode;
        const dynamicQrisString = generateDynamicQris(adminRows[0].qris_string, totalPay);
        
        const trx = {
            id: 'UPG-' + Math.floor(Math.random() * 1000000),
            time: new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }),
            nominal: nominal,
            unique: uniqueCode,
            total: totalPay,
            status: 'pending',
            qris_string: dynamicQrisString
        };
        
        // Insert transaction for Admin so Admin's webhook detects it
        await client.query(
            'INSERT INTO transactions (id, time, nominal, unique_code, total, status, qris_string, is_sandbox, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [trx.id, trx.time, trx.nominal, trx.unique, trx.total, trx.status, trx.qris_string, false, 1]
        );
        
        // Insert upgrade intent
        await client.query("INSERT INTO upgrade_invoices (user_id, trx_id) VALUES ($1, $2)", [req.user.id, trx.id]);
        
        res.json({ success: true, data: trx });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server Backend QRIS berjalan di http://localhost:${PORT}`);
});
