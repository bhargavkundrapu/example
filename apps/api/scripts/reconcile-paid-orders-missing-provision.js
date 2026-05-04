/**
 * Backfill **approvals**, **users**, and **enrollments** for paid Razorpay orders that never completed
 * provisioning (lost callback, webhook, or bugs). Matches the same rules as the auto-approve poller
 * but scans a configurable window in batches instead of “last 14 days × 5 rows”.
 *
 * Usage (from `apps/api`):
 *   node scripts/reconcile-paid-orders-missing-provision.js --dry-run
 *   node scripts/reconcile-paid-orders-missing-provision.js --since-days=1095 --batch-size=300
 *   node scripts/reconcile-paid-orders-missing-provision.js --tenant-id=<uuid>
 *
 * Env: `DATABASE_URL` (see `.env`).
 *
 * To **export CSV** of paid + captured payment rows still missing provisioning: `npm run report:paid-gaps`
 */

const path = require("path");

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Reconcile paid orders missing approvals / enrollments.

  --dry-run, -n          Count rows that would be processed (no writes)
  --since-days=N         Only orders updated in the last N days (default 730, max 3650)
  --batch-size=N         Rows per DB page (default 200, max 500)
  --tenant-id=UUID       Limit to one tenant
`);
  process.exit(0);
}

const apiRoot = path.join(__dirname, "..");
process.chdir(apiRoot);
require("dotenv").config({ path: path.join(apiRoot, ".env") });
require(path.join(apiRoot, "src/config/env.js"));

const paymentsService = require(path.join(apiRoot, "src/modules/payments/payments.service.js"));
const { pool } = require(path.join(apiRoot, "src/db/pool.js"));

function parseArgs() {
  const opts = {
    dryRun: false,
    sinceDays: 730,
    batchSize: 200,
    tenantId: null,
  };
  for (const a of process.argv.slice(2)) {
    if (a === "--dry-run" || a === "-n") opts.dryRun = true;
    else if (a.startsWith("--since-days=")) opts.sinceDays = parseInt(a.split("=")[1], 10);
    else if (a.startsWith("--batch-size=")) opts.batchSize = parseInt(a.split("=")[1], 10);
    else if (a.startsWith("--tenant-id=")) opts.tenantId = a.split("=")[1].trim() || null;
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  console.log("[PaidOrderRepair] starting", {
    dryRun: opts.dryRun,
    sinceDays: opts.sinceDays,
    batchSize: opts.batchSize,
    tenantId: opts.tenantId || "(all tenants)",
  });

  const result = await paymentsService.reconcilePaidOrdersMissingProvision(opts);

  console.log("[PaidOrderRepair] done", {
    processed: result.processed,
    failed: result.failed,
    dryRun: result.dryRun,
  });
  if (result.errors.length) {
    console.log("[PaidOrderRepair] first errors:", result.errors.slice(0, 10));
    if (result.errors.length > 10) console.log(`... and ${result.errors.length - 10} more`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end().catch(() => {}));
