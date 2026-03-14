const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
const isSupabase = connectionString && connectionString.includes("supabase");
const ssl =
  process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: true }
    : isSupabase
      ? { rejectUnauthorized: false }
      : false;

const pool = new Pool({
  connectionString,
  ssl,
});

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(64) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        agreed_to_terms BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);
    console.log("DB: users table ready");
  } finally {
    client.release();
  }
}

module.exports = { pool, initDb };
