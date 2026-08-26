const { Client } = require('pg');
const dbUrl = "postgresql://postgres:_9%40R%26j4PKd%26MZ%23f@db.qnvfliejokwwmofwraoa.supabase.co:5432/postgres"; 
const client = new Client({ connectionString: dbUrl });

async function updateDb() {
    await client.connect();
    try {
        await client.query("ALTER TABLE settings ADD COLUMN accepted_sources TEXT DEFAULT 'GoPay Merchant,DANA,OVO'");
        console.log("Column accepted_sources added.");
    } catch (e) {
        if (e.code === '42701') { 
            console.log("Column accepted_sources already exists.");
        } else {
            console.error(e);
        }
    }
    await client.end();
}
updateDb();
