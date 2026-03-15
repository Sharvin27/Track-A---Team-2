const { Pool } = require("pg");
let pool;

function getConnectionString() {
  return process.env.DATABASE_URL;
}

function getPool() {
  if (pool) return pool;

  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to use the Postgres backend.");
  }

  const isSupabase = connectionString.includes("supabase");
  const ssl =
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: true }
      : isSupabase
        ? { rejectUnauthorized: false }
        : false;

  pool = new Pool({
    connectionString,
    ssl,
  });

  return pool;
}

async function query(text, params) {
  return getPool().query(text, params);
}

async function closePool() {
  if (!pool) return;
  const activePool = pool;
  pool = undefined;
  await activePool.end();
}

async function initDb() {
  const client = await getPool().connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        username VARCHAR(64) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        agreed_to_terms BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS need_regions (
        id BIGSERIAL PRIMARY KEY,
        region_code TEXT NOT NULL UNIQUE,
        region_name TEXT NOT NULL,
        borough_name TEXT,
        region_type TEXT,
        geometry_json JSONB NOT NULL,
        centroid_lat DOUBLE PRECISION NOT NULL,
        centroid_lng DOUBLE PRECISION NOT NULL,
        food_insecure_percentage DOUBLE PRECISION,
        food_need_score DOUBLE PRECISION NOT NULL,
        weighted_rank INTEGER,
        source_year TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hotspot_locations (
        id BIGSERIAL PRIMARY KEY,
        source_key TEXT NOT NULL UNIQUE,
        osm_id TEXT NOT NULL,
        osm_type TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        address TEXT,
        neighborhood TEXT,
        region_code TEXT REFERENCES need_regions(region_code) ON DELETE SET NULL,
        region_name TEXT,
        region_need_score DOUBLE PRECISION,
        priority TEXT NOT NULL DEFAULT 'Medium',
        score DOUBLE PRECISION NOT NULL DEFAULT 0,
        covered BOOLEAN NOT NULL DEFAULT FALSE,
        last_checked TEXT NOT NULL DEFAULT 'Imported from OSM',
        assigned_to TEXT NOT NULL DEFAULT 'Open shift',
        notes TEXT NOT NULL DEFAULT '',
        lat DOUBLE PRECISION NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        tags_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_hotspot_locations_lat_lng ON hotspot_locations (lat, lng);
      CREATE INDEX IF NOT EXISTS idx_hotspot_locations_category ON hotspot_locations (category);
      CREATE INDEX IF NOT EXISTS idx_hotspot_locations_score ON hotspot_locations (score DESC);
      CREATE INDEX IF NOT EXISTS idx_hotspot_locations_region_code ON hotspot_locations (region_code);
      CREATE INDEX IF NOT EXISTS idx_need_regions_score ON need_regions (food_need_score DESC);
    `);
  } finally {
    client.release();
  }
}

module.exports = {
  closePool,
  getPool,
  initDb,
  query,
};
