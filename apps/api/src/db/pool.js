// apps/api/src/db/pool.js
const dns = require("dns");
try { dns.setDefaultResultOrder("ipv4first"); } catch (_) {}

const { env } = require("../config/env");

const isNeon = /neon\.tech/i.test(env.DATABASE_URL);

let pool;

if (isNeon) {
  try {
    const url = new URL(env.DATABASE_URL);
    const host = url.hostname || "";
    if (!host.includes("-pooler") && host.endsWith(".neon.tech")) {
      console.warn(
        "WARNING: DATABASE_URL does not appear to be a Neon pooled connection. For production use the pooled connection string ending in -pooler.neon.tech to allow proper scale-to-zero. Check Neon Console → Connection Details → Pooled connection."
      );
    }
  } catch (_) {
    // If DATABASE_URL isn't parseable here, env.js will already error elsewhere.
  }
}

const { Pool } = require("pg");

const POOL_MAX = parseInt(process.env.DB_POOL_MAX, 10) || 25;
const QUERY_TIMEOUT_MS = 20_000;
const CONNECTION_TIMEOUT_MS = 15_000;

const useSSL = isNeon || env.DATABASE_URL?.includes("sslmode=require") || env.DATABASE_URL?.includes("ssl=true");

pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : undefined,
  max: POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
  query_timeout: QUERY_TIMEOUT_MS,
  statement_timeout: QUERY_TIMEOUT_MS,
});

pool.on("error", (err) => {
  console.error("PostgreSQL Pool error:", err);
});

module.exports = { pool };
