// apps/api/src/modules/approvals/approvals.repo.js
const { query } = require("../../db/query");

async function createApproval({
  tenantId,
  paymentOrderId,
  itemType,
  itemId,
  customerName,
  customerEmail,
  customerPhone,
  customerCollege,
  razorpayOrderId,
  razorpayPaymentId,
}) {
  const { rows } = await query(
    `INSERT INTO approvals
     (tenant_id, payment_order_id, item_type, item_id, customer_name, customer_email, customer_phone, customer_college,
      razorpay_order_id, razorpay_payment_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
     ON CONFLICT (payment_order_id) DO NOTHING
     RETURNING *`,
    [
      tenantId,
      paymentOrderId,
      itemType,
      itemId,
      customerName,
      customerEmail,
      customerPhone,
      customerCollege ?? null,
      razorpayOrderId ?? null,
      razorpayPaymentId ?? null,
    ]
  );
  if (!rows[0]) {
    const existing = await query(
      `SELECT
         id,
         tenant_id,
         payment_order_id,
         item_type,
         item_id,
         customer_name,
         customer_email,
         customer_phone,
         customer_college,
         razorpay_order_id,
         razorpay_payment_id,
         status,
         notes,
         approved_by,
         approved_at,
         user_id,
         created_at,
         updated_at
       FROM approvals
       WHERE payment_order_id = $1
       LIMIT 1`,
      [paymentOrderId]
    );
    return existing.rows[0];
  }
  return rows[0];
}

async function findByPaymentOrderId(paymentOrderId) {
  if (!paymentOrderId) return null;
  const { rows } = await query(
    `SELECT
       id,
       tenant_id,
       payment_order_id,
       item_type,
       item_id,
       customer_name,
       customer_email,
       customer_phone,
       customer_college,
       razorpay_order_id,
       razorpay_payment_id,
       status,
       notes,
       approved_by,
       approved_at,
       user_id,
       created_at,
       updated_at
     FROM approvals
     WHERE payment_order_id = $1
     LIMIT 1`,
    [paymentOrderId]
  );
  return rows[0] ?? null;
}

async function findById(id) {
  const { rows } = await query(
    `SELECT
       id,
       tenant_id,
       payment_order_id,
       item_type,
       item_id,
       customer_name,
       customer_email,
       customer_phone,
       customer_college,
       razorpay_order_id,
       razorpay_payment_id,
       status,
       notes,
       approved_by,
       approved_at,
       user_id,
       created_at,
       updated_at
     FROM approvals
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

/** Pending rows tied to a paid checkout — safe to auto-approve after Razorpay capture (excludes manual queue with no order). */
async function listPendingLinkedToPaidOrders({ tenantId, limit = 50 }) {
  const lim = Math.min(100, Math.max(1, limit));
  const { rows } = await query(
    `SELECT
       a.id,
       a.tenant_id,
       a.payment_order_id,
       a.item_type,
       a.item_id,
       a.customer_name,
       a.customer_email,
       a.customer_phone,
       a.customer_college,
       a.razorpay_order_id,
       a.razorpay_payment_id,
       a.status,
       a.notes,
       a.approved_by,
       a.approved_at,
       a.user_id,
       a.created_at,
       a.updated_at,
       CASE WHEN a.item_type = 'course' THEN c.title ELSE p.title END AS item_title
     FROM approvals a
     INNER JOIN payment_orders po ON po.id = a.payment_order_id
     LEFT JOIN courses c ON a.item_type = 'course' AND c.id = a.item_id
     LEFT JOIN course_packs p ON a.item_type = 'pack' AND p.id = a.item_id
     WHERE a.tenant_id = $1
       AND a.status = 'pending'
       AND po.status = 'paid'
     ORDER BY a.created_at ASC
     LIMIT $2`,
    [tenantId, lim]
  );
  return rows;
}

async function listByStatus({ tenantId, status = "pending" }) {
  const { rows } = await query(
    `SELECT
       a.id,
       a.tenant_id,
       a.payment_order_id,
       a.item_type,
       a.item_id,
       a.customer_name,
       a.customer_email,
       a.customer_phone,
       a.customer_college,
       a.razorpay_order_id,
       a.razorpay_payment_id,
       a.status,
       a.notes,
       a.approved_by,
       a.approved_at,
       a.user_id,
       a.created_at,
       a.updated_at,
       CASE WHEN a.item_type = 'course' THEN c.title ELSE p.title END AS item_title
     FROM approvals a
     LEFT JOIN courses c ON a.item_type = 'course' AND c.id = a.item_id
     LEFT JOIN course_packs p ON a.item_type = 'pack' AND p.id = a.item_id
     WHERE a.tenant_id = $1 AND a.status = $2
     ORDER BY a.created_at DESC
     LIMIT 500`,
    [tenantId, status]
  );
  return rows;
}

async function listAll({ tenantId }) {
  const { rows } = await query(
    `SELECT
       a.id,
       a.tenant_id,
       a.payment_order_id,
       a.item_type,
       a.item_id,
       a.customer_name,
       a.customer_email,
       a.customer_phone,
       a.customer_college,
       a.razorpay_order_id,
       a.razorpay_payment_id,
       a.status,
       a.notes,
       a.approved_by,
       a.approved_at,
       a.user_id,
       a.created_at,
       a.updated_at,
       CASE WHEN a.item_type = 'course' THEN c.title ELSE p.title END AS item_title
     FROM approvals a
     LEFT JOIN courses c ON a.item_type = 'course' AND c.id = a.item_id
     LEFT JOIN course_packs p ON a.item_type = 'pack' AND p.id = a.item_id
     WHERE a.tenant_id = $1
     ORDER BY
       CASE a.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
       a.created_at DESC`,
    [tenantId]
  );
  return rows;
}

async function markApproved(approvalId, approvedByUserId) {
  const { rows } = await query(
    `UPDATE approvals
     SET status = 'approved', approved_by = $2, approved_at = now(), updated_at = now()
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [approvalId, approvedByUserId]
  );
  return rows[0] ?? null;
}

async function markRejected(approvalId, notes = null) {
  const { rows } = await query(
    `UPDATE approvals
     SET status = 'rejected', notes = $2, updated_at = now()
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [approvalId, notes]
  );
  return rows[0] ?? null;
}

/**
 * Paid checkout is complete and the student user already exists: close out any pending approval
 * or insert an approved row for audit / Super Admin Razorpay matching.
 * Without this, the "existing user" reconcile path returns early and leaves a pending row forever.
 */
async function finalizePaidCheckoutApprovalForUser({ order, userId, razorpayOrderId, razorpayPaymentId }) {
  const paymentOrderId = order.id;
  const tenantId = order.tenant_id;
  const rzOrder = razorpayOrderId ?? order.razorpay_order_id ?? null;
  const rzPay = razorpayPaymentId ?? null;

  const updated = await query(
    `UPDATE approvals
     SET status = 'approved',
         user_id = $1,
         approved_by = NULL,
         approved_at = COALESCE(approved_at, now()),
         razorpay_payment_id = COALESCE($2::text, razorpay_payment_id),
         razorpay_order_id = COALESCE($3::text, razorpay_order_id),
         updated_at = now()
     WHERE payment_order_id = $4
       AND tenant_id = $5
       AND status = 'pending'
     RETURNING *`,
    [userId, rzPay, rzOrder, paymentOrderId, tenantId]
  );
  if (updated.rows[0]) return updated.rows[0];

  const { rows: existing } = await query(
    `SELECT * FROM approvals WHERE payment_order_id = $1 AND tenant_id = $2 LIMIT 1`,
    [paymentOrderId, tenantId]
  );
  if (existing[0]?.status === "approved") return existing[0];
  if (existing[0]?.status === "rejected") return existing[0];

  try {
    const ins = await query(
      `INSERT INTO approvals
       (tenant_id, payment_order_id, item_type, item_id, customer_name, customer_email, customer_phone, customer_college,
        razorpay_order_id, razorpay_payment_id, status, user_id, approved_at, approved_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'approved', $11, now(), NULL)
       RETURNING *`,
      [
        tenantId,
        paymentOrderId,
        order.item_type,
        order.item_id,
        order.customer_name,
        order.customer_email,
        order.customer_phone,
        order.customer_college ?? null,
        rzOrder,
        rzPay,
        userId,
      ]
    );
    return ins.rows[0] ?? null;
  } catch (e) {
    if (e.code === "23505") {
      const { rows } = await query(`SELECT * FROM approvals WHERE payment_order_id = $1 LIMIT 1`, [paymentOrderId]);
      return rows[0] ?? null;
    }
    throw e;
  }
}

/** Map razorpay_order_id → approvals.status (latest row per order id). */
async function approvalStatusesByRazorpayOrderIds(razorpayOrderIds) {
  const ids = [...new Set((razorpayOrderIds || []).filter(Boolean).map(String))];
  if (!ids.length) return new Map();
  const { rows } = await query(
    `SELECT DISTINCT ON (razorpay_order_id) razorpay_order_id, status
     FROM approvals
     WHERE razorpay_order_id = ANY($1::text[])
     ORDER BY razorpay_order_id, updated_at DESC NULLS LAST`,
    [ids]
  );
  const map = new Map();
  for (const r of rows) map.set(r.razorpay_order_id, r.status);
  return map;
}

module.exports = {
  createApproval,
  findByPaymentOrderId,
  findById,
  finalizePaidCheckoutApprovalForUser,
  listPendingLinkedToPaidOrders,
  listByStatus,
  listAll,
  markApproved,
  markRejected,
  approvalStatusesByRazorpayOrderIds,
};
