const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Clean up DATABASE_URL - remove channel_binding which can cause issues
let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl.includes('channel_binding')) {
  dbUrl = dbUrl.replace(/[?&]channel_binding=[^&]*/g, '').replace(/\?&/, '?');
}

const isNeon = /neon\.tech/i.test(dbUrl);
let pool;

if (isNeon) {
  const { Pool: NeonPool, neonConfig } = require('@neondatabase/serverless');
  neonConfig.webSocketConstructor = require('ws');
  pool = new NeonPool({
    connectionString: dbUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 30_000,
  });
} else {
  const { Pool } = require('pg');
  const useSSL = dbUrl.includes('sslmode=require');
  pool = new Pool({
    connectionString: dbUrl,
    ssl: useSSL ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 30_000,
  });
}

async function connectWithRetry(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await pool.connect();
    } catch (err) {
      if ((err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') && i < retries - 1) {
        console.log(`Connection reset, retrying (${i + 1}/${retries})...`);
        await new Promise(r => setTimeout(r, 2000));
      } else {
        throw err;
      }
    }
  }
}

async function withClient(fn) {
  const client = await connectWithRetry();
  try {
    return await fn(client);
  } finally {
    client.release();
    await pool.end();
  }
}

async function runSeeds() {
  try {
    console.log('Starting seed execution...');

    const seedsDir = path.join(__dirname, '../db/seeds');
    const seedFiles = fs.readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    await withClient(async (client) => {
      for (const seedFile of seedFiles) {
        const filePath = path.join(seedsDir, seedFile);
        const sqlContent = fs.readFileSync(filePath, 'utf-8');

        console.log(`\nExecuting: ${seedFile}...`);

        try {
          await client.query(sqlContent);
          console.log(`✓ ${seedFile} completed successfully`);
        } catch (error) {
          console.error(`✗ Error in ${seedFile}:`, error.message);
        }
      }
    });

    console.log('\n✓ All seeds completed!');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error.message);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

runSeeds();
