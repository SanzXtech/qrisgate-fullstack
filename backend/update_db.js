const { Client } = require('pg');

// Retrieve DB_URL from .env or just use the connection string from server.js
const fs = require('fs');
let dbUrl = "postgresql://postgres:_9%40R%26j4PKd%26MZ%23f@db.qnvfliejokwwmofwraoa.supabase.co:5432/postgres"; // fallback

const client = new Client({
    connectionString: dbUrl
});

async function updateDb() {
    await client.connect();
    
    try {
        await client.query("ALTER TABLE settings ADD COLUMN qris_string TEXT");
        console.log("Column qris_string added.");
    } catch (e) {
        if (e.code === '42701') { 
            console.log("Column qris_string already exists.");
        } else {
            console.error(e);
        }
    }
    await client.end();
}
updateDb();
