const { Client } = require('pg');
const dbUrl = "postgresql://postgres:_9%40R%26j4PKd%26MZ%23f@db.qnvfliejokwwmofwraoa.supabase.co:5432/postgres"; 
const client = new Client({ connectionString: dbUrl });

async function migrate() {
    await client.connect();
    try {
        console.log("Adding SaaS columns to settings...");
        await client.query("ALTER TABLE settings ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'");
        await client.query("ALTER TABLE settings ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP");
        await client.query("ALTER TABLE settings ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0");
        
        console.log("Setting user 1 as admin and lifetime premium...");
        await client.query("UPDATE settings SET role = 'admin', premium_until = '2099-12-31 23:59:59' WHERE id = 1");

        console.log("Adding user_id to transactions...");
        await client.query("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id INTEGER DEFAULT 1");
        
        console.log("Adding upgrade_invoices table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS upgrade_invoices (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                trx_id TEXT,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log("Migration successful!");
    } catch (e) {
        console.error("Migration failed:", e);
    }
    await client.end();
}
migrate();
