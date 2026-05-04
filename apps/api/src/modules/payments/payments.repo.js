// apps/api/src/modules/payments/payments.repo.js
const { query } = require("../../db/query");

async function getCoursePrice({ tenantId, courseId }) {
  const { rows } = await query(
    `SELECT id, title, slug, price_in_paise FROM courses
     WHERE tenant_id = $1 AND id = $2 AND status = 'published' LIMIT 1`,
    [tenantId, courseId]
  );
  return rows[0] ?? null;
}

async function getPackPrice({ tenantId, packId }) {
  const { rows } = await query(
    `SELECT id, title, price_in_paise FROM course_packs
     WHERE tenant_id = $1 AND id = $2 AND status = 'published' LIMIT 1`,
    [tenantId, packId]
  );
  return rows[0] ?? null;
}

async function createPaymentOrder({
  tenantId,
  itemType,
  itemId,
  amount,
  currency,
  razorpayOrderId,
  customerName,
  customerEmail,
  customerPhone,
  customerCollege,
  redirectOrigin,
}) {
  const { rows } = await query(
    `INSERT INTO payment_orders
     (tenant_id, item_type, item_id, amount, currency, razorpay_order_id, status,
      customer_name, customer_email, customer_phone, customer_college, redirect_origin)
     VALUES ($1, $2, $3, $4, $5, $6, 'created', $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      tenantId,
      itemType,
      itemId,
      amount,
      currency,
      razorpayOrderId,
      customerName,
      customerEmail,
      customerPhone,
      customerCollege ?? null,
      redirectOrigin ?? null,
    ]
  );
  return rows[0];
}

async function findByRazorpayOrderId(razorpayOrderId) {
  const { rows } = await query(
    `SELECT * FROM payment_orders WHERE razorpay_order_id = $1 LIMIT 1`,
    [razorpayOrderId]
  );
  return rows[0] ?? null;
}

async function findByLocalId(id) {
  const { rows } = await query(
    `SELECT * FROM payment_orders WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

async function markOrderPaid(orderId) {
  const { rows } = await query(
    `UPDATE payment_orders SET status = 'paid', updated_at = now()
     WHERE id = $1 AND status = 'created' RETURNING *`,
    [orderId]
  );
  return rows[0] ?? null;
}

async function createPaymentRecord({ paymentOrderId, razorpayPaymentId, status, rawPayload }) {
  const { rows } = await query(
    `INSERT INTO payments (payment_order_id, razorpay_payment_id, status, raw_payload)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (razorpay_payment_id) DO NOTHING
     RETURNING *`,
    [paymentOrderId, razorpayPaymentId, status, rawPayload ? JSON.stringify(rawPayload) : null]
  );
  return rows[0];
}

async function findPaymentByRazorpayId(razorpayPaymentId) {
  const { rows } = await query(
    `SELECT * FROM payments WHERE razorpay_payment_id = $1 LIMIT 1`,
    [razorpayPaymentId]
  );
  return rows[0] ?? null;
}

async function upsertUserFromPayment({ email, fullName, phone, college }, client) {
  const db = client || { query: (...args) => query(...args) };
  const inTransaction = !!client;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) throw new Error("Email is required");

  const safeName = (fullName || "").trim() || null;
  const safePhone = (phone || "").trim() || null;
  const safeCollege = (college || "").trim() || null;

  const existingResult = await db.query(
    `SELECT id, is_active FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [normalizedEmail]
  );
  const existingRow = existingResult?.rows?.[0];
  if (existingRow) {
    if (inTransaction) await db.query("SAVEPOINT update_user");
    try {
      await db.query(
        `UPDATE users SET full_name = COALESCE($2, full_name),
         phone = COALESCE($3, phone),
         college = COALESCE($4, college),
         is_active = true,
         updated_at = now()
         WHERE id = $1`,
        [existingRow.id, safeName, safePhone, safeCollege]
      );
      if (inTransaction) await db.query("RELEASE SAVEPOINT update_user");
    } catch (err) {
      if (err.code === "23505" && (err.constraint === "users_phone_uq" || (err.constraint && String(err.constraint).includes("phone")))) {
        if (inTransaction) await db.query("ROLLBACK TO SAVEPOINT update_user");
        await db.query(
          `UPDATE users SET full_name = COALESCE($2, full_name),
           phone = NULL,
           college = COALESCE($3, college),
           is_active = true,
           updated_at = now()
           WHERE id = $1`,
          [existingRow.id, safeName, safeCollege]
        );
      } else {
        if (inTransaction) await db.query("ROLLBACK TO SAVEPOINT update_user");
        throw err;
      }
    }
    return existingRow.id;
  }

  // New user - try insert with phone, fall back without
  if (inTransaction) await db.query("SAVEPOINT insert_user");
  try {
    const { rows } = await db.query(
      `INSERT INTO users (email, full_name, phone, college, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id`,
      [normalizedEmail, safeName, safePhone, safeCollege]
    );
    if (inTransaction) await db.query("RELEASE SAVEPOINT insert_user");
    return rows[0]?.id;
  } catch (err) {
    if (err.code === "23505") {
      if (inTransaction) await db.query("ROLLBACK TO SAVEPOINT insert_user");
      const c = String(err.constraint || "");

      if (c.includes("phone") || c === "users_phone_uq") {
        // Phone conflict - retry without phone
        const { rows } = await db.query(
          `INSERT INTO users (email, full_name, phone, college, is_active)
           VALUES ($1, $2, NULL, $3, true)
           RETURNING id`,
          [normalizedEmail, safeName, safeCollege]
        );
        return rows[0]?.id;
      }

      if (c.includes("email") || c === "users_email_uq" || c === "users_email_key") {
        // Race condition - another process created the user between our SELECT and INSERT
        const retry = await db.query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`, [normalizedEmail]);
        const row = retry?.rows?.[0];
        if (row) return row.id;
      }
    }
    throw err;
  }
}

async function ensureEnrollment({ userId, tenantId, itemType, itemId }, client) {
  const db = client || { query: (...args) => query(...args) };
  const { rows } = await db.query(
    `INSERT INTO enrollments (user_id, tenant_id, item_type, item_id, active)
     VALUES ($1, $2, $3, $4, true)
     ON CONFLICT (user_id, item_type, item_id) DO UPDATE SET active = true
     RETURNING *`,
    [userId, tenantId, itemType, itemId]
  );
  return rows[0];
}

module.exports = {
  getCoursePrice,
  getPackPrice,
  createPaymentOrder,
  findByRazorpayOrderId,
  findByLocalId,
  markOrderPaid,
  createPaymentRecord,
  findPaymentByRazorpayId,
  upsertUserFromPayment,
  ensureEnrollment,
};
