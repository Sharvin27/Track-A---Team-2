const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Add it to backend/.env.local or backend/.env.");
}

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

      CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TABLE IF NOT EXISTS route_sessions (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        started_at TIMESTAMPTZ NOT NULL,
        ended_at TIMESTAMPTZ NOT NULL,
        duration_seconds INT NOT NULL,
        distance_miles FLOAT8 NOT NULL DEFAULT 0,
        distance_meters FLOAT8 NOT NULL DEFAULT 0,
        route_points_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        stops_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        route_image_url TEXT,
        start_lat FLOAT8,
        start_lng FLOAT8,
        end_lat FLOAT8,
        end_lng FLOAT8,
        status TEXT NOT NULL DEFAULT 'completed',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_route_sessions_user_id
        ON route_sessions (user_id);

      CREATE INDEX IF NOT EXISTS idx_route_sessions_started_at
        ON route_sessions (started_at DESC);

      DROP TRIGGER IF EXISTS trg_route_sessions_updated_at ON route_sessions;
      CREATE TRIGGER trg_route_sessions_updated_at
      BEFORE UPDATE ON route_sessions
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at_timestamp();

      CREATE TABLE IF NOT EXISTS profile_photos (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_profile_photos_user_id
        ON profile_photos (user_id);

      DROP TRIGGER IF EXISTS trg_profile_photos_updated_at ON profile_photos;
      CREATE TRIGGER trg_profile_photos_updated_at
      BEFORE UPDATE ON profile_photos
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at_timestamp();
    `);
    console.log("DB: users, route_sessions, and profile_photos tables ready");
  } finally {
    client.release();
  }
}

module.exports = { pool, initDb };
