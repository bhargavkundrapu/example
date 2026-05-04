// apps/api/src/modules/payments/payments.service.js
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { env } = require("../../config/env");
const { HttpError } = require("../../utils/httpError");
const { z } = require("zod");
const paymentsRepo = require("./payments.repo");
const { platformFeePaiseForItemType } = require("./payments.pricing");
const approvalsRepo = require("../approvals/approvals.repo");
const approvalsService = require("../approvals/approvals.service");
const { findRoleIdForTenant, upsertMembership } = require("../users/users.repo");
const { query, withTransaction } = require("../../db/query");
const CreateOrderSchema = z.object({
  item_type: z.enum(["course", "pack"]),
  item_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  college: z.string().max(200).optional(),
  origin: z.string().max(500).optional(),
});

function getRazorpayInstance() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new HttpError(
      503,
      "Payment service not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to apps/api/.env"
    );
  }
  return new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
}

function verifyRazorpaySignature(orderId, paymentId, signature) {
  if (!orderId || !paymentId || !signature || !env.RAZORPAY_KEY_SECRET) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", env.RAZORPAY_KEY_SECRET).update(body).digest("hex");
  const sigBuf = Buffer.from(String(signature), "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

function verifyWebhookSignature(body, signature) {
  if (!env.RAZORPAY_WEBHOOK_SECRET || !signature || !body) return false;
  const expected = crypto.createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET).update(body).digest("hex");
  const sigBuf = Buffer.from(String(signature), "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

function normalizeSlug(slug) {
  if (!slug) return "";
  return String(slug).toLowerCase().replace(/_/g, "-").trim();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Read-after-write / replica lag: client verify can arrive before ORDER row is visible. */
async function findPaymentOrderByRazorpayIdWithRetry(razorpayOrderId, { maxAttempts = 10, baseDelayMs = 45 } = {}) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const order = await paymentsRepo.findByRazorpayOrderId(razorpayOrderId);
    if (order) return order;
    if (attempt < maxAttempts - 1) {
      await delay(Math.round(baseDelayMs * 1.4 ** attempt));
    }
  }
  return null;
}

async function getPriceBreakdown({ tenant, item_type, item_id }) {
  const tenantId = tenant.id;
  let baseAmount;
  if (item_type === "course") {
    const course = await paymentsRepo.getCoursePrice({ tenantId, courseId: item_id });
    if (!course) throw new HttpError(404, "Course not found or not published");
    baseAmount = Number(course.price_in_paise);
  } else if (item_type === "pack") {
    const pack = await paymentsRepo.getPackPrice({ tenantId, packId: item_id });
    if (!pack) throw new HttpError(404, "Course pack not found or not published");
    baseAmount = Number(pack.price_in_paise);
  } else {
    throw new HttpError(400, "Invalid item_type");
  }
  if (!baseAmount || baseAmount < 100) {
    throw new HttpError(400, "Invalid price");
  }
  const platformFeePaise = platformFeePaiseForItemType(item_type);
  const totalAmount = baseAmount + platformFeePaise;
  return {
    base_amount: baseAmount,
    platform_fee_amount: platformFeePaise,
    total_amount: totalAmount,
    currency: "INR",
  };
}

async function createOrder({ tenant, body }) {
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid input", parsed.error.flatten());
  }

  const { item_type, item_id, name, email, phone, college, origin } = parsed.data;
  const tenantId = tenant.id;
  const redirectOrigin = (origin || "").trim() && /^https?:\/\//i.test(origin) ? origin.replace(/\/$/, "") : null;

  let amount;
  if (item_type === "course") {
    const course = await paymentsRepo.getCoursePrice({ tenantId, courseId: item_id });
    if (!course) throw new HttpError(404, "Course not found or not published");
    amount = Number(course.price_in_paise);
  } else if (item_type === "pack") {
    const pack = await paymentsRepo.getPackPrice({ tenantId, packId: item_id });
    if (!pack) throw new HttpError(404, "Course pack not found or not published");
    amount = Number(pack.price_in_paise);
  }

  if (!amount || amount < 100) {
    throw new HttpError(400, "Invalid price. Minimum amount is ₹1.00");
  }

  const platformFeePaise = platformFeePaiseForItemType(item_type);
  const amountWithFee = amount + platformFeePaise;

  const rzp = getRazorpayInstance();
  const razorpayOrder = await rzp.orders.create({
    amount: amountWithFee,
    currency: "INR",
    receipt: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    notes: { item_type, item_id, college: college || "" },
  });

  const localOrder = await paymentsRepo.createPaymentOrder({
    tenantId,
    itemType: item_type,
    itemId: item_id,
    amount: amountWithFee,
    currency: "INR",
    razorpayOrderId: razorpayOrder.id,
    customerName: name,
    customerEmail: email,
    customerPhone: phone,
    customerCollege: college,
    redirectOrigin,
  });

  return {
    key_id: env.RAZORPAY_KEY_ID,
    razorpay_order_id: razorpayOrder.id,
    amount: amountWithFee,
    currency: "INR",
    local_order_id: localOrder.id,
    callback_url: `${env.PUBLIC_API_URL}/api/v1/payments/razorpay/callback`,
    login_url: `${env.PUBLIC_WEB_URL}/login`,
    pending_url: `${env.PUBLIC_WEB_URL}/account-pending`,
  };
}

async function findUserByEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;
  const { rows } = await query(`SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1`, [normalizedEmail]);
  return rows[0] ?? null;
}

async function ensureExistingUserProvisioned({ order, userId }) {
  await withTransaction(async (client) => {
    await paymentsRepo.upsertUserFromPayment(
      {
        email: order.customer_email,
        fullName: order.customer_name,
        phone: order.customer_phone,
        college: order.customer_college,
      },
      client
    );
    const roleId = await findRoleIdForTenant({ tenantId: order.tenant_id, roleName: "Student" }, client);
    if (roleId) {
      await upsertMembership({ tenantId: order.tenant_id, userId, roleId }, client);
    }
    await paymentsRepo.ensureEnrollment(
      {
        userId,
        tenantId: order.tenant_id,
        itemType: order.item_type,
        itemId: order.item_id,
      },
      client
    );
  });
}

/**
 * Paid orders where provisioning never completed: no approval row, stale pending approval, or enrolled user missing access.
 * Use for one-off repairs (poller only touches recent batches).
 */
async function reconcilePaidOrdersMissingProvision(opts = {}) {
  const sinceDaysRaw = opts.sinceDays;
  const sinceDays = Number.isFinite(Number(sinceDaysRaw))
    ? Math.min(3650, Math.max(1, Number(sinceDaysRaw)))
    : 730;
  const batchSizeRaw = opts.batchSize;
  const batchSize = Number.isFinite(Number(batchSizeRaw)) ? Math.min(500, Math.max(1, Number(batchSizeRaw))) : 200;
  const dryRun = Boolean(opts.dryRun);
  const tenantId = opts.tenantId && String(opts.tenantId).trim() ? opts.tenantId.trim() : null;

  let processed = 0;
  let failed = 0;
  const errors = [];
  /** Keyset pagination so a row that keeps failing does not spin forever in one run. */
  let lastId = "00000000-0000-0000-0000-000000000000";

  for (;;) {
    const { rows } = await query(
      `SELECT po.*
       FROM payment_orders po
       LEFT JOIN approvals a
         ON a.payment_order_id = po.id
       LEFT JOIN users u
         ON LOWER(u.email) = LOWER(po.customer_email)
       LEFT JOIN enrollments e
         ON e.user_id = u.id
        AND e.tenant_id = po.tenant_id
        AND e.item_type = po.item_type
        AND e.item_id = po.item_id
        AND e.active = true
       WHERE po.status = 'paid'
         AND po.updated_at >= now() - ($1::int * INTERVAL '1 day')
         AND ($2::uuid IS NULL OR po.tenant_id = $2)
         AND po.id > $3::uuid
         AND (
           (u.id IS NOT NULL AND e.id IS NULL)
           OR (u.id IS NULL AND (a.id IS NULL OR a.status = 'pending'))
         )
       ORDER BY po.id ASC
       LIMIT $4`,
      [sinceDays, tenantId, lastId, batchSize]
    );

    if (!rows.length) break;

    for (const order of rows) {
      if (dryRun) {
        processed++;
        continue;
      }
      try {
        await reconcilePaidOrderProvision({
          order,
          razorpayOrderId: order.razorpay_order_id,
          razorpayPaymentId: null,
          rawPayload: null,
        });
        processed++;
      } catch (err) {
        failed++;
        const msg = err?.message || String(err);
        errors.push({ orderId: order.id, email: order.customer_email, message: msg });
        console.error(`[PaidOrderRepair] order ${order.id} (${order.customer_email}):`, msg);
      }
    }

    lastId = rows[rows.length - 1].id;
    if (rows.length < batchSize) break;
  }

  return { processed, failed, errors, dryRun, sinceDays, batchSize, tenantId };
}

async function reconcilePaidOrderProvision({
  order,
  razorpayOrderId,
  razorpayPaymentId = null,
  rawPayload = null,
}) {
  // Persist payment row (idempotent). Customer payment receipt email comes from Razorpay only.
  if (razorpayPaymentId) {
    let paymentRow = await paymentsRepo.createPaymentRecord({
      paymentOrderId: order.id,
      razorpayPaymentId,
      status: "captured",
      rawPayload,
    });
    if (!paymentRow) {
      paymentRow = await paymentsRepo.findPaymentByRazorpayId(razorpayPaymentId);
    }
  }

  const existingUser = await findUserByEmail(order.customer_email);
  const baseUrl = (order.redirect_origin || env.PUBLIC_WEB_URL).replace(/\/$/, "");

  if (existingUser?.id) {
    await ensureExistingUserProvisioned({ order, userId: existingUser.id });
    console.log(`[Payment] Existing user ${existingUser.id} enrolled in ${order.item_type} ${order.item_id}`);
    return { unlocked: true, redirect: `${baseUrl}/lms/student/courses` };
  }

  const approval = await approvalsRepo.createApproval({
    tenantId: order.tenant_id,
    paymentOrderId: order.id,
    itemType: order.item_type,
    itemId: order.item_id,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    customerCollege: order.customer_college,
    razorpayOrderId: razorpayOrderId || order.razorpay_order_id,
    razorpayPaymentId: razorpayPaymentId || null,
  });

  if (approval?.status === "approved") {
    return { unlocked: true, redirect: `${baseUrl}/lms/student/courses` };
  }

  const autoApproved = await tryAutoApprove(approval.id, order.customer_email);
  if (autoApproved) {
    return { unlocked: true, redirect: `${baseUrl}/lms/student/courses` };
  }

  return {
    redirect: `${baseUrl}/account-pending?email=${encodeURIComponent(order.customer_email)}`,
    approvalId: approval.id,
  };
}

async function handleCallback({ razorpay_payment_id, razorpay_order_id, razorpay_signature }) {
  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    console.error("[Payment] handleCallback missing params", { razorpay_payment_id: !!razorpay_payment_id, razorpay_order_id: !!razorpay_order_id, razorpay_signature: !!razorpay_signature });
    throw new HttpError(400, "Missing payment verification parameters");
  }

  if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    console.error("[Payment] Invalid Razorpay signature");
    throw new HttpError(400, "Invalid payment signature");
  }

  const order = await findPaymentOrderByRazorpayIdWithRetry(razorpay_order_id);
  if (!order) {
    console.error("[Payment] Order not found after retries for razorpay_order_id:", razorpay_order_id);
    throw new HttpError(404, "Order not found");
  }

  if (order.status !== "created" && order.status !== "paid") {
    throw new HttpError(400, "Order is not in a valid state for confirmation");
  }

  // Mark as paid if created (idempotent)
  if (order.status === "created") {
    await paymentsRepo.markOrderPaid(order.id);
  }

  // Always reconcile provisioning, even if order was already paid before this callback.
  return reconcilePaidOrderProvision({
    order,
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    rawPayload: null,
  });
}

async function handleWebhook({ rawBody, signature }) {
  if (!verifyWebhookSignature(rawBody, signature)) {
    throw new HttpError(400, "Invalid webhook signature");
  }

  const payload = JSON.parse(rawBody);
  const event = payload.event;

  if (event === "order.paid" || event === "payment.captured") {
    const orderEntity = payload.payload?.order?.entity;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderId = orderEntity?.id || paymentEntity?.order_id;
    const paymentId = paymentEntity?.id;
    if (!orderId) return;

    const order = await findPaymentOrderByRazorpayIdWithRetry(orderId, { maxAttempts: 6, baseDelayMs: 40 });
    if (!order) return;

    // Even if already paid, continue reconciliation to self-heal missed approvals/enrollments.
    if (order.status === "created") {
      await paymentsRepo.markOrderPaid(order.id);
    }

    await reconcilePaidOrderProvision({
      order,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId || null,
      rawPayload: payload,
    });
  }
}

async function tryAutoApprove(approvalId, email) {
  try {
    await approvalsService.approveById({ approvalId, approvedByUserId: null });
    console.log(`[AutoApproval] Approved ${approvalId} (${email})`);
    return true;
  } catch (err) {
    const msg = String(err?.message || "");
    if (msg.includes("Approval is already approved") || /\balready\s+approved\b/i.test(msg)) {
      return true;
    }
    console.error(`[AutoApproval] Failed for ${approvalId} (${email}):`, err.message);
    return false;
  }
}

// WARNING (Neon scale-to-zero):
// This background poller queries Postgres on a fixed interval even when no users are active.
// Only enable it in production if absolutely needed, otherwise it will prevent Neon from scaling to zero.
const AUTO_APPROVE_INTERVAL_MS = (() => {
  const v = parseInt(process.env.AUTO_APPROVE_INTERVAL_MS, 10);
  // Default: 5 minutes (was 60s)
  return Number.isFinite(v) && v > 0 ? v : 300_000;
})();
const MAX_AUTO_APPROVE_BATCH = 5;
const MAX_RECONCILE_BATCH = 5;
let pollerRunning = false;

async function pollPendingApprovals() {
  if (pollerRunning) return;
  pollerRunning = true;
  try {
    const { rows: tenants } = await query(`SELECT id FROM tenants LIMIT 10`);
    for (const tenant of tenants) {
      const pending = await approvalsRepo.listByStatus({ tenantId: tenant.id, status: "pending" });
      let approved = 0;
      for (const approval of pending) {
        if (approved >= MAX_AUTO_APPROVE_BATCH) break;
        await tryAutoApprove(approval.id, approval.customer_email);
        approved++;
      }

      // Self-heal paid orders that missed approval/enrollment due transient failures.
      const { rows: paidToReconcile } = await query(
        `SELECT po.*
         FROM payment_orders po
         LEFT JOIN approvals a
           ON a.payment_order_id = po.id
         LEFT JOIN users u
           ON LOWER(u.email) = LOWER(po.customer_email)
         LEFT JOIN enrollments e
           ON e.user_id = u.id
          AND e.tenant_id = po.tenant_id
          AND e.item_type = po.item_type
          AND e.item_id = po.item_id
          AND e.active = true
         WHERE po.tenant_id = $1
           AND po.status = 'paid'
           AND po.updated_at >= now() - INTERVAL '14 days'
           AND (
             (u.id IS NOT NULL AND e.id IS NULL)
             OR (u.id IS NULL AND (a.id IS NULL OR a.status = 'pending'))
           )
         ORDER BY po.updated_at DESC
         LIMIT $2`,
        [tenant.id, MAX_RECONCILE_BATCH]
      );
      for (const order of paidToReconcile) {
        try {
          await reconcilePaidOrderProvision({
            order,
            razorpayOrderId: order.razorpay_order_id,
            razorpayPaymentId: null,
            rawPayload: null,
          });
        } catch (err) {
          console.error("[AutoApproval] Reconcile paid order failed:", order.id, err?.message || err);
        }
      }
    }
  } catch (err) {
    console.error("[AutoApproval] Poller error:", err.message);
  } finally {
    pollerRunning = false;
  }
}

let pollerInterval = null;
function startAutoApprovalPoller() {
  if (pollerInterval) return;
  pollerInterval = setInterval(pollPendingApprovals, AUTO_APPROVE_INTERVAL_MS);
  console.log(`[AutoApproval] Background poller started (every ${AUTO_APPROVE_INTERVAL_MS / 1000}s)`);
}

function stopAutoApprovalPoller() {
  if (pollerInterval) {
    clearInterval(pollerInterval);
    pollerInterval = null;
  }
}

module.exports = {
  createOrder,
  getPriceBreakdown,
  handleCallback,
  handleWebhook,
  verifyRazorpaySignature,
  verifyWebhookSignature,
  reconcilePaidOrdersMissingProvision,
  startAutoApprovalPoller,
  stopAutoApprovalPoller,
};
