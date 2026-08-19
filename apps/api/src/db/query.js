// apps/api/src/db/query.js
const { pool } = require("./pool");

const QUERY_TIMEOUT_MS = 15_000;

async function query(text, params = []) {
  let attempts = 0;
  const maxAttempts = 3;
  while (attempts < maxAttempts) {
    try {
      attempts++;
      return await pool.query(text, params);
    } catch (err) {
      const msg = String(err?.message || "").toLowerCase();
      const code = String(err?.code || "");
      const isTransient =
        code === "57P01" ||
        code === "57P02" ||
        code === "57P03" ||
        code === "08006" ||
        code === "08001" ||
        code === "08004" ||
        code === "ECONNRESET" ||
        code === "ETIMEDOUT" ||
        code === "ENOTFOUND" ||
        code === "EAI_AGAIN" ||
        msg.includes("timeout exceeded when fetching a client") ||
        msg.includes("connection terminated") ||
        msg.includes("getaddrinfo");

      if (isTransient && attempts < maxAttempts) {
        console.warn(`[db/query] Transient DB error (attempt ${attempts}/${maxAttempts}), retrying in ${150 * attempts}ms...`, err.message);
        await new Promise((resolve) => setTimeout(resolve, 150 * attempts));
        continue;
      }
      throw err;
    }
  }
}

async function getClient() {
  return pool.connect();
}

async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query(`SET LOCAL statement_timeout = '${QUERY_TIMEOUT_MS}'`);
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { query, getClient, withTransaction };
