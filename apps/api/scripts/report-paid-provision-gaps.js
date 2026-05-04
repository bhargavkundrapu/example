/**
 * CSV of **paid** orders with a **payments** row (capture recorded) but provisioning still incomplete
 * (new signup missing approval/pending, or existing user missing enrollment).
 * Razorpay sends the customer receipt; this app does not send a duplicate purchase email.
 *
 * Usage (from `apps/api`): `npm run report:paid-gaps -- --out=paid-gaps.csv`
 */

const fs = require("fs");
const path = require("path");

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
CSV: paid order + payment row, but approvals/enrollment still incomplete.

  --since-days=N    payment_orders.updated_at within last N days (default 730, max 3650)
  --tenant-id=UUID  limit to one tenant
  --limit=N         max rows (default 5000, max 20000)
  --out=PATH        write CSV here (recommended on Windows; avoid npm > file.csv)
`);
  process.exit(0);
}

const apiRoot = path.join(__dirname, "..");
process.chdir(apiRoot);
require("dotenv").config({ path: path.join(apiRoot, ".env") });
require(path.join(apiRoot, "src/config/env.js"));

const { query } = require(path.join(apiRoot, "src/db/query.js"));
const { pool } = require(path.join(apiRoot, "src/db/pool.js"));

function parseArgs() {
  const opts = { sinceDays: 730, tenantId: null, limit: 5000, out: null };
  for (const a of process.argv.slice(2)) {
    if (a.startsWith("--since-days=")) opts.sinceDays = parseInt(a.split("=")[1], 10);
    else if (a.startsWith("--tenant-id=")) opts.tenantId = a.split("=")[1].trim() || null;
    else if (a.startsWith("--limit=")) opts.limit = parseInt(a.split("=")[1], 10);
    else if (a.startsWith("--out=")) opts.out = a.split("=").slice(1).join("=").trim() || null;
  }
  opts.sinceDays = Number.isFinite(opts.sinceDays) ? Math.min(3650, Math.max(1, opts.sinceDays)) : 730;
  opts.limit = Number.isFinite(opts.limit) ? Math.min(20000, Math.max(1, opts.limit)) : 5000;
  return opts;
}

function csvCell(v) {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowToCsv(cols, obj) {
  return cols.map((c) => csvCell(obj[c])).join(",");
}

async function main() {
  const opts = parseArgs();
  const cols = [
    "tenant_id",
    "payment_order_id",
    "customer_email",
    "customer_name",
    "customer_phone",
    "customer_college",
    "item_type",
    "item_id",
    "razorpay_order_id",
    "razorpay_payment_id",
    "payment_created_at",
    "approval_id",
    "approval_status",
    "user_id",
    "has_active_enrollment",
    "order_updated_at",
  ];

  const { rows } = await query(
    `SELECT
       po.tenant_id,
       po.id AS payment_order_id,
       po.customer_email,
       po.customer_name,
       po.customer_phone,
       po.customer_college,
       po.item_type,
       po.item_id,
       po.razorpay_order_id,
       p.razorpay_payment_id,
       p.created_at::text AS payment_created_at,
       a.id AS approval_id,
       COALESCE(a.status, '') AS approval_status,
       u.id AS user_id,
       CASE WHEN e.id IS NOT NULL THEN 'yes' ELSE 'no' END AS has_active_enrollment,
       po.updated_at::text AS order_updated_at
     FROM payments p
     INNER JOIN payment_orders po ON po.id = p.payment_order_id
     LEFT JOIN approvals a ON a.payment_order_id = po.id
     LEFT JOIN users u ON LOWER(u.email) = LOWER(po.customer_email)
     LEFT JOIN enrollments e
       ON e.user_id = u.id
      AND e.tenant_id = po.tenant_id
      AND e.item_type = po.item_type
      AND e.item_id = po.item_id
      AND e.active = true
     WHERE po.status = 'paid'
       AND po.updated_at >= now() - ($1::int * INTERVAL '1 day')
       AND ($2::uuid IS NULL OR po.tenant_id = $2)
       AND (
         (u.id IS NOT NULL AND e.id IS NULL)
         OR (u.id IS NULL AND (a.id IS NULL OR a.status = 'pending'))
       )
     ORDER BY p.created_at DESC
     LIMIT $3`,
    [opts.sinceDays, opts.tenantId, opts.limit]
  );

  const lines = [cols.join(","), ...rows.map((r) => rowToCsv(cols, r))];
  const body = lines.join("\n") + "\n";

  if (opts.out) {
    fs.writeFileSync(opts.out, body, "utf8");
    console.error(`[report] wrote ${rows.length} rows to ${opts.out}`);
  } else {
    process.stdout.write(body);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end().catch(() => {}));
