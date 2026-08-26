const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:_9%40R%26j4PKd%26MZ%23f@db.qnvfliejokwwmofwraoa.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function init() {
  await client.connect();
  console.log("Connected to Supabase Postgres.");

  await client.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(50) PRIMARY KEY,
      time VARCHAR(20),
      nominal INTEGER,
      unique_code INTEGER,
      total INTEGER,
      status VARCHAR(20),
      qris_string TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS logs (
      id SERIAL PRIMARY KEY,
      time VARCHAR(20),
      payload JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      store_name VARCHAR(255),
      profile_pic TEXT
    );
  `);

  // Insert default settings if not exists
  await client.query(`
    INSERT INTO settings (id, store_name, profile_pic)
    VALUES (1, 'SanzOfficiallID', '')
    ON CONFLICT (id) DO NOTHING;
  `);

  console.log("Tables created successfully.");
  await client.end();
}

init().catch(console.error);
